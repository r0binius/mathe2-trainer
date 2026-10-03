//! The coach: while "Learn from how I work" is on, tells the main window which menu items with a
//! shortcut the user chooses. The frontend decides which shortcut that is, and counts it.

use std::rc::Rc;
use std::sync::{Mutex, MutexGuard, PoisonError};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_log::log;

use super::menu_watch::{MenuEffect, MenuMessage, MenuWatch, update_menu_watch};
use super::windows;
use crate::platform::{Access, MenuSignal, Platform};

/// The event that tells the main window about a menu choice.
const MENU_CHOSEN: &str = "menu-chosen";

/// Where watching the menus stands, kept in Tauri's managed state.
#[derive(Debug, Default)]
pub struct Coach(Mutex<CoachState>);

#[derive(Debug, Default)]
struct CoachState {
    /// Whether the settings ask for menu choices to be watched.
    wanted: bool,
    /// Whether they are: not until both Accessibility and Input Monitoring are allowed.
    watching: bool,
    watch: MenuWatch,
}

/// What the coach needs the user to allow, as the Settings window shows it.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
pub struct CoachAccess {
    /// Accessibility, to observe the menus of the app in front.
    menus: Access,
    /// Input Monitoring, to watch clicks and key presses.
    input: Access,
}

/// A menu choice as `menu-chosen` carries it.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct MenuChosen {
    bundle_id: String,
    keys: Vec<String>,
}

/// Watches menu choices while `learn_from_work` is on, and stops when it's off. Logs what fails.
///
/// Runs on the main thread, where the platform watches.
pub fn apply(app: &AppHandle, learn_from_work: bool) {
    lock(app).wanted = learn_from_work;

    if learn_from_work {
        retry(app);
    } else if lock(app).watching {
        app.state::<Platform>().menu_choices.stop();
        *lock(app) = CoachState::default();
    }
}

/// What the coach needs the user to allow, and whether they have. Once both are allowed while the
/// settings ask for it, watching starts, so it begins as soon as the user comes back from System
/// Settings.
///
/// Runs on the main thread, where the platform watches.
pub fn access(app: &AppHandle) -> CoachAccess {
    let platform = app.state::<Platform>();
    let access = CoachAccess {
        menus: platform.menus.access(),
        input: platform.menu_choices.input_access(),
    };

    if access.menus == Access::Granted && access.input == Access::Granted {
        retry(app);
    }
    access
}

/// Starts watching if the settings ask for it and it hasn't started.
fn retry(app: &AppHandle) {
    let state = lock(app);
    let start_now = state.wanted && !state.watching;
    drop(state);

    if start_now {
        start(app);
    }
}

fn start(app: &AppHandle) {
    let handle = app.clone();
    let started = app
        .state::<Platform>()
        .menu_choices
        .start(Rc::new(move |signal| on_signal(&handle, signal)));

    match started {
        Ok(()) => {
            lock(app).watching = true;
            // Observe the app in front right away, not only from the next click.
            on_signal(app, MenuSignal::Pressed);
        }
        Err(error) => log::error!("cannot watch menu choices: {error}"),
    }
}

/// Turns what the platform reports into a message, with the app in front for a press.
fn on_signal(app: &AppHandle, signal: MenuSignal) {
    let message = match signal {
        MenuSignal::Pressed => MenuMessage::Pressed(app.state::<Platform>().menus.app_in_front()),
        MenuSignal::MouseUp(point) => MenuMessage::MouseUp(point),
        MenuSignal::Return => MenuMessage::Return,
        MenuSignal::Highlighted(item) => MenuMessage::Highlighted(item),
        MenuSignal::MenuClosed => MenuMessage::MenuClosed,
    };

    dispatch(app, message);
}

/// Updates the watch with `message` and carries out its effect.
fn dispatch(app: &AppHandle, message: MenuMessage) {
    let effect = {
        let mut state = lock(app);
        let (watch, effect) = update_menu_watch(std::mem::take(&mut state.watch), message);
        state.watch = watch;
        effect
    };

    match effect {
        Some(MenuEffect::Observe(process)) => {
            if let Err(error) = app.state::<Platform>().menu_choices.observe(process) {
                // Forget the app, so the next click tries again, such as once Accessibility is
                // allowed.
                lock(app).watch = MenuWatch::default();
                log::warn!("cannot observe the menus of the app in front: {error}");
            }
        }
        Some(MenuEffect::Chosen { bundle_id, keys }) => {
            let chosen = MenuChosen { bundle_id, keys };
            if let Err(error) = app.emit_to(windows::MAIN, MENU_CHOSEN, chosen) {
                log::error!("cannot tell the main window about a menu choice: {error}");
            }
        }
        None => {}
    }
}

fn lock(app: &AppHandle) -> MutexGuard<'_, CoachState> {
    // Every change to the state is a single assignment, so a panic can't leave it half changed.
    app.state::<Coach>()
        .inner()
        .0
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn access_reaches_the_frontend_as_each_permission_granted_or_denied() {
        let access = CoachAccess {
            menus: Access::Granted,
            input: Access::Denied,
        };

        assert_eq!(
            serde_json::to_value(access).expect("the access serializes"),
            json!({ "menus": "granted", "input": "denied" }),
        );
    }
}
