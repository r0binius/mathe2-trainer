# Smoke test

What `pnpm check` can't prove: the app running on a real Mac. Walk through it with `pnpm tauri dev` before merging a step, and note in the step's review what was checked. Items marked with a later step become due with it.

## Start and window

- [ ] The window opens at 820×560, resizes down to 640×440, and fades in once loaded.
- [ ] It follows the system's appearance, light and dark, and its accent color; the sidebar shows macOS's sidebar material.
- [ ] The traffic lights sit in the sidebar, level with the toolbar's capsules, and the window drags by the toolbar.
- [ ] With the database unreadable (e.g. rename `mouseless-dev.db` to a folder), the start shows the error and **Try again** loads again once it's readable.
- [ ] The log file `~/Library/Logs/com.robin.mouseless/Mouseless.log` gets the warnings and errors.

## Sidebar, app and set

- [ ] The sidebar lists each app once, by category; after learning, the app moves under _Recent_. It scrolls when the window is short.
- [ ] With no app chosen, the detail shows the hint and the apps with reviews due today.
- [ ] An app shows its sets; one with due cards shows **Review N** and its due count in the sidebar; otherwise "Next review …".
- [ ] A set lists its shortcuts with their keys on the current layout, ✓ for learned ones, and **Start learning** / **Continue**; the toolbar's back capsule returns to the app.

## Keyboard

- [ ] In the sidebar, ↑ and ↓ select the app above or below, and → moves into the detail; the selection is accent-colored while the sidebar has focus.
- [ ] In the detail, the arrows move focus between rows; ← at the edge and Escape go back, to the sidebar from an app.
- [ ] Each page focuses its main action, unless focus is in the sidebar; Enter on **Start** starts learning.
- [ ] During practice, ⌘W, ⌘Q, ⌘H, ⌘M, ⌘C/⌘V and ⌘R are answers, not menu actions.
- [ ] On an ISO keyboard, the keys left of 1 (`^`) and next to left Shift (`<`) are recognized: macOS's _Next window_ shows as ⌘< and accepts it.

## Keyboard layout

- [ ] The layout selected in the menu bar is read (German and US), also after switching with another app in front.
- [ ] Switching the layout re-resolves the shortcuts on the open page, shows that layout's progress, and ends a running session.

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

- [ ] The menu bar icon shows, tinted for light and dark menu bars; a click opens the popover centred below it, in Liquid Glass.
- [ ] A click elsewhere closes the popover; a second click on the icon and Escape close it and give focus back to the app in front.
- [ ] With the main window open, closing the popover leaves the main window in front.
- [ ] A right click on the icon shows About, Settings and Quit, in the UI language.
- [ ] Closing the main window (red button, ⌘W) hides it; the Dock icon and launching the app again bring it back as it was.
- [ ] ⌘, and **Settings…** in the icon's menu open the Settings window, also from the popover; closing it hides it.

## Trigger

- [ ] Holding ⌘ alone for a second opens the popover over other apps, and again closes it; holding longer fires once.
- [ ] ⌘C, ⌘Tab, ⌘-click, ⌘⇧ and letting go early don't open it.
- [ ] A fresh start (or `tccutil reset ListenEvent`) asks for Input Monitoring once; without it the log says why hold ⌘ doesn't work.
- [ ] A recorded shortcut (⇧⌘M) opens the popover from any app; after switching the layout (German ↔ US) it still works by its character.
- [ ] The recorder rejects ⌘C, K alone and ⌘Space with the reason; Escape cancels recording.

## Lookup

- [ ] Over Finder (hold ⌘ or click the icon), the popover shows "Finder", a search field with the cursor in it, and the menu shortcuts by menu, without the Apple menu; ⌘↑ and ⌘⌫ show as glyphs.
- [ ] Over Notes, it shows the built-in sets in the UI language instead of the menus, also without Accessibility access.
- [ ] Typing filters by title and menu, ignoring case and accents ("offnen" finds "Öffnen"); reopening starts with an empty search.
- [ ] Holding ⌘ while the main window has focus looks up the app whose window is topmost, never Mouseless.
- [ ] Without Accessibility access (`tccutil reset Accessibility com.robin.mouseless`, in a packaged build: `tauri dev` uses the terminal's access), another app shows the request, and **Open System Settings** opens Privacy & Security → Accessibility.
- [ ] Switching the layout or the language while the popover is closed shows in it the next time.

## Security

- [ ] After using every page, the popover and the Settings window, the log shows no "content security policy blocked" line.

## Settings

- [ ] The toolbar switches between General, Popover and Progress, and shows the pane's name.
- [ ] The language switches the Settings window and the main window at once, and is kept after a restart.
- [ ] **Reset progress** asks for a second click, clears everything, and ends a practice session running in the main window.
- [ ] The menu bar and Dock icons switch at once, and the last one left can't be turned off.
- [ ] The language also switches the app menu and the icon's menu (English "Settings…", German "Einstellungen …").
- [ ] After midnight, focusing the window moves due counts to the new day.

## Packaged app

- [ ] `pnpm tauri build` makes `Mouseless.app`; copied to `/Applications`, it starts, and **About Mouseless** shows its version.
- [ ] It keeps its own database (`mouseless.db`, beside the dev build's `mouseless-dev.db`) across a reinstall.
- [ ] After a rebuild, it asks for Input Monitoring and Accessibility again: the ad-hoc signature changed.
