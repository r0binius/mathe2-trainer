# Smoke test

What `pnpm check` can't prove: the app running on a real Mac. Walk through it with `pnpm tauri dev` before merging a step, and note in the step's review what was checked. Items marked with a later step become due with it.

## Start and window

- [ ] The window opens at 600×480, fixed, black, and fades in once loaded.
- [ ] The traffic lights sit in the title bar, and the window drags by the title bar.
- [ ] With the database unreadable (e.g. rename `mouseless-dev.db` to a folder), the start shows the error and **Try again** loads again once it's readable.
- [ ] The log file `~/Library/Logs/com.robin.mouseless/Mouseless.log` gets the warnings and errors.

## Library, app and set

- [ ] The library shows the apps by category; after learning, the app shows under _Recent_ with "N / M mastered".
- [ ] An app shows its sets; one with due cards shows **Review N** and a yellow badge in the library; otherwise "Next review …".
- [ ] A set lists its shortcuts with their keys on the current layout, ✓ for learned ones, and **Start learning** / **Continue**.
- [ ] Screens slide deeper and back; with _Reduce motion_ on, they switch without moving.

## Keyboard

- [ ] The arrows move focus between cards and rows, → at the edge opens, ← at the edge and Escape go back.
- [ ] Each screen focuses its main action; Enter on **Start** starts learning.
- [ ] During practice, ⌘W, ⌘Q, ⌘H, ⌘M, ⌘C/⌘V and ⌘R are answers, not menu actions.
- [ ] On an ISO keyboard, the keys left of 1 (`^`) and next to left Shift (`<`) are recognized: macOS's _Next window_ shows as ⌘< and accepts it.

## Learning and review

- [ ] Training shows the keys, pressed keys pop up, a correct answer shows ✓ and moves on after a second.
- [ ] Testing hides the keys; a wrong answer shakes and shows the pressed keys against the right ones.
- [ ] **Forgot** (only while testing) shows the right keys; pressing them moves on, and the shortcut counts as failed.
- [ ] "N mastered" shows when a shortcut is learned; leaving with **Overview** keeps the learned ones.
- [ ] A finished set shows as completed; its shortcuts become due for review.
- [ ] Review tests the due shortcuts, requeues a wrong one, and returns to the app when done.
- [ ] VoiceOver (⌘F5) announces the shortcut, "Correct" and "Not quite" with the right keys.

## Options

- [ ] The gear opens the panel over the stepped-back screen, also during practice; Escape closes it.
- [ ] The language switches the whole UI at once and is kept after a restart.
- [ ] **Reset progress** asks for a second click, clears everything, and ends a running practice session.

## Later steps

- [ ] Step 6: the real layout is read (German and US); switching the layout re-resolves the shortcuts, keeps progress per layout and ends a running session.
- [ ] Step 7: holding ⌘ and a custom shortcut open the popover over other apps; ⌘, opens the options; the menu bar icon, Dock icon and launch at login apply at once; after midnight, due counts move to the new day.
- [ ] Step 8: the popover shows the frontmost app's menu shortcuts, with search and Escape, and focus returns to the app.
- [ ] Step 9: the packaged app installs, starts at login and keeps its data across updates.
