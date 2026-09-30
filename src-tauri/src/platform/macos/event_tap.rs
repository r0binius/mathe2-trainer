//! Core Graphics' event taps behind a safe function: with [`carbon`](super::carbon), the only
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
use objc2_core_foundation::{CFMachPort, CFRetained, CFRunLoop, kCFRunLoopCommonModes};
use objc2_core_graphics::{
    CGEvent, CGEventFlags, CGEventMask, CGEventTapLocation, CGEventTapOptions, CGEventTapPlacement,
    CGEventTapProxy, CGEventType,
};

use crate::error::AppError;

/// What a tap calls for every event: its type and the modifier flags down during it.
pub type OnEvent = Box<dyn Fn(CGEventType, CGEventFlags)>;

/// What the tap's callback reaches through its `user_info` pointer.
struct Tap {
    on_event: OnEvent,
    /// The tap itself, to turn it back on when macOS turns it off. Set once it exists.
    port: OnceCell<CFRetained<CFMachPort>>,
}

/// Calls `on_event` for every event of the types in `mask`, on the main thread, for as long as the
/// app runs.
///
/// The tap and its callback are leaked on purpose, like the layout observer: they live as long as
/// the app. The [`MainThreadMarker`] proves the tap is made where its events arrive, the main run
/// loop, which is the only thread that touches the leaked [`Tap`].
///
/// # Errors
///
/// Returns a trigger error if macOS refuses the tap, such as when Input Monitoring isn't allowed.
pub fn listen(
    _main_thread: MainThreadMarker,
    mask: CGEventMask,
    on_event: OnEvent,
) -> Result<(), AppError> {
    let tap = Box::into_raw(Box::new(Tap {
        on_event,
        port: OnceCell::new(),
    }));

    // SAFETY: `on_tap_event` has the signature of `CGEventTapCallBack`, and `tap` points to a
    // `Tap` that is only freed below if the tap doesn't exist, so it outlives every callback.
    let created = unsafe {
        CGEvent::tap_create(
            CGEventTapLocation::SessionEventTap,
            CGEventTapPlacement::HeadInsertEventTap,
            CGEventTapOptions::ListenOnly,
            mask,
            Some(on_tap_event),
            tap.cast::<c_void>(),
        )
    };
    let Some(port) = created else {
        // SAFETY: `tap` came from `Box::into_raw` above, and without a tap nothing else holds it.
        drop(unsafe { Box::from_raw(tap) });
        return Err(AppError::trigger(
            "macOS refused to let the app watch the keyboard",
        ));
    };

    add_to_main_run_loop(&port)?;
    CGEvent::tap_enable(&port, true);
    // SAFETY: `tap` is leaked from here on and only read on the main thread, which this is.
    let tap = unsafe { &*tap };
    tap.port.get_or_init(|| port);
    Ok(())
}

fn add_to_main_run_loop(port: &CFMachPort) -> Result<(), AppError> {
    let source = CFMachPort::new_run_loop_source(None, Some(port), 0)
        .ok_or_else(|| AppError::trigger("cannot make a run loop source for the event tap"))?;
    let main = CFRunLoop::main().ok_or_else(|| AppError::trigger("there's no main run loop"))?;
    // SAFETY: Core Foundation defines this constant for the whole life of the process.
    let common_modes = unsafe { kCFRunLoopCommonModes };

    main.add_source(Some(&source), common_modes);
    Ok(())
}

/// The tap's callback, which Core Graphics calls on the main run loop for every event.
unsafe extern "C-unwind" fn on_tap_event(
    _proxy: CGEventTapProxy,
    kind: CGEventType,
    event: NonNull<CGEvent>,
    user_info: *mut c_void,
) -> *mut CGEvent {
    // SAFETY: `user_info` is the `Tap` that `listen` leaked, and this runs on the main thread,
    // the only one that touches it.
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
        let flags = CGEvent::flags(Some(unsafe { event.as_ref() }));
        (tap.on_event)(kind, flags);
    }
    // A listen-only tap passes every event on unchanged, whatever this returns.
    event.as_ptr()
}
