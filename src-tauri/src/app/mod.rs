//! The app itself: how it's built, and the windows, menus and menu bar icon it shows.

mod banner;
mod coach;
mod coordinator;
mod hold;
mod layout;
mod lookup;
mod menu;
mod menu_watch;
mod popover;
mod run;
mod screen;
mod settings;
mod shortcut;
mod tray;
mod trigger;
mod windows;

pub use self::banner::{Banner, show as show_banner};
pub use self::coach::{CoachAccess, access as coach_access};
pub use self::coordinator::Event;
pub use self::lookup::read_menus;
pub use self::run::run;
pub use self::settings::apply_settings;
pub use self::windows::handle;
