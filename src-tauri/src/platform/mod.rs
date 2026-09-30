//! What the app needs from the operating system, as traits (the ports), and their implementation
//! for the platform the app is built for.
//!
//! The rest of the app works against the traits, so a platform is added without changing it (the
//! Bridge pattern in `architecture.md`).

mod current;
mod key_code;
mod layout;
mod modifier_hold;

pub use self::current::Platform;
pub use self::key_code::KeyCode;
pub use self::layout::{KeyCharacters, Keymap, KeymapSource, Layout};
pub use self::modifier_hold::{KeyInput, ModifierHold};

#[cfg(target_os = "macos")]
pub mod macos;

#[cfg(target_os = "macos")]
pub use self::current::current;
