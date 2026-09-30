//! Carbon's Text Input Sources and `UCKeyTranslate` behind safe functions: the only module with
//! `unsafe` code.
//!
//! No objc2 crate binds these C functions, so they're declared here from the SDK headers
//! (`HIToolbox/TextInputSources.h`, `HIToolbox/Keyboards.h`, `HIToolbox/Events.h`,
//! `CarbonCore/UnicodeUtilities.h`). Core Foundation's memory rules apply: what a _Copy_ function
//! returns is ours to release, which [`CFRetained`] does on drop; what a _Get_ function returns
//! belongs to its owner and mustn't outlive it.

#![expect(
    unsafe_code,
    reason = "binds Carbon's C API; each unsafe block states why it's sound"
)]

use std::ffi::c_void;
use std::ptr::{self, NonNull};
use std::sync::atomic::{AtomicBool, Ordering};

use objc2::MainThreadMarker;
use objc2_core_foundation::{
    CFData, CFDictionary, CFNotificationCenter, CFNotificationName,
    CFNotificationSuspensionBehavior, CFRetained, CFString, CFType, ConcreteType,
};

use crate::error::AppError;

/// `UCKeyboardLayout`: a layout's key tables, only ever used behind a pointer.
#[repr(C)]
struct UcKeyboardLayout {
    _private: [u8; 0],
}

#[link(name = "Carbon", kind = "framework")]
unsafe extern "C" {
    static kTISPropertyInputSourceID: Option<&'static CFString>;
    static kTISPropertyUnicodeKeyLayoutData: Option<&'static CFString>;
    static kTISNotifySelectedKeyboardInputSourceChanged: Option<&'static CFString>;

    fn TISCopyCurrentKeyboardLayoutInputSource() -> Option<NonNull<CFType>>;
    fn TISGetInputSourceProperty(source: &CFType, key: &CFString) -> *const c_void;
    fn LMGetKbdType() -> u8;
    fn KBGetLayoutType(keyboard_type: i16) -> u32;
    fn UCKeyTranslate(
        layout: *const UcKeyboardLayout,
        virtual_key: u16,
        action: u16,
        modifiers: u32,
        keyboard_type: u32,
        options: u32,
        dead_key_state: &mut u32,
        max_length: usize,
        length: &mut usize,
        characters: *mut u16,
    ) -> i32;
}

/// `kUCKeyActionDown`: what the key types when pressed.
const KEY_DOWN: u16 = 0;

/// `kUCKeyTranslateNoDeadKeysMask`: a dead key types its own character (`^`) instead of waiting
/// for the next key.
const NO_DEAD_KEYS: u32 = 1;

/// The most UTF-16 units one key press types; `UCKeyTranslate` shortens longer output.
const MAX_LENGTH: usize = 4;

/// The Text Input Sources API, which only works on the main thread: it isn't thread safe, and its
/// notifications arrive on the run loop of the thread that registered for them.
///
/// Holding one proves the code runs on the main thread. It's only made there and, like the
/// [`MainThreadMarker`] it holds, can't be sent to another thread, so the compiler checks what a
/// runtime check would otherwise do on every call.
#[derive(Copy, Clone, Debug)]
pub struct TextInputSources {
    _main_thread: MainThreadMarker,
}

#[expect(
    clippy::unused_self,
    reason = "`self` proves the main thread; it carries no data"
)]
impl TextInputSources {
    /// Access to the API, if called on the main thread.
    ///
    /// # Errors
    ///
    /// Returns [`AppError::Keymap`] when called off the main thread.
    pub fn new() -> Result<Self, AppError> {
        MainThreadMarker::new()
            .map(|main_thread| Self {
                _main_thread: main_thread,
            })
            .ok_or_else(|| AppError::keymap("the layout can only be used on the main thread"))
    }

    /// The keyboard layout input source the user selected, if any.
    #[must_use]
    pub fn selected_layout(self) -> Option<CFRetained<CFType>> {
        // SAFETY: called on the main thread, which `self` proves.
        let pointer = unsafe { TISCopyCurrentKeyboardLayoutInputSource() }?;
        // SAFETY: a Copy function returns a reference we own, which `CFRetained` takes over and
        // releases.
        Some(unsafe { CFRetained::from_raw(pointer) })
    }

    /// The system's ID of an input source, such as `com.apple.keylayout.German`.
    #[must_use]
    pub fn id(self, source: &CFType) -> Option<&CFString> {
        // SAFETY: a constant the framework defines for the whole run.
        let key = unsafe { kTISPropertyInputSourceID }?;
        self.property(source, key)
    }

    /// The key tables (`UCKeyboardLayout` data) of a keyboard layout input source.
    #[must_use]
    pub fn key_tables(self, source: &CFType) -> Option<&CFData> {
        // SAFETY: a constant the framework defines for the whole run.
        let key = unsafe { kTISPropertyUnicodeKeyLayoutData }?;
        self.property(source, key)
    }

    /// The keyboard type of the connected keyboard, for [`layout_type`] and [`translate`].
    #[must_use]
    pub fn connected_keyboard_type(self) -> u8 {
        // SAFETY: reads a system value, on the main thread (it isn't thread safe).
        unsafe { LMGetKbdType() }
    }

    /// Calls `on_change` whenever the user selects another keyboard layout, for as long as the
    /// app runs. Input methods (Japanese, the emoji picker) post the same notification, so the
    /// layout may be the same one. `observing` is claimed for it: the observer is leaked, so a
    /// second registration would leak another one and report every change twice.
    ///
    /// # Errors
    ///
    /// Returns [`AppError::Keymap`] if macOS offers no distributed notification center or no name
    /// for the notification, or if `observing` was claimed before.
    pub fn observe_selection<F: Fn() + 'static>(
        self,
        observing: &AtomicBool,
        on_change: F,
    ) -> Result<(), AppError> {
        let center = CFNotificationCenter::distributed_center()
            .ok_or_else(|| AppError::keymap("there's no distributed notification center"))?;
        // SAFETY: a constant the framework defines for the whole run.
        let name = unsafe { kTISNotifySelectedKeyboardInputSourceChanged };
        let name = name.ok_or_else(|| AppError::keymap("there's no layout change notification"))?;
        // Claimed only now, so a registration that failed above can be tried again.
        claim_once(observing)?;
        // Observed for the whole run and never removed, so the callback is leaked on purpose.
        let observer: &'static F = Box::leak(Box::new(on_change));

        // SAFETY: `observer` stays valid forever (leaked above), and `selection_changed::<F>`
        // reads it back as the type it is. A null object observes the notification from any
        // sender. Registering on the main thread, which `self` proves, delivers the notification
        // on the main run loop.
        unsafe {
            center.add_observer(
                ptr::from_ref(observer).cast(),
                Some(selection_changed::<F>),
                Some(name),
                ptr::null(),
                CFNotificationSuspensionBehavior::DeliverImmediately,
            );
        }

        Ok(())
    }

    /// A property of an input source, if it has one of type `T`. The value is borrowed from the
    /// source, so the lifetime keeps it from outliving it.
    fn property<'source, T: ConcreteType>(
        self,
        source: &'source CFType,
        key: &CFString,
    ) -> Option<&'source T> {
        // SAFETY: called on the main thread, which `self` proves, with references valid for the
        // call.
        let pointer = unsafe { TISGetInputSourceProperty(source, key) };
        let pointer = pointer.cast::<CFType>();
        // SAFETY: a Get function returns null or a CF object owned by `source`, alive as long as
        // `source` is. `downcast_ref` checks its type before it's used as a `T`.
        let value = unsafe { pointer.as_ref() }?;

        value.downcast_ref()
    }
}

/// Claims `flag` for the one registration it stands for.
///
/// # Errors
///
/// Returns [`AppError::Keymap`] if it was claimed before.
fn claim_once(flag: &AtomicBool) -> Result<(), AppError> {
    // Only the flag itself is shared, no data it guards, so the weakest ordering is enough.
    if flag.swap(true, Ordering::Relaxed) {
        Err(AppError::keymap("the layout is observed already"))
    } else {
        Ok(())
    }
}

/// The physical layout of a keyboard type, as a four-character code (`kKeyboardISO`, …).
#[must_use]
pub fn layout_type(keyboard_type: u8) -> u32 {
    // SAFETY: a lookup by value, with no pointers involved.
    unsafe { KBGetLayoutType(i16::from(keyboard_type)) }
}

/// What `key` types with `modifiers` (in `UCKeyTranslate`'s modifier state), on a keyboard of
/// `keyboard_type`, as the layout's `tables` say.
///
/// # Errors
///
/// Returns [`AppError::Keymap`] if `UCKeyTranslate` fails, or reports more characters than fit or
/// invalid UTF-16.
pub fn translate(
    tables: &CFData,
    key: u16,
    modifiers: u32,
    keyboard_type: u8,
) -> Result<String, AppError> {
    let mut dead_key_state = 0;
    let mut length = 0;
    let mut units = [0_u16; MAX_LENGTH];

    // SAFETY: `tables` is the layout's `UCKeyboardLayout` data, alive for the call. The output
    // buffer holds `MAX_LENGTH` units, the length we pass, and the other pointers are to locals.
    let status = unsafe {
        UCKeyTranslate(
            tables.byte_ptr().cast(),
            key,
            KEY_DOWN,
            modifiers,
            u32::from(keyboard_type),
            NO_DEAD_KEYS,
            &mut dead_key_state,
            MAX_LENGTH,
            &mut length,
            units.as_mut_ptr(),
        )
    };

    if status != 0 {
        return Err(AppError::keymap(format!(
            "key {key:#04x} with modifiers {modifiers:#04x} failed with status {status}"
        )));
    }

    let typed = units.get(..length).ok_or_else(|| {
        AppError::keymap(format!(
            "key {key:#04x} typed {length} units, more than fit"
        ))
    })?;
    String::from_utf16(typed).map_err(|_| AppError::keymap("a key typed invalid UTF-16"))
}

/// What the notification center calls when the input source changes: the callback registered in
/// [`TextInputSources::observe_selection`], passed as the observer.
unsafe extern "C-unwind" fn selection_changed<F: Fn()>(
    _center: *mut CFNotificationCenter,
    observer: *mut c_void,
    _name: *const CFNotificationName,
    _object: *const c_void,
    _user_info: *const CFDictionary,
) {
    // SAFETY: the observer is the `F` that `observe_selection::<F>` leaked, so it's alive.
    if let Some(on_change) = unsafe { observer.cast::<F>().as_ref() } {
        on_change();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn observes_only_once() {
        let observing = AtomicBool::new(false);

        let first = claim_once(&observing);
        let second = claim_once(&observing).map_err(|error| error.to_string());

        assert!(first.is_ok());
        assert_eq!(
            second,
            Err("cannot read the keyboard layout: the layout is observed already".to_owned())
        );
    }

    #[test]
    fn is_refused_off_the_main_thread() {
        let on_another_thread = std::thread::spawn(|| TextInputSources::new().is_err()).join();

        assert!(matches!(on_another_thread, Ok(true)));
    }
}
