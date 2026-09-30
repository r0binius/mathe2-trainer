//! Decides what the windows do when something happens to them, to the menu bar icon or in a menu
//! (the Mediator in `architecture.md`). The tray, the popover and the main window only report
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
}

/// Something that happened to a window, to the menu bar icon or in a menu.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Event {
    /// The menu bar icon was clicked.
    IconClicked,
    /// The popover lost focus, such as to a click elsewhere.
    PopoverBlurred,
    /// The popover was closed from inside, with Escape.
    PopoverDismissed,
    /// Options was chosen from the menu bar icon's menu or the app menu (⌘,).
    OptionsChosen,
    /// The Dock icon was clicked.
    DockClicked,
    /// The main window's close button or ⌘W was pressed.
    MainClosing,
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
    /// Hide the main window, keeping its screens as they are.
    HideMain,
    /// Tell the main window to open its options panel.
    OpenOptions,
}

/// What the windows do when `event` happens while `showing`.
#[must_use]
pub fn coordinate(showing: Showing, event: Event) -> Vec<Action> {
    match event {
        Event::IconClicked | Event::PopoverDismissed if showing.popover => dismiss(showing),
        Event::IconClicked => vec![Action::OpenPopover],
        // Focus already went elsewhere, so there's none to give back.
        Event::PopoverBlurred if showing.popover => vec![Action::ClosePopover],
        Event::PopoverDismissed | Event::PopoverBlurred => vec![],
        Event::OptionsChosen if showing.popover => {
            vec![Action::ClosePopover, Action::ShowMain, Action::OpenOptions]
        }
        Event::OptionsChosen => vec![Action::ShowMain, Action::OpenOptions],
        Event::DockClicked => vec![Action::ShowMain],
        Event::MainClosing => vec![Action::HideMain],
    }
}

/// Closes the popover and gives focus back to the app it was opened over. With the main window
/// showing, Mouseless keeps focus: hiding the app would hide the main window too.
fn dismiss(showing: Showing) -> Vec<Action> {
    if showing.main {
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
    };
    const POPOVER: Showing = Showing {
        popover: true,
        main: false,
    };
    const MAIN: Showing = Showing {
        popover: false,
        main: true,
    };
    const BOTH: Showing = Showing {
        popover: true,
        main: true,
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
    fn options_open_in_the_main_window() {
        assert_eq!(
            coordinate(NOTHING, Event::OptionsChosen),
            [Action::ShowMain, Action::OpenOptions]
        );
        assert_eq!(
            coordinate(POPOVER, Event::OptionsChosen),
            [Action::ClosePopover, Action::ShowMain, Action::OpenOptions]
        );
    }

    #[test]
    fn the_dock_icon_brings_back_the_main_window() {
        assert_eq!(coordinate(NOTHING, Event::DockClicked), [Action::ShowMain]);
    }

    #[test]
    fn closing_the_main_window_hides_it() {
        assert_eq!(coordinate(MAIN, Event::MainClosing), [Action::HideMain]);
    }
}
