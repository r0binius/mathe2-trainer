//! Whether the user allows what the system guards.

use serde::Serialize;

/// Whether the user allows something the system guards, such as reading other apps' menus
/// (Privacy & Security → Accessibility) or watching the keyboard (→ Input Monitoring).
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Access {
    /// The user allowed it.
    Granted,
    /// The user hasn't allowed it yet, or turned it off.
    Denied,
}

impl Access {
    /// `Granted` if `granted`, else `Denied`.
    #[must_use]
    pub fn of(granted: bool) -> Self {
        if granted { Self::Granted } else { Self::Denied }
    }
}
