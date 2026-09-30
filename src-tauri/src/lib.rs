//! Mouseless: keyboard shortcut training and look-up.
//!
//! The library builds the Tauri app, and `main.rs` only calls [`run`].

mod app;
mod commands;
mod error;
mod platform;
mod services;

pub use self::app::run;

#[cfg(target_os = "macos")]
#[doc(hidden)]
pub use self::platform::macos::fixture::dump_keymap;
