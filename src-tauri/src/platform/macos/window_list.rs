//! Core Graphics' list of the windows on screen behind a safe function: with
//! [`accessibility`](super::accessibility), [`carbon`](super::carbon) and
//! [`event_tap`](super::event_tap), the only modules with `unsafe` code.
//!
//! Reading which process owns a window needs no permission, unlike reading its title.

#![expect(
    unsafe_code,
    reason = "reads Core Graphics' untyped window list; each unsafe block states why it's sound"
)]

use objc2_core_foundation::{CFDictionary, CFNumber, CFString, CFType};
use objc2_core_graphics::{
    CGWindowListCopyWindowInfo, CGWindowListOption, kCGNullWindowID, kCGWindowLayer,
    kCGWindowOwnerPID,
};

/// The layer of apps' ordinary windows. Menus, the Dock and the menu bar lie above it.
const NORMAL_LAYER: i32 = 0;

/// The processes owning the ordinary windows on screen, the topmost window's first. A process
/// appears once for each of its windows.
pub fn window_owners() -> Vec<i32> {
    let options =
        CGWindowListOption::OptionOnScreenOnly | CGWindowListOption::ExcludeDesktopElements;
    let Some(windows) = CGWindowListCopyWindowInfo(options, kCGNullWindowID) else {
        return Vec::new();
    };
    // SAFETY: the list holds a dictionary for each window, and dictionaries are CF objects.
    let windows = unsafe { windows.cast_unchecked::<CFType>() };

    windows
        .iter()
        .filter_map(|window| window.downcast::<CFDictionary>().ok())
        .filter_map(|window| owner_of_ordinary(&window))
        .collect()
}

/// The process owning `window`, if it's an ordinary one.
fn owner_of_ordinary(window: &CFDictionary) -> Option<i32> {
    // SAFETY: a window's description maps CFString keys (`kCGWindow…`) to CF objects.
    let window = unsafe { window.cast_unchecked::<CFString, CFType>() };
    // SAFETY: a constant the framework defines, which nothing writes.
    let layer = unsafe { kCGWindowLayer };
    // SAFETY: as above.
    let owner = unsafe { kCGWindowOwnerPID };

    (number(window, layer)? == NORMAL_LAYER)
        .then(|| number(window, owner))
        .flatten()
}

fn number(window: &CFDictionary<CFString, CFType>, key: &CFString) -> Option<i32> {
    window.get(key)?.downcast::<CFNumber>().ok()?.as_i32()
}
