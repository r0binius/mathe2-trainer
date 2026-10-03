//! Watching which menu items the user chooses, and the trait that does it.

use std::rc::Rc;

use crate::error::AppError;
use crate::platform::{Access, Keymap};

/// A point on screen, in global display coordinates with the origin at the top left.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Point {
    /// Pixels from the left.
    pub x: f64,
    /// Pixels from the top.
    pub y: f64,
}

/// A rectangle on screen, in the coordinates of [`Point`].
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Frame {
    /// Its top left corner.
    pub origin: Point,
    /// Its width in pixels.
    pub width: f64,
    /// Its height in pixels.
    pub height: f64,
}

impl Frame {
    /// Whether `point` lies inside, its top and left edges included.
    #[must_use]
    pub fn contains(self, point: Point) -> bool {
        let Self {
            origin,
            width,
            height,
        } = self;

        (origin.x..origin.x + width).contains(&point.x)
            && (origin.y..origin.y + height).contains(&point.y)
    }
}

/// A highlighted menu item that has a shortcut.
#[derive(Clone, Debug, PartialEq)]
pub struct MenuItem {
    /// Its keys, named as in the shortcut data, such as `["Shift", "Meta", "n"]`.
    pub keys: Vec<String>,
    /// Where it is on screen.
    pub frame: Frame,
}

/// What the platform reports while it watches.
#[derive(Clone, Debug, PartialEq)]
pub enum MenuSignal {
    /// A mouse button or a key other than Return went down, so the app in front may have changed.
    Pressed,
    /// The left mouse button came up at a point.
    MouseUp(Point),
    /// Return or Enter went down.
    Return,
    /// The observed app highlighted another item in a menu: one with a shortcut, or one without
    /// (`None`).
    Highlighted(Option<MenuItem>),
    /// One of the observed app's menus closed.
    MenuClosed,
    /// One of the watched combinations was pressed, named as it was given to
    /// [`MenuChoices::watch_keys`].
    KeysPressed(Vec<String>),
}

/// Watches clicks, key presses and one app's menus everywhere in the session, for menu choices and
/// presses of known shortcuts.
///
/// Every call runs on the main thread, where the signals arrive too.
pub trait MenuChoices {
    /// Whether the user lets the app watch clicks and key presses, which the system guards.
    fn input_access(&self) -> Access;

    /// Asks the user to let the app watch clicks and key presses, in the system's settings. The
    /// first time, the system also shows its own prompt.
    ///
    /// # Errors
    ///
    /// Returns a coach error if the system's settings can't be opened.
    fn ask_for_input_access(&self) -> Result<(), AppError>;

    /// Starts watching clicks and key presses, reporting them, and later the observed app's menus,
    /// to `on_signal` until [`MenuChoices::stop`].
    ///
    /// # Errors
    ///
    /// Returns a coach error if it's watching already, isn't on the main thread, or the system
    /// refuses, such as when Input Monitoring isn't allowed.
    fn start(&self, on_signal: Rc<dyn Fn(MenuSignal)>) -> Result<(), AppError>;

    /// Observes the menus of the app running as `process` instead of the one before, or none.
    /// Never call it from a signal of the observed app's menus: that would drop the observer
    /// that's calling.
    ///
    /// # Errors
    ///
    /// Returns a coach error if it isn't watching, or the app can't be observed, such as when
    /// Accessibility isn't allowed.
    fn observe(&self, process: Option<i32>) -> Result<(), AppError>;

    /// Reports a press of any of `combinations`, named as the shortcut data names keys on
    /// `keymap`'s layout, in place of the ones before. No other key press is ever reported.
    fn watch_keys(&self, combinations: &[Vec<String>], keymap: &Keymap);

    /// Stops watching, if it is.
    fn stop(&self);
}
