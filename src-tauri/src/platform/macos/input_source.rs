//! Reads the keyboard layout in use: its ID, and what each key types, from what [`carbon`]
//! reports.

use objc2_core_foundation::CFData;

use crate::error::AppError;
use crate::platform::macos::carbon::{self, TextInputSources};
use crate::platform::macos::keymap::{Keyboard, key_positions};
use crate::platform::{KeyCharacters, Keymap, Layout};

/// `kKeyboardANSI`, the four-character code `KBGetLayoutType` returns for ANSI keyboards.
const ANSI_KEYBOARD: u32 = u32::from_be_bytes(*b"ANSI");

/// `kKeyboardISO`, the four-character code `KBGetLayoutType` returns for ISO keyboards.
const ISO_KEYBOARD: u32 = u32::from_be_bytes(*b"ISO ");

/// Shift in `UCKeyTranslate`'s modifier state (`shiftKey >> 8`).
const SHIFT: u32 = 0x02;

/// Option in `UCKeyTranslate`'s modifier state (`optionKey >> 8`).
const OPTION: u32 = 0x08;

/// Reads the keyboard layout the user selected, and what each key types on the connected keyboard,
/// or on a keyboard of the given kind (to dump an ANSI fixture on an ISO Mac).
///
/// # Errors
///
/// Returns [`AppError::Keymap`] when no layout, key tables or keyboard of the kind are found, or
/// when a key can't be translated.
pub fn current_layout(
    sources: TextInputSources,
    keyboard: Option<Keyboard>,
) -> Result<Layout, AppError> {
    let source = sources
        .selected_layout()
        .ok_or_else(|| AppError::keymap("no keyboard layout is selected"))?;
    let id = sources
        .id(&source)
        .ok_or_else(|| AppError::keymap("the layout has no ID"))?;
    let tables = sources
        .key_tables(&source)
        .ok_or_else(|| AppError::keymap("the layout has no key tables"))?;

    let keyboard_type = keyboard_type(sources, keyboard)?;
    let keymap = key_positions(keyboard_of(keyboard_type))
        .map(|(key, code)| Ok((code, characters(tables, key, keyboard_type)?)))
        .collect::<Result<Keymap, AppError>>()?;

    Ok(Layout {
        id: id.to_string(),
        keymap,
    })
}

/// The keyboard type to translate keys for: the connected keyboard's, or the first one macOS
/// knows of the given kind.
fn keyboard_type(sources: TextInputSources, keyboard: Option<Keyboard>) -> Result<u8, AppError> {
    match keyboard {
        None => Ok(sources.connected_keyboard_type()),
        Some(kind) => keyboard_type_of(kind)
            .ok_or_else(|| AppError::keymap("macOS knows no keyboard type of that kind")),
    }
}

/// Whether a keyboard type (from `LMGetKbdType`) is an ISO keyboard.
fn keyboard_of(keyboard_type: u8) -> Keyboard {
    if carbon::layout_type(keyboard_type) == ISO_KEYBOARD {
        Keyboard::Iso
    } else {
        Keyboard::Ansi
    }
}

/// The first keyboard type macOS knows of the given kind, to translate keys as on a keyboard
/// that isn't connected.
fn keyboard_type_of(keyboard: Keyboard) -> Option<u8> {
    let wanted = match keyboard {
        Keyboard::Ansi => ANSI_KEYBOARD,
        Keyboard::Iso => ISO_KEYBOARD,
    };

    (0..=u8::MAX).find(|&keyboard_type| carbon::layout_type(keyboard_type) == wanted)
}

/// What a key types without a modifier and with Shift, Option or both.
fn characters(tables: &CFData, key: u16, keyboard_type: u8) -> Result<KeyCharacters, AppError> {
    let typed = |modifiers| carbon::translate(tables, key, modifiers, keyboard_type);

    Ok(KeyCharacters {
        value: typed(0)?,
        with_shift: typed(SHIFT)?,
        with_alt: typed(OPTION)?,
        with_shift_alt: typed(SHIFT | OPTION)?,
    })
}
