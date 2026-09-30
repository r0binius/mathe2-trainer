//! Opens the popover by the trigger the user chose: holding ⌘ on its own for a moment, or a global
//! shortcut. Both report to the [coordinator](super::coordinator) like a click on the menu bar
//! icon.

use std::sync::{Mutex, MutexGuard, PoisonError};
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutEvent, ShortcutState};
use tauri_plugin_log::log;

use super::coordinator::Event;
use super::hold::{Hold, HoldEffect, HoldMessage, update_hold};
use super::shortcut::shortcut_of;
use super::windows;
use crate::error::AppError;
use crate::platform::{KeyInput, Platform};
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
