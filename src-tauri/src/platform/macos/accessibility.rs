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

use objc2_application_services::{
    AXIsProcessTrusted, AXIsProcessTrustedWithOptions, kAXTrustedCheckOptionPrompt,
};
use objc2_core_foundation::{CFBoolean, CFDictionary, CFString};

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
