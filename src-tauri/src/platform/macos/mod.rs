//! The macOS implementations of the platform traits.

pub mod fixture;

mod accessibility;
mod carbon;
mod event_tap;
mod input_source;
mod keymap;
mod languages;
mod menu_keys;
mod menus;
mod system_app_menus;
mod system_keymap;
mod system_menu_choices;
mod system_modifier_hold;
mod window_list;

pub use self::languages::preferred_languages;
pub use self::system_app_menus::SystemAppMenus;
pub use self::system_keymap::SystemKeymap;
pub use self::system_menu_choices::SystemMenuChoices;
pub use self::system_modifier_hold::SystemModifierHold;
