//! Telling a menu choice from browsing a menu, which the coach counts. Pure, like an Elm `update`:
//! [`coach`](super::coach) feeds it what the platform reports and carries out its effects.
//!
//! The Accessibility API reports which item is highlighted, but shows a choice and a menu closed
//! with Escape the same way. The event tap tells them apart: a choice is a mouse-up on the
//! highlighted item, or Return while it's highlighted (spike 18.3 in
//! `docs/specs/science-backed-training.md`).

use crate::platform::{MenuItem, Point, RunningApp};

/// Where watching the menus stands.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct MenuWatch {
    /// The app whose menus are observed: the one in front at the last click or key press.
    app: Option<RunningApp>,
    /// Its highlighted item with a shortcut, until its menu closes or the item is chosen.
    highlighted: Option<MenuItem>,
}

/// Something that happened while watching.
#[derive(Clone, Debug, PartialEq)]
pub enum MenuMessage {
    /// A mouse button or key went down, with the app in front at that moment, if any.
    Pressed(Option<RunningApp>),
    /// The left mouse button came up at a point.
    MouseUp(Point),
    /// Return or Enter went down.
    Return,
    /// The observed app highlighted another item: one with a shortcut, or one without.
    Highlighted(Option<MenuItem>),
    /// One of the observed app's menus closed.
    MenuClosed,
}

/// What the shell does next.
#[derive(Clone, Debug, PartialEq)]
pub enum MenuEffect {
    /// Observe the menus of the app running as this process instead, or none.
    Observe(Option<i32>),
    /// The user chose the item with these keys from a menu of the app with this bundle ID.
    Chosen {
        /// The app's bundle ID, which the frontend finds the app's shortcuts by.
        bundle_id: String,
        /// The item's keys, named as in the shortcut data.
        keys: Vec<String>,
    },
}

/// What `message` does to `watch`.
#[must_use]
pub fn update_menu_watch(
    watch: MenuWatch,
    message: MenuMessage,
) -> (MenuWatch, Option<MenuEffect>) {
    match message {
        MenuMessage::Pressed(app) if process_of(app.as_ref()) != process_of(watch.app.as_ref()) => {
            let process = process_of(app.as_ref());

            (
                MenuWatch {
                    app,
                    highlighted: None,
                },
                Some(MenuEffect::Observe(process)),
            )
        }
        MenuMessage::Pressed(_) => (watch, None),
        MenuMessage::MouseUp(point) => {
            let on_item = watch
                .highlighted
                .as_ref()
                .is_some_and(|item| item.frame.contains(point));

            if on_item {
                chosen(watch)
            } else {
                (watch, None)
            }
        }
        MenuMessage::Return => chosen(watch),
        MenuMessage::Highlighted(highlighted) => (
            MenuWatch {
                highlighted,
                ..watch
            },
            None,
        ),
        MenuMessage::MenuClosed => (
            MenuWatch {
                highlighted: None,
                ..watch
            },
            None,
        ),
    }
}

/// The highlighted item chosen, if there is one and its app has a bundle ID to find it by.
fn chosen(watch: MenuWatch) -> (MenuWatch, Option<MenuEffect>) {
    let MenuWatch { app, highlighted } = watch;
    let effect = app
        .as_ref()
        .and_then(|app| app.bundle_id.clone())
        .zip(highlighted)
        .map(|(bundle_id, item)| MenuEffect::Chosen {
            bundle_id,
            keys: item.keys,
        });

    (
        MenuWatch {
            app,
            highlighted: None,
        },
        effect,
    )
}

fn process_of(app: Option<&RunningApp>) -> Option<i32> {
    app.map(|app| app.process)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::platform::Frame;

    fn notes() -> RunningApp {
        RunningApp {
            process: 42,
            name: "Notizen".to_owned(),
            bundle_id: Some("com.apple.Notes".to_owned()),
        }
    }

    /// "Select All" (⌘A), 200 pixels wide and 22 high, at (100, 300).
    fn select_all() -> MenuItem {
        MenuItem {
            keys: vec!["Meta".to_owned(), "a".to_owned()],
            frame: Frame {
                origin: Point { x: 100.0, y: 300.0 },
                width: 200.0,
                height: 22.0,
            },
        }
    }

    fn chosen_select_all() -> MenuEffect {
        MenuEffect::Chosen {
            bundle_id: "com.apple.Notes".to_owned(),
            keys: vec!["Meta".to_owned(), "a".to_owned()],
        }
    }

    /// Notes in front, with `item` highlighted.
    fn highlighting(item: Option<MenuItem>) -> MenuWatch {
        MenuWatch {
            app: Some(notes()),
            highlighted: item,
        }
    }

    fn run(watch: MenuWatch, messages: Vec<MenuMessage>) -> (MenuWatch, Vec<MenuEffect>) {
        messages
            .into_iter()
            .fold((watch, Vec::new()), |(watch, mut effects), message| {
                let (watch, effect) = update_menu_watch(watch, message);
                effects.extend(effect);
                (watch, effects)
            })
    }

    #[test]
    fn observes_the_app_in_front_once_it_changes() {
        let (watch, effect) =
            update_menu_watch(MenuWatch::default(), MenuMessage::Pressed(Some(notes())));

        assert_eq!(effect, Some(MenuEffect::Observe(Some(42))));
        assert_eq!(watch, highlighting(None));
    }

    #[test]
    fn keeps_observing_while_the_same_app_is_in_front() {
        let watch = highlighting(Some(select_all()));

        assert_eq!(
            update_menu_watch(watch.clone(), MenuMessage::Pressed(Some(notes()))),
            (watch, None)
        );
    }

    #[test]
    fn stops_observing_when_no_app_is_in_front() {
        let (_, effect) = update_menu_watch(highlighting(None), MenuMessage::Pressed(None));

        assert_eq!(effect, Some(MenuEffect::Observe(None)));
    }

    #[test]
    fn a_mouse_up_on_the_highlighted_item_chooses_it() {
        let (watch, effect) = update_menu_watch(
            highlighting(Some(select_all())),
            MenuMessage::MouseUp(Point { x: 150.0, y: 310.0 }),
        );

        assert_eq!(effect, Some(chosen_select_all()));
        assert_eq!(watch, highlighting(None));
    }

    #[test]
    fn a_mouse_up_elsewhere_chooses_nothing() {
        let watch = highlighting(Some(select_all()));

        assert_eq!(
            update_menu_watch(
                watch.clone(),
                MenuMessage::MouseUp(Point { x: 150.0, y: 322.0 })
            ),
            (watch, None)
        );
    }

    #[test]
    fn return_chooses_the_highlighted_item() {
        let (_, effect) = update_menu_watch(highlighting(Some(select_all())), MenuMessage::Return);

        assert_eq!(effect, Some(chosen_select_all()));
    }

    #[test]
    fn a_menu_closed_with_escape_chooses_nothing_afterwards() {
        let (_, effects) = run(
            highlighting(None),
            vec![
                MenuMessage::Highlighted(Some(select_all())),
                MenuMessage::MenuClosed,
                MenuMessage::MouseUp(Point { x: 150.0, y: 310.0 }),
                MenuMessage::Return,
            ],
        );

        assert_eq!(effects, []);
    }

    #[test]
    fn an_item_without_a_shortcut_chooses_nothing() {
        let (_, effects) = run(
            highlighting(None),
            vec![
                MenuMessage::Highlighted(Some(select_all())),
                MenuMessage::Highlighted(None),
                MenuMessage::Return,
            ],
        );

        assert_eq!(effects, []);
    }

    #[test]
    fn an_app_without_a_bundle_id_chooses_nothing() {
        let bare = RunningApp {
            bundle_id: None,
            ..notes()
        };
        let watch = MenuWatch {
            app: Some(bare),
            highlighted: Some(select_all()),
        };

        assert_eq!(update_menu_watch(watch, MenuMessage::Return).1, None);
    }

    #[test]
    fn switching_apps_forgets_the_highlight() {
        let other = RunningApp {
            process: 7,
            ..notes()
        };
        let (_, effects) = run(
            highlighting(Some(select_all())),
            vec![MenuMessage::Pressed(Some(other)), MenuMessage::Return],
        );

        assert_eq!(effects, [MenuEffect::Observe(Some(7))]);
    }
}
