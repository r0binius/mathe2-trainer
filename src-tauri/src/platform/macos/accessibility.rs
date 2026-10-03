//! The Accessibility API behind safe functions: with [`carbon`](super::carbon),
//! [`event_tap`](super::event_tap) and [`window_list`](super::window_list), the only modules with
//! `unsafe` code.
//!
//! Reading another app's menus, and observing them, needs the user to trust the app with
//! Accessibility (Privacy & Security → Accessibility). Asking adds it to that list, unchecked.

#![expect(
    unsafe_code,
    reason = "binds the Accessibility API; each unsafe block states why it's sound"
)]

use std::ffi::c_void;
use std::ptr::{self, NonNull};

use objc2::MainThreadMarker;
use objc2_application_services::{
    AXCopyMultipleAttributeOptions, AXError, AXIsProcessTrusted, AXIsProcessTrustedWithOptions,
    AXObserver, AXUIElement, AXValue, AXValueType, kAXTrustedCheckOptionPrompt,
};
use objc2_core_foundation::{
    CFArray, CFBoolean, CFDictionary, CFNumber, CFRetained, CFRunLoop, CFRunLoopSource, CFString,
    CFType, CGPoint, CGSize, Type, kCFRunLoopCommonModes,
};

use crate::error::AppError;

/// Whether the user trusts the app with Accessibility.
pub fn is_trusted() -> bool {
    // SAFETY: takes nothing, and only reads the app's permission.
    unsafe { AXIsProcessTrusted() }
}

/// Asks the user to trust the app with Accessibility. Only the first time does macOS show its
/// prompt; it does so asynchronously.
pub fn ask_for_trust() {
    // SAFETY: a constant the framework defines, which nothing writes.
    let prompt: &CFString = unsafe { kAXTrustedCheckOptionPrompt };
    let options = CFDictionary::from_slices(&[prompt], &[CFBoolean::new(true)]);

    // SAFETY: the options map the prompt key to a boolean, as the function documents. Whether
    // the app is trusted already is asked again on every lookup, so the answer isn't needed here.
    unsafe { AXIsProcessTrustedWithOptions(Some(options.as_ref())) };
}

/// Something another app shows, such as its menu bar or a menu item, as the Accessibility API
/// sees it.
#[derive(Debug)]
pub struct Element(CFRetained<AXUIElement>);

/// The value of an [`Element`]'s attribute, in the forms the menus use.
#[derive(Debug)]
pub enum Value {
    /// Text, such as a title.
    Text(String),
    /// A number, such as a modifier mask.
    Number(i64),
    /// One element, such as an app's menu bar.
    Element(Element),
    /// Several elements, such as a menu's items.
    Elements(Vec<Element>),
    /// A point on screen, such as an element's position, in global display coordinates with the
    /// origin at the top left.
    Point(CGPoint),
    /// A size, such as an element's.
    Size(CGSize),
    /// The element doesn't have the attribute, or its value has another form.
    Missing,
}

impl Element {
    /// The app running as `process`, whose every answer the app waits for at most `timeout`
    /// seconds.
    ///
    /// # Errors
    ///
    /// Returns a lookup error if the timeout isn't positive.
    pub fn application(process: i32, timeout: f32) -> Result<Self, AppError> {
        // SAFETY: any process ID makes an element; one without an app fails when it's asked.
        let app = Self(unsafe { AXUIElement::new_application(process) });
        // SAFETY: the element is valid, and a bad timeout is returned as an error.
        let set = unsafe { app.0.set_messaging_timeout(timeout) };

        check(set)?;
        Ok(app)
    }

    /// The values of the element's `attributes`, in their order, read in one message to the app.
    ///
    /// # Errors
    ///
    /// Returns a lookup error if the app doesn't answer, such as when it hangs or has quit.
    pub fn values(&self, attributes: &[&str]) -> Result<Vec<Value>, AppError> {
        let names: Vec<_> = attributes
            .iter()
            .map(|&name| CFString::from_str(name))
            .collect();
        let names = CFArray::from_retained_objects(&names);
        let mut values: *const CFArray = ptr::null();

        // SAFETY: `names` holds CFStrings, as the function expects, and `values` is a valid
        // pointer to write the answer to. Without `StopOnError`, a missing attribute is reported
        // in its place in the answer.
        let read = unsafe {
            self.0.copy_multiple_attribute_values(
                names.as_ref(),
                AXCopyMultipleAttributeOptions::empty(),
                NonNull::from(&mut values),
            )
        };
        check(read)?;
        let values = NonNull::new(values.cast_mut())
            .ok_or_else(|| AppError::lookup("the app answered with nothing"))?;
        // SAFETY: a _Copy_ function's answer is ours to release.
        let answer: CFRetained<CFArray> = unsafe { CFRetained::from_raw(values) };
        // SAFETY: the answer holds a CF object for each attribute.
        let values = unsafe { answer.cast_unchecked::<CFType>() };

        Ok(values.iter().map(|value| value_of(&value)).collect())
    }
}

/// An attribute's value in the form [`Value`] knows it by.
fn value_of(value: &CFType) -> Value {
    if let Some(text) = value.downcast_ref::<CFString>() {
        Value::Text(text.to_string())
    } else if let Some(number) = value.downcast_ref::<CFNumber>() {
        number.as_i64().map_or(Value::Missing, Value::Number)
    } else if let Some(element) = value.downcast_ref::<AXUIElement>() {
        Value::Element(Element(element.retain()))
    } else if let Some(array) = value.downcast_ref::<CFArray>() {
        Value::Elements(elements_of(array))
    } else if let Some(geometry) = value.downcast_ref::<AXValue>() {
        geometry_of(geometry)
    } else {
        Value::Missing
    }
}

/// A point or a size an [`AXValue`] wraps, the geometry elements report.
fn geometry_of(value: &AXValue) -> Value {
    // SAFETY: the value is a valid AXValue, which knows its own type.
    let kind = unsafe { value.r#type() };

    if kind == AXValueType::CGPoint {
        let mut point = CGPoint::default();
        // SAFETY: the value holds a CGPoint, which `point` has room for.
        let read = unsafe { value.value(kind, NonNull::from(&mut point).cast()) };
        if read {
            Value::Point(point)
        } else {
            Value::Missing
        }
    } else if kind == AXValueType::CGSize {
        let mut size = CGSize::default();
        // SAFETY: the value holds a CGSize, which `size` has room for.
        let read = unsafe { value.value(kind, NonNull::from(&mut size).cast()) };
        if read {
            Value::Size(size)
        } else {
            Value::Missing
        }
    } else {
        Value::Missing
    }
}

/// The elements in `array`, skipping anything else.
fn elements_of(array: &CFArray) -> Vec<Element> {
    // SAFETY: an attribute's array holds CF objects, which are then checked one by one.
    let array = unsafe { array.cast_unchecked::<CFType>() };

    array
        .iter()
        .filter_map(|item| item.downcast::<AXUIElement>().ok())
        .map(Element)
        .collect()
}

/// How long an element passed to an [`Observer`] waits for its app's answers, in seconds. Those
/// are read on the main thread while the user moves through a menu, so a hanging app mustn't
/// stall Mouseless.
const NOTIFIED_TIMEOUT: f32 = 0.25;

/// What an [`Observer`] calls for every notification: its name, such as `AXMenuClosed`, and the
/// element it's about.
pub type OnNotification = Box<dyn Fn(&str, Element)>;

/// Accessibility notifications of one app, delivered on the main run loop until the observer is
/// dropped.
///
/// It holds a [`MainThreadMarker`], so it can't leave the main thread: it's made, called and
/// dropped where its notifications arrive, the only thread that touches its callback.
#[derive(Debug)]
pub struct Observer {
    /// The Accessibility API's observer, released with this value.
    handle: CFRetained<AXObserver>,
    source: CFRetained<CFRunLoopSource>,
    /// The callback, owned by this value and freed on drop.
    on_notification: NonNull<OnNotification>,
    /// Keeps the observer on the main thread: the marker can't be sent to another one.
    _main_thread: MainThreadMarker,
}

impl Observer {
    /// Calls `on_notification` for each of `notifications` the app running as `process` posts,
    /// until the observer is dropped.
    ///
    /// # Errors
    ///
    /// Returns a lookup error if the app can't be observed, such as when access isn't granted or
    /// the app has quit, or doesn't post one of the notifications.
    pub fn new(
        main_thread: MainThreadMarker,
        process: i32,
        notifications: &[&str],
        on_notification: OnNotification,
    ) -> Result<Self, AppError> {
        let handle = created_observer(process)?;
        // SAFETY: the observer is valid, and its source lives as long as it's retained.
        let source = unsafe { handle.run_loop_source() };
        let observed = Self {
            handle,
            source,
            on_notification: NonNull::from(Box::leak(Box::new(on_notification))),
            _main_thread: main_thread,
        };
        // SAFETY: any process ID makes an element; one without an app fails when it's observed.
        let app = unsafe { AXUIElement::new_application(process) };

        for name in notifications {
            // SAFETY: the observer and element are valid, and the refcon is the callback this
            // value owns, which outlives every notification.
            let added = unsafe {
                observed.handle.add_notification(
                    &app,
                    &CFString::from_str(name),
                    observed.on_notification.as_ptr().cast::<c_void>(),
                )
            };
            check(added)?;
        }
        CFRunLoop::main()
            .ok_or_else(|| AppError::lookup("there's no main run loop"))?
            .add_source(Some(&observed.source), common_modes());
        Ok(observed)
    }
}

impl Drop for Observer {
    fn drop(&mut self) {
        if let Some(main) = CFRunLoop::main() {
            main.remove_source(Some(&self.source), common_modes());
        }
        // SAFETY: the source is off the run loop, so no notification calls back anymore, and the
        // callback came from `Box::leak` in `new`. The observer itself is released with `self`.
        drop(unsafe { Box::from_raw(self.on_notification.as_ptr()) });
    }
}

/// A new observer of `process`, whose notifications go to [`on_notification`].
fn created_observer(process: i32) -> Result<CFRetained<AXObserver>, AppError> {
    let mut observer: *mut AXObserver = ptr::null_mut();
    // SAFETY: the callback has the signature the API calls, and `observer` is a valid pointer to
    // write the new observer to.
    let created =
        unsafe { AXObserver::create(process, Some(on_notification), NonNull::from(&mut observer)) };
    check(created)?;
    let observer =
        NonNull::new(observer).ok_or_else(|| AppError::lookup("the API made no observer"))?;

    // SAFETY: a _Create_ function's result is ours to release.
    Ok(unsafe { CFRetained::from_raw(observer) })
}

/// The observers' callback, which the Accessibility API calls on the main run loop.
unsafe extern "C-unwind" fn on_notification(
    _observer: NonNull<AXObserver>,
    element: NonNull<AXUIElement>,
    notification: NonNull<CFString>,
    refcon: *mut c_void,
) {
    // SAFETY: the refcon is the callback an `Observer` owns, which outlives every notification,
    // and this runs on the main thread, the only one that touches it.
    let callback = unsafe { refcon.cast::<OnNotification>().as_ref() };
    let Some(callback) = callback else {
        return;
    };
    // SAFETY: the API passes an element that's valid for the length of the call.
    let element = unsafe { element.as_ref() }.retain();
    // SAFETY: the API passes a notification name that's valid for the length of the call.
    let name = unsafe { notification.as_ref() }.to_string();
    // SAFETY: the element is valid; a timeout the API refuses keeps its default.
    unsafe { element.set_messaging_timeout(NOTIFIED_TIMEOUT) };

    callback(&name, Element(element));
}

fn common_modes() -> Option<&'static objc2_core_foundation::CFRunLoopMode> {
    // SAFETY: Core Foundation defines this constant for the whole life of the process.
    unsafe { kCFRunLoopCommonModes }
}

fn check(error: AXError) -> Result<(), AppError> {
    if error == AXError::Success {
        Ok(())
    } else {
        Err(AppError::lookup(format!(
            "the Accessibility API failed with error {}",
            error.0
        )))
    }
}
