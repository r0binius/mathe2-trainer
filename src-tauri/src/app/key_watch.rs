//! Telling which learned shortcut a key press used, which the coach counts. Pure: the
//! [`coach`](super::coach) gives it the shortcuts the frontend watches, the keys pressed and the
//! app in front.

use std::collections::BTreeSet;

use serde::Deserialize;

use crate::platform::RunningApp;
use crate::services::values::ShortcutId;

/// A learned shortcut whose key presses count, as the main window sends it.
#[derive(Clone, Debug, Eq, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct WatchedShortcut {
    /// The shortcut, which the count is kept for.
    pub id: ShortcutId,
    /// The bundle IDs of its app, which must be in front for a press to count.
    pub bundle_ids: Vec<String>,
    /// Its keys on the current layout, named as the shortcut data names them.
    pub keys: Vec<String>,
}

/// The combinations the platform reports presses of: each watched shortcut's keys, once.
#[must_use]
pub fn combinations(watched: &[WatchedShortcut]) -> Vec<Vec<String>> {
    let unique: BTreeSet<_> = watched
        .iter()
        .map(|shortcut| shortcut.keys.clone())
        .collect();

    unique.into_iter().collect()
}

/// The watched shortcut that pressing `keys` in `app` used, if any: one of that app's with exactly
/// those keys. `app` is `None` while no other app is in front, such as while the user practices
/// in Mouseless itself, and then nothing counts.
#[must_use]
pub fn shortcut_used<'a>(
    watched: &'a [WatchedShortcut],
    app: Option<&RunningApp>,
    keys: &[String],
) -> Option<&'a ShortcutId> {
    let bundle_id = app?.bundle_id.as_ref()?;

    watched
        .iter()
        .find(|shortcut| shortcut.keys == keys && shortcut.bundle_ids.contains(bundle_id))
        .map(|shortcut| &shortcut.id)
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    fn watched() -> Vec<WatchedShortcut> {
        serde_json::from_value(json!([
            { "id": "notes/Meta+n", "bundleIds": ["com.apple.Notes"], "keys": ["Meta", "n"] },
            { "id": "notes/Meta+f", "bundleIds": ["com.apple.Notes"], "keys": ["Meta", "f"] },
            { "id": "terminal/Meta+n", "bundleIds": ["com.apple.Terminal"], "keys": ["Meta", "n"] },
        ]))
        .expect("the watched shortcuts deserialize")
    }

    fn app(bundle_id: &str) -> RunningApp {
        RunningApp {
            process: 42,
            name: "App".to_owned(),
            bundle_id: Some(bundle_id.to_owned()),
        }
    }

    fn keys(names: &[&str]) -> Vec<String> {
        names.iter().map(ToString::to_string).collect()
    }

    #[test]
    fn watches_each_combination_once() {
        assert_eq!(
            combinations(&watched()),
            [keys(&["Meta", "f"]), keys(&["Meta", "n"])]
        );
    }

    #[test]
    fn finds_the_shortcut_of_the_app_in_front() {
        let watched = watched();

        assert_eq!(
            shortcut_used(
                &watched,
                Some(&app("com.apple.Terminal")),
                &keys(&["Meta", "n"])
            ),
            Some(&ShortcutId::stored("terminal/Meta+n".to_owned()))
        );
    }

    #[test]
    fn counts_nothing_in_an_app_without_the_shortcut() {
        let watched = watched();

        assert_eq!(
            shortcut_used(
                &watched,
                Some(&app("com.apple.Terminal")),
                &keys(&["Meta", "f"])
            ),
            None
        );
    }

    #[test]
    fn counts_nothing_without_another_app_in_front() {
        assert_eq!(shortcut_used(&watched(), None, &keys(&["Meta", "n"])), None);
    }

    #[test]
    fn rejects_an_id_without_its_app() {
        let sent = json!([{ "id": "Meta+n", "bundleIds": [], "keys": ["Meta", "n"] }]);

        assert!(serde_json::from_value::<Vec<WatchedShortcut>>(sent).is_err());
    }
}
