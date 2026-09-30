//! Reads the keyboard layout in use through Carbon's Text Input Sources and `UCKeyTranslate`.
//!
//! The only module that calls these C functions. No objc2 crate binds them, so they're declared
//! here from the SDK headers (`HIToolbox/TextInputSources.h`, `HIToolbox/Keyboards.h`,
//! `HIToolbox/Events.h`, `CarbonCore/UnicodeUtilities.h`). Core Foundation's memory rules apply:
//! what a _Copy_ function returns is ours to release, which [`CFRetained`] does on drop; what a
//! _Get_ function returns belongs to its owner and mustn't outlive it.

#![allow(
    unsafe_code,
    reason = "calls Carbon's C API; each unsafe block states why it's sound"
)]

use std::ffi::c_void;
use std::ptr::NonNull;

use objc2_core_foundation::{CFData, CFRetained, CFRunLoop, CFString, CFType, ConcreteType};

use super::keymap::{Keyboard, key_positions};
use crate::error::AppError;
use crate::platform::{KeyCharacters, Keymap, Layout};

/// `UCKeyboardLayout`: a layout's key tables, only ever used behind a pointer.
#[repr(C)]
struct UcKeyboardLayout {
    _private: [u8; 0],
}

#[link(name = "Carbon", kind = "framework")]
unsafe extern "C" {
    static kTISPropertyInputSourceID: Option<&'static CFString>;
    static kTISPropertyUnicodeKeyLayoutData: Option<&'static CFString>;

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

/// `kKeyboardISO`, the four-character code `KBGetLayoutType` returns for ISO keyboards.
const ISO_KEYBOARD: u32 = u32::from_be_bytes(*b"ISO ");

/// `kUCKeyActionDown`: what the key types when pressed.
const KEY_DOWN: u16 = 0;

/// `kUCKeyTranslateNoDeadKeysMask`: a dead key types its own character (`^`) instead of waiting
/// for the next key.
const NO_DEAD_KEYS: u32 = 1;

/// Shift in `UCKeyTranslate`'s modifier state (`shiftKey >> 8`).
const SHIFT: u32 = 0x02;

/// Option in `UCKeyTranslate`'s modifier state (`optionKey >> 8`).
const OPTION: u32 = 0x08;

/// The most UTF-16 units one key press types; `UCKeyTranslate` shortens longer output.
const MAX_LENGTH: usize = 4;

/// Reads the keyboard layout the user selected, and what each key types on this keyboard.
///
/// # Errors
///
/// Returns [`AppError::Keymap`] when called off the main thread (the Text Input Sources API isn't
/// thread safe), when no layout or key tables are reported, or when a key can't be translated.
pub fn current_layout() -> Result<Layout, AppError> {
    if CFRunLoop::current() != CFRunLoop::main() {
        return Err(keymap_error(
            "the layout can only be read on the main thread",
        ));
    }

    // SAFETY: on the main thread, as the API requires. A Copy function returns a reference we
    // own, which `CFRetained` takes over and releases.
    let source = unsafe { TISCopyCurrentKeyboardLayoutInputSource() }
        .map(|pointer| unsafe { CFRetained::from_raw(pointer) })
        .ok_or_else(|| keymap_error("no keyboard layout is selected"))?;
    // SAFETY: the keys are constants the framework defines for the whole run.
    let (id_key, data_key) =
        unsafe { (kTISPropertyInputSourceID, kTISPropertyUnicodeKeyLayoutData) };
    let id = id_key
        .and_then(|key| property::<CFString>(&source, key))
        .ok_or_else(|| keymap_error("the layout has no ID"))?;
    let tables = data_key
        .and_then(|key| property::<CFData>(&source, key))
        .ok_or_else(|| keymap_error("the layout has no key tables"))?;

    // SAFETY: reads a system value, on the main thread (it isn't thread safe).
    let keyboard_type = unsafe { LMGetKbdType() };
    let keymap = key_positions(keyboard_of(keyboard_type))
        .map(|(key, code)| Ok((code, characters(tables, key, keyboard_type)?)))
        .collect::<Result<Keymap, AppError>>()?;

    Ok(Layout {
        id: id.to_string(),
        keymap,
    })
}

/// A property of an input source, if it has one of type `T`. The value is borrowed from the
/// source, so the lifetime keeps it from outliving it.
fn property<'source, T: ConcreteType>(
    source: &'source CFType,
    key: &CFString,
) -> Option<&'source T> {
    // SAFETY: a Get function: the value is null or a CF object owned by `source`, alive as long as
    // `source` is. `downcast_ref` checks its type before it's used as a `T`.
    let value = unsafe {
        TISGetInputSourceProperty(source, key)
            .cast::<CFType>()
            .as_ref()
    }?;

    value.downcast_ref()
}

/// Whether a keyboard type (from `LMGetKbdType`) is an ISO keyboard.
fn keyboard_of(keyboard_type: u8) -> Keyboard {
    // SAFETY: a lookup by value, with no pointers involved.
    if unsafe { KBGetLayoutType(i16::from(keyboard_type)) } == ISO_KEYBOARD {
        Keyboard::Iso
    } else {
        Keyboard::Ansi
    }
}

/// What a key types without a modifier and with Shift, Option or both.
fn characters(tables: &CFData, key: u16, keyboard_type: u8) -> Result<KeyCharacters, AppError> {
    let typed = |modifiers| translate(tables, key, modifiers, keyboard_type);

    Ok(KeyCharacters {
        value: typed(0)?,
        with_shift: typed(SHIFT)?,
        with_alt: typed(OPTION)?,
        with_shift_alt: typed(SHIFT | OPTION)?,
    })
}

/// What a key types with the given modifiers, as `UCKeyTranslate` reports it.
fn translate(
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
        return Err(keymap_error(&format!(
            "key {key:#04x} with modifiers {modifiers:#04x} failed with status {status}"
        )));
    }

    let typed = units.get(..length).unwrap_or(&units);
    String::from_utf16(typed).map_err(|_| keymap_error("a key typed invalid UTF-16"))
}

/// A keymap error with a message for the logs.
fn keymap_error(message: &str) -> AppError {
    AppError::Keymap(message.to_owned())
}
