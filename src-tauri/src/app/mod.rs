//! The app itself: how it's built, and the windows, menus and menu bar icon it shows.

mod coordinator;
mod menu;
mod popover;
mod run;
mod tray;
mod windows;

pub use self::coordinator::Event;
pub use self::run::run;
pub use self::windows::handle;
