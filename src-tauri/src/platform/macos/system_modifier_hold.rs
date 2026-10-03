//! Holding ⌘ on its own, watched with a Core Graphics event tap, as a [`ModifierHold`].

use std::sync::atomic::{AtomicBool, Ordering};

use objc2::MainThreadMarker;
use objc2_core_graphics::{
    CGEventFlags, CGEventType, CGPreflightListenEventAccess, CGRequestListenEventAccess,
};

use crate::error::AppError;
use crate::platform::macos::event_tap::{EventTap, mask_of};
use crate::platform::{KeyInput, ModifierHold};

/// The events that start or cancel holding ⌘: modifier changes, key presses and clicks.
const WATCHED: [CGEventType; 5] = [
    CGEventType::FlagsChanged,
    CGEventType::KeyDown,
    CGEventType::LeftMouseDown,
    CGEventType::RightMouseDown,
    CGEventType::OtherMouseDown,
];

/// The modifiers that count: Caps Lock doesn't, so it can stay on while holding ⌘.
const MODIFIERS: CGEventFlags = CGEventFlags::MaskShift
    .union(CGEventFlags::MaskControl)
    .union(CGEventFlags::MaskAlternate)
    .union(CGEventFlags::MaskCommand)
    .union(CGEventFlags::MaskSecondaryFn);

/// Watches for holding ⌘ with an event tap, which needs the user to allow Input Monitoring.
///
/// Must be started on the main thread, where Tauri runs setup and synchronous commands.
#[derive(Debug, Default)]
pub struct SystemModifierHold {
    /// Whether the keyboard is watched already, which may happen only once: the tap is leaked.
    watching: AtomicBool,
}

impl ModifierHold for SystemModifierHold {
    fn watch(&self, on_input: Box<dyn Fn(KeyInput)>) -> Result<(), AppError> {
        let main_thread = MainThreadMarker::new()
            .ok_or_else(|| AppError::trigger("the keyboard is only watched on the main thread"))?;

        if !CGPreflightListenEventAccess() {
            // Shows macOS's prompt the first time; the user allows it in System Settings.
            CGRequestListenEventAccess();
            return Err(AppError::trigger(
                "the user hasn't allowed Input Monitoring yet",
            ));
        }
        // Only the flag itself is shared, no data it guards, so the weakest ordering is enough.
        if self.watching.swap(true, Ordering::Relaxed) {
            return Err(AppError::trigger("the keyboard is watched already"));
        }
        let tap = EventTap::listen(
            main_thread,
            mask_of(&WATCHED),
            Box::new(move |event| on_input(input_of(event.kind, event.flags))),
        )
        .inspect_err(|_| self.watching.store(false, Ordering::Relaxed))?;

        // The hold is watched for as long as the app runs.
        tap.leak();
        Ok(())
    }
}

/// What an event means for holding ⌘.
fn input_of(kind: CGEventType, flags: CGEventFlags) -> KeyInput {
    let modifiers = flags.intersection(MODIFIERS);

    if kind != CGEventType::FlagsChanged {
        KeyInput::Other
    } else if modifiers == CGEventFlags::MaskCommand {
        KeyInput::CommandAlone
    } else if modifiers.is_empty() {
        KeyInput::Released
    } else {
        KeyInput::Other
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn command_on_its_own_starts_a_hold() {
        let flags = CGEventFlags::MaskCommand.union(CGEventFlags::MaskAlphaShift);

        assert_eq!(
            input_of(CGEventType::FlagsChanged, flags),
            KeyInput::CommandAlone
        );
    }

    #[test]
    fn letting_go_of_every_modifier_is_a_release() {
        assert_eq!(
            input_of(CGEventType::FlagsChanged, CGEventFlags::empty()),
            KeyInput::Released
        );
    }

    #[test]
    fn another_modifier_with_command_is_something_else() {
        let flags = CGEventFlags::MaskCommand.union(CGEventFlags::MaskShift);

        assert_eq!(input_of(CGEventType::FlagsChanged, flags), KeyInput::Other);
    }

    #[test]
    fn a_key_or_click_while_holding_command_is_something_else() {
        let flags = CGEventFlags::MaskCommand;

        assert_eq!(input_of(CGEventType::KeyDown, flags), KeyInput::Other);
        assert_eq!(input_of(CGEventType::LeftMouseDown, flags), KeyInput::Other);
    }
}
