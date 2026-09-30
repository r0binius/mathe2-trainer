//! Telling when ⌘ was held on its own for a moment, which opens the popover. Pure, like an Elm
//! `update`: [`trigger`](super::trigger) feeds it the key events and the elapsed waits, and carries
//! out its effects.

use crate::platform::KeyInput;

/// Where holding ⌘ stands.
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct Hold {
    /// How many times ⌘ went down on its own, which tells a wait for the current press from one
    /// for an earlier press.
    presses: u64,
    /// Whether ⌘ is still down on its own since the latest press, with nothing else in between.
    holding: bool,
}

/// Something that happened while watching for a hold.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum HoldMessage {
    /// A key or mouse event.
    Input(KeyInput),
    /// The wait for the given press is over.
    Elapsed(u64),
}

/// What the shell does next.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum HoldEffect {
    /// Wait a moment, then send [`HoldMessage::Elapsed`] with the given press.
    Wait(u64),
    /// ⌘ was held long enough: open or close the popover.
    Fire,
}

/// What `message` does to `hold`.
#[must_use]
pub fn update_hold(hold: Hold, message: HoldMessage) -> (Hold, Option<HoldEffect>) {
    match message {
        HoldMessage::Input(KeyInput::CommandAlone) => {
            let presses = hold.presses.wrapping_add(1);
            let started = Hold {
                presses,
                holding: true,
            };

            (started, Some(HoldEffect::Wait(presses)))
        }
        HoldMessage::Input(KeyInput::Released | KeyInput::Other) => (released(hold), None),
        HoldMessage::Elapsed(press) if hold.holding && press == hold.presses => {
            // Keeping ⌘ down longer doesn't fire again.
            (released(hold), Some(HoldEffect::Fire))
        }
        HoldMessage::Elapsed(_) => (hold, None),
    }
}

fn released(hold: Hold) -> Hold {
    Hold {
        holding: false,
        ..hold
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Runs the messages from the start and collects the effects.
    fn effects_of(messages: &[HoldMessage]) -> Vec<HoldEffect> {
        messages
            .iter()
            .scan(Hold::default(), |hold, &message| {
                let (next, effect) = update_hold(*hold, message);
                *hold = next;
                Some(effect)
            })
            .flatten()
            .collect()
    }

    const COMMAND: HoldMessage = HoldMessage::Input(KeyInput::CommandAlone);

    #[test]
    fn holding_command_alone_fires_once_the_wait_is_over() {
        assert_eq!(
            effects_of(&[COMMAND, HoldMessage::Elapsed(1)]),
            [HoldEffect::Wait(1), HoldEffect::Fire]
        );
    }

    #[test]
    fn letting_go_early_cancels() {
        let messages = [
            COMMAND,
            HoldMessage::Input(KeyInput::Released),
            HoldMessage::Elapsed(1),
        ];

        assert_eq!(effects_of(&messages), [HoldEffect::Wait(1)]);
    }

    #[test]
    fn a_key_or_click_during_the_hold_cancels() {
        let messages = [
            COMMAND,
            HoldMessage::Input(KeyInput::Other),
            HoldMessage::Elapsed(1),
        ];

        assert_eq!(effects_of(&messages), [HoldEffect::Wait(1)]);
    }

    #[test]
    fn the_wait_of_an_earlier_press_does_not_fire() {
        let messages = [
            COMMAND,
            HoldMessage::Input(KeyInput::Released),
            COMMAND,
            HoldMessage::Elapsed(1),
        ];

        assert_eq!(
            effects_of(&messages),
            [HoldEffect::Wait(1), HoldEffect::Wait(2)]
        );
    }

    #[test]
    fn fires_only_once_per_hold() {
        let messages = [COMMAND, HoldMessage::Elapsed(1), HoldMessage::Elapsed(1)];

        assert_eq!(
            effects_of(&messages),
            [HoldEffect::Wait(1), HoldEffect::Fire]
        );
    }
}
