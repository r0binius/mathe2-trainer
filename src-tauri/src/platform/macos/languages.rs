//! The languages the user prefers, as set in macOS.

use objc2_foundation::NSLocale;

/// The user's preferred languages, most preferred first, as BCP 47 tags such as `de-DE`. The same
/// list the webview reports as `navigator.languages`.
#[must_use]
pub fn preferred_languages() -> Vec<String> {
    NSLocale::preferredLanguages()
        .iter()
        .map(|language| language.to_string())
        .collect()
}
