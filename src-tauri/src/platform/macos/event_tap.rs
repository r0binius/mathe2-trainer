//! Core Graphics' event taps behind a safe type: with [`carbon`](super::carbon),
//! [`accessibility`](super::accessibility) and [`window_list`](super::window_list), the only
//! modules with `unsafe` code.
//!
//! A listen-only tap sees every key and mouse event in the session without changing it. macOS
//! only creates one once the user allows the app to monitor input (Privacy & Security → Input
//! Monitoring).

#![expect(
    unsafe_code,
    reason = "binds Core Graphics' event taps; each unsafe block states why it's sound"
)]

use std::cell::OnceCell;
use std::ffi::c_void;
use std::ptr::NonNull;

use objc2::MainThreadMarker;
use objc2_core_foundation::{
    CFMachPort, CFRetained, CFRunLoop, CFRunLoopSource, CGPoint, kCFRunLoopCommonModes,
};
use objc2_core_graphics::{
    CGEvent, CGEventField, CGEventFlags, CGEventMask, CGEventTapLocation, CGEventTapOptions,
    CGEventTapPlacement, CGEventTapProxy, CGEventType,
};

/// An event as a tap reports it.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct TapEvent {
    /// What happened, such as a key going down or a mouse button coming up.
    pub kind: CGEventType,
    /// The modifiers down during the event.
    pub flags: CGEventFlags,
    /// The virtual key code of a key event, such as 36 for Return; 0 for other events.
    pub key_code: i64,
    /// Where the pointer was, in global display coordinates with the origin at the top left.
    pub location: CGPoint,
}

/// What a tap calls for every event.
pub type OnEvent = Box<dyn Fn(TapEvent)>;

/// What the tap's callback reaches through its `user_info` pointer.
struct Tap {
    on_event: OnEvent,
    /// The tap itself, to turn it back on when macOS turns it off. Set once it exists.
    port: OnceCell<CFRetained<CFMachPort>>,
}

/// A listen-only event tap on the main run loop. Dropping it removes it and frees its callback;
/// [`EventTap::leak`] keeps it for as long as the app runs.
///
/// It holds a [`MainThreadMarker`], so it can't leave the main thread: it's made, called and
/// dropped where its events arrive, the only thread that touches its [`Tap`].
#[derive(Debug)]
pub struct EventTap {
    port: CFRetained<CFMachPort>,
    source: CFRetained<CFRunLoopSource>,
    /// The callback's data, owned by this value and freed on drop.
    tap: NonNull<Tap>,
    /// Keeps the tap on the main thread: the marker can't be sent to another one.
    _main_thread: MainThreadMarker,
}

impl std::fmt::Debug for Tap {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.debug_struct("Tap").finish_non_exhaustive()
    }
}

impl EventTap {
    /// Calls `on_event` for every event of the types in `mask`, on the main thread, until the tap
    /// is dropped.
    ///
    /// # Errors
    ///
    /// Returns why if macOS refuses the tap, such as when Input Monitoring isn't allowed, for the
    /// caller to report as its own error.
    pub fn listen(
        main_thread: MainThreadMarker,
        mask: CGEventMask,
        on_event: OnEvent,
    ) -> Result<Self, &'static str> {
        let tap = NonNull::from(Box::leak(Box::new(Tap {
            on_event,
            port: OnceCell::new(),
        })));

        // SAFETY: `on_tap_event` has the signature of `CGEventTapCallBack`, and `tap` points to a
        // `Tap` that is freed only once the tap is gone (on failure below, or on drop), so it
        // outlives every callback.
        let created = unsafe {
            CGEvent::tap_create(
                CGEventTapLocation::SessionEventTap,
                CGEventTapPlacement::HeadInsertEventTap,
                CGEventTapOptions::ListenOnly,
                mask,
                Some(on_tap_event),
                tap.as_ptr().cast::<c_void>(),
            )
        };
        let Some(port) = created else {
            // SAFETY: `tap` came from `Box::leak` above, and without a tap nothing else holds it.
            drop(unsafe { Box::from_raw(tap.as_ptr()) });
            return Err("macOS refused to let the app watch the keyboard");
        };
        let Some(source) = CFMachPort::new_run_loop_source(None, Some(&port), 0) else {
            port.invalidate();
            // SAFETY: the tap is invalidated before it ever ran, and `tap` came from `Box::leak`
            // above, which nothing else holds.
            drop(unsafe { Box::from_raw(tap.as_ptr()) });
            return Err("cannot make a run loop source for the event tap");
        };
        let event_tap = Self {
            port,
            source,
            tap,
            _main_thread: main_thread,
        };

        main_run_loop()?.add_source(Some(&event_tap.source), common_modes());
        CGEvent::tap_enable(&event_tap.port, true);
        // SAFETY: the `Tap` lives as long as `event_tap`, and this is the main thread, the only
        // one that touches it.
        let tap = unsafe { event_tap.tap.as_ref() };
        tap.port.get_or_init(|| event_tap.port.clone());
        Ok(event_tap)
    }

    /// Keeps the tap for as long as the app runs, for a watch that's never removed.
    pub fn leak(self) {
        std::mem::forget(self);
    }
}

impl Drop for EventTap {
    fn drop(&mut self) {
        CGEvent::tap_enable(&self.port, false);
        if let Ok(main) = main_run_loop() {
            main.remove_source(Some(&self.source), common_modes());
        }
        self.port.invalidate();
        // SAFETY: the tap is invalidated and off the run loop, so no callback runs anymore, and
        // `tap` came from `Box::leak` in `listen`. The port's own reference in the `Tap` goes
        // with it.
        drop(unsafe { Box::from_raw(self.tap.as_ptr()) });
    }
}

/// The mask that selects the events of `kinds`, one bit per event type.
pub fn mask_of(kinds: &[CGEventType]) -> CGEventMask {
    kinds.iter().fold(0, |mask, kind| {
        mask | 1_u64.checked_shl(kind.0).unwrap_or_default()
    })
}

fn main_run_loop() -> Result<CFRetained<CFRunLoop>, &'static str> {
    CFRunLoop::main().ok_or("there's no main run loop")
}

fn common_modes() -> Option<&'static objc2_core_foundation::CFRunLoopMode> {
    // SAFETY: Core Foundation defines this constant for the whole life of the process.
    unsafe { kCFRunLoopCommonModes }
}

/// The tap's callback, which Core Graphics calls on the main run loop for every event.
unsafe extern "C-unwind" fn on_tap_event(
    _proxy: CGEventTapProxy,
    kind: CGEventType,
    event: NonNull<CGEvent>,
    user_info: *mut c_void,
) -> *mut CGEvent {
    // SAFETY: `user_info` is the `Tap` an `EventTap` owns, which outlives every callback, and this
    // runs on the main thread, the only one that touches it.
    let tap = unsafe { user_info.cast::<Tap>().as_ref() };
    let Some(tap) = tap else {
        return event.as_ptr();
    };

    if kind == CGEventType::TapDisabledByTimeout || kind == CGEventType::TapDisabledByUserInput {
        // macOS turns a tap off when it's slow or during secure input; turn it back on.
        if let Some(port) = tap.port.get() {
            CGEvent::tap_enable(port, true);
        }
    } else {
        // SAFETY: Core Graphics passes an event that is valid until the callback returns.
        let event = Some(unsafe { event.as_ref() });

        (tap.on_event)(TapEvent {
            kind,
            flags: CGEvent::flags(event),
            key_code: CGEvent::integer_value_field(event, CGEventField::KeyboardEventKeycode),
            location: CGEvent::location(event),
        });
    }
    // A listen-only tap passes every event on unchanged, whatever this returns.
    event.as_ptr()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn selects_the_events_by_their_bits() {
        assert_eq!(
            mask_of(&[CGEventType::KeyDown, CGEventType::FlagsChanged]),
            (1 << 10) | (1 << 12)
        );
    }
}
