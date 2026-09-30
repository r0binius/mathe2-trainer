//! Watching the keyboard and mouse for ⌘ held on its own, and the trait that does it.

use crate::error::AppError;

/// A key or mouse event, as far as holding ⌘ on its own is concerned.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum KeyInput {
    /// The modifiers changed, and ⌘ is now the only one down.
    CommandAlone,
    /// The modifiers changed, and none is down anymore.
    Released,
    /// Anything else: another modifier, a key or a mouse button went down.
    Other,
}

/// Watches the keyboard and mouse everywhere in the session, for holding ⌘ on its own.
pub trait ModifierHold {
    /// Calls `on_input` for every key and mouse event, for as long as the app runs. Call it once:
    /// the watch is never removed.
    ///
    /// # Errors
    ///
    /// Returns a trigger error if the user hasn't allowed the app to watch the keyboard (and asks
    /// them), if the system refuses, or if it's watched already.
    fn watch(&self, on_input: Box<dyn Fn(KeyInput)>) -> Result<(), AppError>;
}
