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

## Keyboard layout

- [ ] The layout selected in the menu bar is read (German and US), also after switching with another app in front.
- [ ] Switching the layout re-resolves the shortcuts on the open screen, shows that layout's progress, and ends a running session.

## Learning and review

- [ ] Training shows the keys, pressed keys pop up, a correct answer shows ✓ and moves on after a second.
- [ ] In a long session (a whole set, twice), moving on after a correct answer stays as quick as at the start.
- [ ] Testing hides the keys; a wrong answer shakes and shows the pressed keys against the right ones.
- [ ] **Forgot** (only while testing) shows the right keys; pressing them moves on, and the shortcut counts as failed.
- [ ] "N mastered" shows when a shortcut is learned; leaving with **Overview** keeps the learned ones.
- [ ] A finished set shows as completed; its shortcuts become due for review.
- [ ] Review tests the due shortcuts, requeues a wrong one, and returns to the app when done.
- [ ] Learning and reviewing are stored: after a restart the progress is still there, and the log shows no rejected command arguments (Rust checks what the webview sends).
- [ ] VoiceOver (⌘F5) announces the shortcut, "Correct" and "Not quite" with the right keys.

## Menu bar and popover

- [ ] The menu bar icon shows, tinted for light and dark menu bars; a click opens the popover centred below it, rounded and translucent.
- [ ] A click elsewhere closes the popover; a second click on the icon and Escape close it and give focus back to the app in front.
- [ ] With the main window open, closing the popover leaves the main window in front.
- [ ] A right click on the icon shows About, Options and Quit, in the UI language.
- [ ] Closing the main window (red button, ⌘W) hides it; the Dock icon and launching the app again bring it back as it was.
- [ ] ⌘, and **Options…** in the icon's menu open the main window with the options, also from the popover.

## Trigger

- [ ] Holding ⌘ alone for a second opens the popover over other apps, and again closes it; holding longer fires once.
- [ ] ⌘C, ⌘Tab, ⌘-click, ⌘⇧ and letting go early don't open it.
- [ ] A fresh start (or `tccutil reset ListenEvent`) asks for Input Monitoring once; without it the log says why hold ⌘ doesn't work.
- [ ] A recorded shortcut (⇧⌘M) opens the popover from any app; after switching the layout (German ↔ US) it still works by its character.
- [ ] The recorder rejects ⌘C, K alone and ⌘Space with the reason; Escape cancels recording without closing the options.

## Security

- [ ] After using every screen, the popover and the options, the log shows no "content security policy blocked" line.

## Options

- [ ] The gear opens the panel over the stepped-back screen, also during practice; Escape closes it.
- [ ] The language switches the whole UI at once and is kept after a restart.
- [ ] **Reset progress** asks for a second click, clears everything, and ends a running practice session.
- [ ] The menu bar and Dock icons switch at once, and the last one left can't be turned off.
- [ ] The language also switches the app menu and the icon's menu (English "Options…", German "Einstellungen …").
- [ ] After midnight, focusing the window moves due counts to the new day.

## Later steps

- [ ] Step 8: the popover shows the frontmost app's menu shortcuts, with search and Escape, and focus returns to the app.
- [ ] Step 9: the packaged app installs, starts at login (and stops when the option is off) and keeps its data across updates.
