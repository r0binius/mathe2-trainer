//! The app itself: how it's built, and the windows, menus and menu bar icon it shows.

mod coordinator;
mod hold;
mod layout;
mod lookup;
mod menu;
mod popover;
mod run;
mod settings;
mod shortcut;
mod tray;
mod trigger;
mod windows;

pub use self::coordinator::Event;
pub use self::run::run;
pub use self::settings::apply_settings;
pub use self::windows::handle;
