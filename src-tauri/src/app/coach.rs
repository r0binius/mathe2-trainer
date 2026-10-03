//! The coach: while "Learn from how I work" is on, tells the main window which menu items with a
//! shortcut the user chooses. The frontend decides which shortcut that is, and counts it.

use std::rc::Rc;
use std::sync::{Mutex, MutexGuard, PoisonError};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_log::log;

use super::menu_watch::{MenuEffect, MenuMessage, MenuWatch, update_menu_watch};
use super::windows;
use crate::platform::{MenuSignal, Platform};

/// The event that tells the main window about a menu choice.
const MENU_CHOSEN: &str = "menu-chosen";

/// Where watching the menus stands, kept in Tauri's managed state.
#[derive(Debug, Default)]
pub struct Coach(Mutex<CoachState>);

#[derive(Debug, Default)]
struct CoachState {
    /// Whether menu choices are watched.
    watching: bool,
    watch: MenuWatch,
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
    let watching = lock(app).watching;

    if learn_from_work && !watching {
        start(app);
    } else if !learn_from_work && watching {
        app.state::<Platform>().menu_choices.stop();
        *lock(app) = CoachState::default();
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
