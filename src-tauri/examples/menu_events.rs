//! Spike for step 18.3: prints what the Accessibility API reports while an app's menus are used,
//! to find out whether choosing a menu item can be told apart from highlighting one.
//!
//! `cargo run --example menu_events -- $(pgrep -x Notes)` observes the app with that process ID
//! until Ctrl-C. The terminal needs Accessibility access (Privacy & Security → Accessibility).
//! Each line is the time, the notification, and the element's role, title and key equivalent.

#![expect(
    unsafe_code,
    reason = "a throwaway spike that observes the Accessibility API"
)]
#![expect(
    clippy::print_stdout,
    clippy::print_stderr,
    reason = "what macOS reports is the spike's output"
)]

use std::ffi::c_void;
use std::ptr::{self, NonNull};
use std::sync::OnceLock;
use std::time::Instant;

use objc2_application_services::{AXError, AXObserver, AXUIElement};
use objc2_core_foundation::{
    CFArray, CFNumber, CFRetained, CFRunLoop, CFString, CFType, kCFRunLoopDefaultMode,
};

/// What's observed: menus opening and closing, items chosen, and the selection moving, which
/// may be how a highlight shows up.
const NOTIFICATIONS: [&str; 5] = [
    "AXMenuOpened",
    "AXMenuClosed",
    "AXMenuItemSelected",
    "AXSelectedChildrenChanged",
    "AXFocusedUIElementChanged",
];

/// What's printed of each element.
const ATTRIBUTES: [&str; 4] = [
    "AXRole",
    "AXTitle",
    "AXMenuItemCmdChar",
    "AXMenuItemCmdModifiers",
];

/// When observing started, so the lines show how far apart the notifications came.
static STARTED: OnceLock<Instant> = OnceLock::new();

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let process: i32 = std::env::args()
        .nth(1)
        .ok_or("usage: cargo run --example menu_events -- <process ID>")?
        .parse()?;
    let observer = observer(process)?;
    // SAFETY: any process ID makes an element; one without an app fails when it's observed.
    let app = unsafe { AXUIElement::new_application(process) };

    for name in NOTIFICATIONS {
        // SAFETY: the observer and element are valid, and the callback ignores the null refcon.
        let added =
            unsafe { observer.add_notification(&app, &CFString::from_str(name), ptr::null_mut()) };
        eprintln!("{name}: {}", described(added));
    }

    // SAFETY: the observer is valid; its source lives as long as it's retained here.
    let source = unsafe { observer.run_loop_source() };
    let run_loop = CFRunLoop::current().ok_or("there's no run loop")?;
    // SAFETY: Core Foundation defines this constant for the whole life of the process.
    let mode = unsafe { kCFRunLoopDefaultMode };

    run_loop.add_source(Some(&source), mode);
    STARTED.get_or_init(Instant::now);
    eprintln!("Observing process {process}; use its menus, then press Ctrl-C.");
    CFRunLoop::run();
    Ok(())
}

/// An observer of `process` that prints every notification.
fn observer(process: i32) -> Result<CFRetained<AXObserver>, Box<dyn std::error::Error>> {
    let mut observer: *mut AXObserver = ptr::null_mut();
    // SAFETY: the callback has the signature the API calls, and `observer` is a valid pointer to
    // write the new observer to.
    let created =
        unsafe { AXObserver::create(process, Some(on_notification), NonNull::from(&mut observer)) };

    if created != AXError::Success {
        return Err(format!("cannot observe process {process}: {}", described(created)).into());
    }

    let observer = NonNull::new(observer).ok_or("the API made no observer")?;
    // SAFETY: a _Create_ function's result is ours to release.
    Ok(unsafe { CFRetained::from_raw(observer) })
}

/// Prints one notification with the element it's about.
unsafe extern "C-unwind" fn on_notification(
    _observer: NonNull<AXObserver>,
    element: NonNull<AXUIElement>,
    notification: NonNull<CFString>,
    _refcon: *mut c_void,
) {
    // SAFETY: the API passes an element that's valid for the length of the call.
    let element = unsafe { element.as_ref() };
    // SAFETY: the API passes a notification name that's valid for the length of the call.
    let notification = unsafe { notification.as_ref() };
    let elapsed = STARTED
        .get()
        .map_or(0, |started| started.elapsed().as_millis());
    let values: Vec<String> = ATTRIBUTES
        .iter()
        .map(|&name| attribute(element, name))
        .collect();

    println!("{elapsed:>7} ms  {notification:<26} {}", values.join(" | "));

    // A menu whose selection changed: print the item now highlighted, if it can be read.
    if notification.to_string() == "AXSelectedChildrenChanged"
        && values.first().is_some_and(|role| role == "AXMenu")
    {
        for item in selected_children(element) {
            let item_values: Vec<String> = ATTRIBUTES
                .iter()
                .map(|&name| attribute(&item, name))
                .collect();
            println!("{:>7}     highlighted: {}", "", item_values.join(" | "));
        }
    }
}

/// The elements a menu reports as selected, which is the highlighted item.
fn selected_children(menu: &AXUIElement) -> Vec<CFRetained<AXUIElement>> {
    let mut value: *const CFType = ptr::null();
    // SAFETY: the element is valid, the name is a CFString, and `value` is a valid pointer to
    // write the answer to.
    let read = unsafe {
        menu.copy_attribute_value(
            &CFString::from_str("AXSelectedChildren"),
            NonNull::from(&mut value),
        )
    };
    let Some(value) = NonNull::new(value.cast_mut()).filter(|_| read == AXError::Success) else {
        return Vec::new();
    };
    // SAFETY: a _Copy_ function's answer is ours to release.
    let value: CFRetained<CFType> = unsafe { CFRetained::from_raw(value) };
    let Ok(array) = value.downcast::<CFArray>() else {
        return Vec::new();
    };
    // SAFETY: an attribute's array holds CF objects, which are then checked one by one.
    let array = unsafe { array.cast_unchecked::<CFType>() };

    array
        .iter()
        .filter_map(|item| item.downcast::<AXUIElement>().ok())
        .collect()
}

/// An attribute's value as text, or `-` when the element doesn't have it.
fn attribute(element: &AXUIElement, name: &str) -> String {
    let mut value: *const CFType = ptr::null();
    // SAFETY: the element is valid, the name is a CFString, and `value` is a valid pointer to
    // write the answer to.
    let read = unsafe {
        element.copy_attribute_value(&CFString::from_str(name), NonNull::from(&mut value))
    };
    let Some(value) = NonNull::new(value.cast_mut()).filter(|_| read == AXError::Success) else {
        return "-".to_owned();
    };
    // SAFETY: a _Copy_ function's answer is ours to release.
    let value: CFRetained<CFType> = unsafe { CFRetained::from_raw(value) };

    if let Some(text) = value.downcast_ref::<CFString>() {
        text.to_string()
    } else if let Some(number) = value.downcast_ref::<CFNumber>() {
        number
            .as_i64()
            .map_or_else(|| "-".to_owned(), |number| number.to_string())
    } else {
        format!("{value:?}")
    }
}

fn described(error: AXError) -> String {
    if error == AXError::Success {
        "observed".to_owned()
    } else {
        format!("error {}", error.0)
    }
}
