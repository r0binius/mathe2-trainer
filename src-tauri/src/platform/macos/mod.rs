//! The macOS implementations of the platform traits.

pub mod fixture;

mod carbon;
mod event_tap;
mod input_source;
mod keymap;
mod languages;
mod system_keymap;
mod system_modifier_hold;

pub use self::languages::preferred_languages;
pub use self::system_keymap::SystemKeymap;
pub use self::system_modifier_hold::SystemModifierHold;
