//! Decides what the windows do when something happens to them, to the menu bar icon or in a menu
//! (the Mediator in `architecture.md`). The tray, the menus and the windows only report
//! events here, and never act on each other.
//!
//! Pure, like an Elm `update`: [`windows`](super::windows) reads which windows are showing, asks
//! [`coordinate`] what to do, and carries out the actions.

/// Which windows are showing when an event happens.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Showing {
    /// Whether the popover is open.
    pub popover: bool,
    /// Whether the main window is on screen, though maybe behind other apps' windows.
    pub main: bool,
    /// Whether the Settings window is on screen.
    pub settings: bool,
}

/// Something that happened to a window, to the menu bar icon or in a menu.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Event {
    /// The menu bar icon was clicked.
    IconClicked,
    /// The trigger was pressed: ⌘ held on its own, or the global shortcut.
    TriggerPressed,
    /// The popover lost focus, such as to a click elsewhere.
    PopoverBlurred,
    /// The popover was closed from inside, with Escape.
    PopoverDismissed,
    /// Settings was chosen from the menu bar icon's menu or the app menu (⌘,).
    SettingsChosen,
    /// The Dock icon was clicked.
    DockClicked,
    /// The app was launched while it was running, which starts no second one.
    LaunchedAgain,
    /// The main window's close button or ⌘W was pressed.
    MainClosing,
    /// The Settings window's close button or ⌘W was pressed.
    SettingsClosing,
}

/// What to do with the windows.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Action {
    /// Open the popover below the menu bar icon.
    OpenPopover,
    /// Close the popover.
    ClosePopover,
    /// Hide the app, so macOS gives focus back to the app that had it before.
    ReturnFocus,
    /// Bring the main window to the front.
    ShowMain,
    /// Hide the main window, keeping its pages as they are.
    HideMain,
    /// Bring the Settings window to the front.
    ShowSettings,
    /// Hide the Settings window.
    HideSettings,
}

/// What the windows do when `event` happens while `showing`.
#[must_use]
pub fn coordinate(showing: Showing, event: Event) -> Vec<Action> {
    match event {
        Event::IconClicked | Event::TriggerPressed | Event::PopoverDismissed if showing.popover => {
            dismiss(showing)
        }
        Event::IconClicked | Event::TriggerPressed => vec![Action::OpenPopover],
        // Focus already went elsewhere, so there's none to give back.
        Event::PopoverBlurred if showing.popover => vec![Action::ClosePopover],
        Event::PopoverDismissed | Event::PopoverBlurred => vec![],
        Event::SettingsChosen if showing.popover => {
            vec![Action::ClosePopover, Action::ShowSettings]
        }
        Event::SettingsChosen => vec![Action::ShowSettings],
        Event::DockClicked | Event::LaunchedAgain => vec![Action::ShowMain],
        Event::MainClosing => vec![Action::HideMain],
        Event::SettingsClosing => vec![Action::HideSettings],
    }
}

/// Closes the popover and gives focus back to the app it was opened over. With a window of its
/// own showing, Mouseless keeps focus: hiding the app would hide that window too.
fn dismiss(showing: Showing) -> Vec<Action> {
    if showing.main || showing.settings {
        vec![Action::ClosePopover]
    } else {
        vec![Action::ClosePopover, Action::ReturnFocus]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const NOTHING: Showing = Showing {
        popover: false,
        main: false,
        settings: false,
    };
    const POPOVER: Showing = Showing {
        popover: true,
        ..NOTHING
    };
    const MAIN: Showing = Showing {
        main: true,
        ..NOTHING
    };
    const BOTH: Showing = Showing {
        popover: true,
        main: true,
        ..NOTHING
    };
    const POPOVER_AND_SETTINGS: Showing = Showing {
        popover: true,
        settings: true,
        ..NOTHING
    };

    #[test]
    fn a_click_on_the_icon_opens_the_popover() {
        assert_eq!(
            coordinate(NOTHING, Event::IconClicked),
            [Action::OpenPopover]
        );
        assert_eq!(coordinate(MAIN, Event::IconClicked), [Action::OpenPopover]);
    }

    #[test]
    fn a_second_click_closes_it_and_gives_focus_back() {
        assert_eq!(
            coordinate(POPOVER, Event::IconClicked),
            [Action::ClosePopover, Action::ReturnFocus]
        );
    }

    #[test]
    fn the_trigger_opens_and_closes_it_like_a_click() {
        assert_eq!(
            coordinate(NOTHING, Event::TriggerPressed),
            [Action::OpenPopover]
        );
        assert_eq!(
            coordinate(POPOVER, Event::TriggerPressed),
            [Action::ClosePopover, Action::ReturnFocus]
        );
    }

    #[test]
    fn escape_closes_it_and_gives_focus_back() {
        assert_eq!(
            coordinate(POPOVER, Event::PopoverDismissed),
            [Action::ClosePopover, Action::ReturnFocus]
        );
    }

    #[test]
    fn keeps_focus_while_the_main_window_shows() {
        assert_eq!(
            coordinate(BOTH, Event::PopoverDismissed),
            [Action::ClosePopover]
        );
        assert_eq!(coordinate(BOTH, Event::IconClicked), [Action::ClosePopover]);
    }

    #[test]
    fn losing_focus_only_closes_the_popover() {
        assert_eq!(
            coordinate(POPOVER, Event::PopoverBlurred),
            [Action::ClosePopover]
        );
    }

    #[test]
    fn a_closed_popover_ignores_blur_and_escape() {
        assert_eq!(coordinate(NOTHING, Event::PopoverBlurred), []);
        assert_eq!(coordinate(NOTHING, Event::PopoverDismissed), []);
    }

    #[test]
    fn settings_open_in_their_own_window() {
        assert_eq!(
            coordinate(NOTHING, Event::SettingsChosen),
            [Action::ShowSettings]
        );
        assert_eq!(
            coordinate(POPOVER, Event::SettingsChosen),
            [Action::ClosePopover, Action::ShowSettings]
        );
    }

    #[test]
    fn keeps_focus_while_the_settings_show() {
        assert_eq!(
            coordinate(POPOVER_AND_SETTINGS, Event::PopoverDismissed),
            [Action::ClosePopover]
        );
    }

    #[test]
    fn closing_the_settings_hides_them() {
        assert_eq!(
            coordinate(NOTHING, Event::SettingsClosing),
            [Action::HideSettings]
        );
    }

    #[test]
    fn the_dock_icon_brings_back_the_main_window() {
        assert_eq!(coordinate(NOTHING, Event::DockClicked), [Action::ShowMain]);
    }

    #[test]
    fn launching_the_app_again_brings_back_the_main_window() {
        assert_eq!(
            coordinate(NOTHING, Event::LaunchedAgain),
            [Action::ShowMain]
        );
    }

    #[test]
    fn closing_the_main_window_hides_it() {
        assert_eq!(coordinate(MAIN, Event::MainClosing), [Action::HideMain]);
    }
}
