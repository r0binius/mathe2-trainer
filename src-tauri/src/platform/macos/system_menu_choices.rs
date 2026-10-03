//! Menu choices, watched with an event tap and the Accessibility API, as [`MenuChoices`].

use std::rc::Rc;
use std::sync::{Mutex, PoisonError};

use dispatch2::MainThreadBound;
use objc2::MainThreadMarker;
use objc2_core_graphics::{CGEventType, CGPreflightListenEventAccess, CGRequestListenEventAccess};

use crate::error::AppError;
use crate::platform::macos::accessibility::{self, Element, Observer, Value};
use crate::platform::macos::event_tap::{EventTap, TapEvent, mask_of};
use crate::platform::macos::menu_keys::{KeyEquivalent, keys_of};
use crate::platform::macos::system_settings;
use crate::platform::{Access, Frame, MenuChoices, MenuItem, MenuSignal, Point};

/// The events that can change the app in front or choose a menu item.
const WATCHED: [CGEventType; 5] = [
    CGEventType::KeyDown,
    CGEventType::LeftMouseDown,
    CGEventType::RightMouseDown,
    CGEventType::OtherMouseDown,
    CGEventType::LeftMouseUp,
];

/// `kVK_Return` and `kVK_ANSI_KeypadEnter` from Carbon's `Events.h`.
const RETURN_KEYS: [i64; 2] = [0x24, 0x4C];

/// What's observed of the app in front: its highlight moving, and its menus closing.
const SELECTION_CHANGED: &str = "AXSelectedChildrenChanged";
const MENU_CLOSED: &str = "AXMenuClosed";

/// What's read of a menu whose selection changed: its role and its highlighted item.
const MENU: [&str; 2] = ["AXRole", "AXSelectedChildren"];

/// What's read of the highlighted item, in one message: its key equivalent and its frame.
const ITEM: [&str; 5] = [
    "AXMenuItemCmdChar",
    "AXMenuItemCmdGlyph",
    "AXMenuItemCmdModifiers",
    "AXPosition",
    "AXSize",
];

/// Watches menu choices with an event tap, which needs Input Monitoring, and an Accessibility
/// observer of the app in front, which needs Accessibility.
#[derive(Debug, Default)]
pub struct SystemMenuChoices {
    /// The tap and the observer while watching. They live on the main thread, where their events
    /// arrive.
    watching: Mutex<Option<MainThreadBound<Watching>>>,
}

/// What's kept while watching.
struct Watching {
    /// Removed when watching stops.
    _tap: EventTap,
    /// The observer of the app in front, if any.
    observer: Option<Observer>,
    /// Where the signals go, shared with the tap and the observer.
    on_signal: Rc<dyn Fn(MenuSignal)>,
}

impl std::fmt::Debug for Watching {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter
            .debug_struct("Watching")
            .field("observer", &self.observer)
            .finish_non_exhaustive()
    }
}

impl MenuChoices for SystemMenuChoices {
    fn input_access(&self) -> Access {
        Access::of(CGPreflightListenEventAccess())
    }

    fn ask_for_input_access(&self) -> Result<(), AppError> {
        CGRequestListenEventAccess();
        system_settings::open(system_settings::INPUT_MONITORING)
    }

    fn start(&self, on_signal: Rc<dyn Fn(MenuSignal)>) -> Result<(), AppError> {
        let main_thread = main_thread()?;
        let mut watching = self.lock();

        if watching.is_some() {
            return Err(AppError::lookup("menu choices are watched already"));
        }
        if !CGPreflightListenEventAccess() {
            // Shows macOS's prompt the first time; the user allows it in System Settings.
            CGRequestListenEventAccess();
            return Err(AppError::lookup(
                "the user hasn't allowed Input Monitoring yet",
            ));
        }

        let signals = Rc::clone(&on_signal);
        let tap = EventTap::listen(
            main_thread,
            mask_of(&WATCHED),
            Box::new(move |event| signals(signal_of(event))),
        )?;
        *watching = Some(MainThreadBound::new(
            Watching {
                _tap: tap,
                observer: None,
                on_signal,
            },
            main_thread,
        ));
        Ok(())
    }

    fn observe(&self, process: Option<i32>) -> Result<(), AppError> {
        let main_thread = main_thread()?;
        let mut watching = self.lock();
        let watching = watching
            .as_mut()
            .ok_or_else(|| AppError::lookup("menu choices aren't watched"))?
            .get_mut(main_thread);

        // The old observer goes first, so a failure leaves none rather than a stale one.
        watching.observer = None;
        watching.observer = process
            .map(|process| observer_of(main_thread, process, Rc::clone(&watching.on_signal)))
            .transpose()?;
        Ok(())
    }

    fn stop(&self) {
        // Dropping the tap and the observer removes them, on the main thread.
        *self.lock() = None;
    }
}

impl SystemMenuChoices {
    fn lock(&self) -> std::sync::MutexGuard<'_, Option<MainThreadBound<Watching>>> {
        // Every change is a single assignment, so a panic can't leave it half changed.
        self.watching.lock().unwrap_or_else(PoisonError::into_inner)
    }
}

fn main_thread() -> Result<MainThreadMarker, AppError> {
    MainThreadMarker::new()
        .ok_or_else(|| AppError::lookup("menu choices are only watched on the main thread"))
}

/// An observer of the menus of the app running as `process`, whose signals go to `on_signal`.
fn observer_of(
    main_thread: MainThreadMarker,
    process: i32,
    on_signal: Rc<dyn Fn(MenuSignal)>,
) -> Result<Observer, AppError> {
    if !accessibility::is_trusted() {
        return Err(AppError::lookup(
            "the user hasn't allowed Accessibility yet",
        ));
    }

    Observer::new(
        main_thread,
        process,
        &[SELECTION_CHANGED, MENU_CLOSED],
        Box::new(move |notification, element| {
            if let Some(signal) = menu_signal_of(notification, &element) {
                on_signal(signal);
            }
        }),
    )
}

/// What an event of the tap means for menu choices.
fn signal_of(event: TapEvent) -> MenuSignal {
    if event.kind == CGEventType::LeftMouseUp {
        MenuSignal::MouseUp(Point {
            x: event.location.x,
            y: event.location.y,
        })
    } else if event.kind == CGEventType::KeyDown && RETURN_KEYS.contains(&event.key_code) {
        MenuSignal::Return
    } else {
        MenuSignal::Pressed
    }
}

/// What a notification of the observed app means: a menu's new highlight, or a menu closed.
/// Others, such as the menu bar's selection, mean nothing here.
fn menu_signal_of(notification: &str, element: &Element) -> Option<MenuSignal> {
    match notification {
        MENU_CLOSED => Some(MenuSignal::MenuClosed),
        SELECTION_CHANGED => highlight_in(element),
        _ => None,
    }
}

/// The highlight of a menu, if `element` is one: its item with a shortcut, or none for an item
/// without one or that can't be read. `None` for an element that isn't a menu, such as the menu
/// bar.
fn highlight_in(element: &Element) -> Option<MenuSignal> {
    let [role, selected] = element.values(&MENU).ok()?.try_into().ok()?;

    match (role, selected) {
        (Value::Text(role), Value::Elements(items)) if role == "AXMenu" => {
            Some(MenuSignal::Highlighted(items.first().and_then(item_of)))
        }
        _ => None,
    }
}

/// A menu item's keys and frame, if it has a shortcut and the app answers.
fn item_of(item: &Element) -> Option<MenuItem> {
    let [character, glyph, modifiers, position, size] = item.values(&ITEM).ok()?.try_into().ok()?;
    let character = match character {
        Value::Text(text) => Some(text),
        _ => None,
    };
    let keys = keys_of(KeyEquivalent {
        character: character.as_deref(),
        glyph: number(&glyph),
        modifiers: number(&modifiers).unwrap_or_default(),
    })?;
    let (Value::Point(origin), Value::Size(size)) = (position, size) else {
        return None;
    };

    Some(MenuItem {
        keys,
        frame: Frame {
            origin: Point {
                x: origin.x,
                y: origin.y,
            },
            width: size.width,
            height: size.height,
        },
    })
}

fn number(value: &Value) -> Option<i64> {
    match *value {
        Value::Number(number) => Some(number),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use objc2_core_foundation::CGPoint;
    use objc2_core_graphics::CGEventFlags;

    use super::*;

    fn event(kind: CGEventType, key_code: i64) -> TapEvent {
        TapEvent {
            kind,
            flags: CGEventFlags::empty(),
            key_code,
            location: CGPoint { x: 12.0, y: 34.0 },
        }
    }

    #[test]
    fn a_left_mouse_up_reports_where() {
        assert_eq!(
            signal_of(event(CGEventType::LeftMouseUp, 0)),
            MenuSignal::MouseUp(Point { x: 12.0, y: 34.0 })
        );
    }

    #[test]
    fn return_and_enter_choose() {
        assert_eq!(
            signal_of(event(CGEventType::KeyDown, 0x24)),
            MenuSignal::Return
        );
        assert_eq!(
            signal_of(event(CGEventType::KeyDown, 0x4C)),
            MenuSignal::Return
        );
    }

    #[test]
    fn other_keys_and_clicks_are_presses() {
        assert_eq!(
            signal_of(event(CGEventType::KeyDown, 0x00)),
            MenuSignal::Pressed
        );
        assert_eq!(
            signal_of(event(CGEventType::LeftMouseDown, 0)),
            MenuSignal::Pressed
        );
    }
}
