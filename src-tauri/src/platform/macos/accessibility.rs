//! The Accessibility API behind safe functions: with [`carbon`](super::carbon),
//! [`event_tap`](super::event_tap) and [`window_list`](super::window_list), the only modules with
//! `unsafe` code.
//!
//! Reading another app's menus needs the user to trust the app with Accessibility (Privacy &
//! Security → Accessibility). Asking adds it to that list, unchecked.

#![expect(
    unsafe_code,
    reason = "binds the Accessibility API; each unsafe block states why it's sound"
)]

use std::ptr::{self, NonNull};

use objc2_application_services::{
    AXCopyMultipleAttributeOptions, AXError, AXIsProcessTrusted, AXIsProcessTrustedWithOptions,
    AXUIElement, kAXTrustedCheckOptionPrompt,
};
use objc2_core_foundation::{
    CFArray, CFBoolean, CFDictionary, CFNumber, CFRetained, CFString, CFType, Type,
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
