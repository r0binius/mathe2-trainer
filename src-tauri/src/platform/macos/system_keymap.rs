//! The keyboard layout selected in macOS, as a [`KeymapSource`].

use std::sync::atomic::AtomicBool;

use crate::error::AppError;
use crate::platform::macos::carbon::TextInputSources;
use crate::platform::macos::input_source;
use crate::platform::{KeymapSource, Layout};

/// The keyboard layout selected in macOS.
///
/// It must be read on the main thread, which Tauri runs synchronous commands and setup on. Made
/// once, by [`current`](crate::platform::current), and kept in Tauri's managed state.
#[derive(Debug, Default)]
pub struct SystemKeymap {
    /// Whether its changes are watched already, which may happen only once.
    observing: AtomicBool,
}

impl KeymapSource for SystemKeymap {
    fn current_layout(&self) -> Result<Layout, AppError> {
        input_source::current_layout(TextInputSources::new()?, None)
    }

    fn watch_changes(&self, on_change: Box<dyn Fn()>) -> Result<(), AppError> {
        TextInputSources::new()?.observe_selection(&self.observing, on_change)?;
        Ok(())
    }
}
