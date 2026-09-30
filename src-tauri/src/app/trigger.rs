//! Opens the popover by the trigger the user chose: holding ⌘ on its own for a moment, or a global
//! shortcut. Both report to the [coordinator](super::coordinator) like a click on the menu bar
//! icon.

use std::str::FromStr;
use std::sync::{Mutex, MutexGuard, PoisonError};
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{
    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutEvent, ShortcutState,
};
use tauri_plugin_log::log;

use super::coordinator::Event;
use super::hold::{Hold, HoldEffect, HoldMessage, update_hold};
use super::windows;
use crate::error::AppError;
use crate::platform::{KeyInput, Keymap, Platform};
use crate::services::settings::Trigger;

/// How long ⌘ must be held on its own, as in the old app.
const HOLD: Duration = Duration::from_secs(1);

/// The trigger in use and where holding ⌘ stands, kept in Tauri's managed state.
#[derive(Debug, Default)]
pub struct Triggers(Mutex<TriggerState>);

#[derive(Debug, Default)]
struct TriggerState {
    /// The trigger in use; `None` until the settings are applied.
    trigger: Option<Trigger>,
    hold: Hold,
    /// Whether the keyboard is watched for holding ⌘, which starts only when it's first chosen, so
    /// nobody who uses a shortcut is asked to allow Input Monitoring.
    watching: bool,
}

/// Makes `trigger` open the popover, in place of the one before, and logs what fails.
///
/// Runs on the main thread: watching the keyboard and reading the layout only work there.
pub fn apply(app: &AppHandle, trigger: Trigger) {
    if let Err(error) = try_apply(app, trigger) {
        log::error!("{error}");
    }
}

/// Registers the shortcut again after a layout change, since its keys may now be elsewhere.
pub fn follow_layout(app: &AppHandle) {
    let trigger = lock(app).trigger.clone();

    if let Some(shortcut @ Trigger::Shortcut { .. }) = trigger {
        apply(app, shortcut);
    }
}

/// Opens or closes the popover when the shortcut is pressed. Only the trigger's shortcut is ever
/// registered, so which one doesn't matter.
pub fn on_shortcut(app: &AppHandle, _shortcut: &Shortcut, event: ShortcutEvent) {
    if event.state == ShortcutState::Pressed {
        windows::report(app, Event::TriggerPressed);
    }
}

fn try_apply(app: &AppHandle, trigger: Trigger) -> Result<(), AppError> {
    let start_watching = {
        let mut state = lock(app);
        let start = trigger == Trigger::HoldCommand && !state.watching;
        state.trigger = Some(trigger.clone());
        state.watching |= start;
        start
    };

    app.global_shortcut()
        .unregister_all()
        .map_err(|source| AppError::Shortcut { source })?;
    match trigger {
        Trigger::HoldCommand if start_watching => watch_hold(app).inspect_err(|_| {
            lock(app).watching = false;
        }),
        Trigger::HoldCommand => Ok(()),
        Trigger::Shortcut { keys } => register(app, &keys),
    }
}

fn watch_hold(app: &AppHandle) -> Result<(), AppError> {
    let handle = app.clone();

    app.state::<Platform>()
        .modifier_hold
        .watch(Box::new(move |input| on_input(&handle, input)))
}

fn register(app: &AppHandle, keys: &[String]) -> Result<(), AppError> {
    let layout = app.state::<Platform>().keymap.current_layout()?;
    let shortcut = shortcut_of(keys, &layout.keymap)?;

    app.global_shortcut()
        .register(shortcut)
        .map_err(|source| AppError::Shortcut { source })
}

fn on_input(app: &AppHandle, input: KeyInput) {
    if lock(app).trigger == Some(Trigger::HoldCommand) {
        dispatch(app, HoldMessage::Input(input));
    }
}

/// Updates the hold with `message` and carries out its effect.
fn dispatch(app: &AppHandle, message: HoldMessage) {
    let effect = {
        let mut state = lock(app);
        let (hold, effect) = update_hold(state.hold, message);
        state.hold = hold;
        effect
    };

    match effect {
        Some(HoldEffect::Wait(press)) => {
            let app = app.clone();
            thread::spawn(move || {
                thread::sleep(HOLD);
                dispatch(&app, HoldMessage::Elapsed(press));
            });
        }
        Some(HoldEffect::Fire) => windows::report(app, Event::TriggerPressed),
        None => {}
    }
}

fn lock(app: &AppHandle) -> MutexGuard<'_, TriggerState> {
    // Every change to the state is a single assignment, so a panic can't leave it half changed.
    app.state::<Triggers>()
        .inner()
        .0
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}

/// The global shortcut for `keys`, named as the frontend's `KeyCombination`: modifiers, and one key
/// by the character it types without a modifier on `keymap`, or by its code if it types nothing.
///
/// # Errors
///
/// Returns a trigger error if there isn't exactly one key besides the modifiers, or the key isn't
/// one a global shortcut can use.
fn shortcut_of(keys: &[String], keymap: &Keymap) -> Result<Shortcut, AppError> {
    let (modifiers, others): (Vec<_>, Vec<_>) = keys
        .iter()
        .map(String::as_str)
        .partition(|key| modifier_of(key).is_some());
    let [key] = others.as_slice() else {
        return Err(AppError::trigger(format!(
            "a shortcut needs exactly one key besides the modifiers: {keys:?}"
        )));
    };
    let modifiers = modifiers
        .iter()
        .filter_map(|key| modifier_of(key))
        .fold(Modifiers::empty(), |all, modifier| all | modifier);

    Ok(Shortcut::new(Some(modifiers), code_of(key, keymap)?))
}

fn modifier_of(key: &str) -> Option<Modifiers> {
    match key {
        "Control" => Some(Modifiers::CONTROL),
        "Alt" => Some(Modifiers::ALT),
        "Shift" => Some(Modifiers::SHIFT),
        "Meta" => Some(Modifiers::SUPER),
        _ => None,
    }
}

/// The physical key for `key`: the one typing it on `keymap`, else the key it names.
fn code_of(key: &str, keymap: &Keymap) -> Result<Code, AppError> {
    let typed_by = keymap
        .iter()
        .find(|(_, characters)| characters.value == key)
        .and_then(|(code, _)| serde_json::to_value(code).ok());
    // A `KeyCode` serializes as its name, which is also the plugin's name for the key.
    let name = typed_by
        .as_ref()
        .and_then(serde_json::Value::as_str)
        .unwrap_or(key);

    Code::from_str(name).map_err(|_| AppError::trigger(format!("no key types {key:?}")))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::platform::{KeyCharacters, KeyCode};

    fn german() -> Keymap {
        let key = |value: &str| KeyCharacters {
            value: value.to_owned(),
            with_shift: value.to_uppercase(),
            with_alt: String::new(),
            with_shift_alt: String::new(),
        };

        Keymap::from([(KeyCode::KeyY, key("z")), (KeyCode::KeyZ, key("y"))])
    }

    fn keys(names: &[&str]) -> Vec<String> {
        names.iter().map(ToString::to_string).collect()
    }

    #[test]
    fn finds_the_key_typing_the_character_on_the_layout() {
        let shortcut = shortcut_of(&keys(&["Shift", "Meta", "z"]), &german()).expect("a shortcut");

        assert_eq!(
            shortcut,
            Shortcut::new(Some(Modifiers::SHIFT | Modifiers::SUPER), Code::KeyY)
        );
    }

    #[test]
    fn takes_a_key_that_types_nothing_by_its_code() {
        let shortcut =
            shortcut_of(&keys(&["Control", "Alt", "F6"]), &german()).expect("a shortcut");

        assert_eq!(
            shortcut,
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::F6)
        );
    }

    #[test]
    fn needs_exactly_one_key_besides_the_modifiers() {
        assert!(shortcut_of(&keys(&["Meta"]), &german()).is_err());
        assert!(shortcut_of(&keys(&["Meta", "z", "y"]), &german()).is_err());
    }

    #[test]
    fn rejects_a_character_no_key_types() {
        assert!(shortcut_of(&keys(&["Meta", "ß"]), &german()).is_err());
    }
}
