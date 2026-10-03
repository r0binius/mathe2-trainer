# Smoke test

What `pnpm check` can't prove: the app running on a real Mac. Walk through it with `pnpm tauri dev` before merging a step, and note in the step's review what was checked. Items marked with a later step become due with it.

## Start and window

- [ ] The window opens at 820×560, resizes down to 640×440, and fades in once loaded.
- [ ] It follows the system's appearance with Mouseless's own palette: paper light and warm dark, opaque, with no system material or accent color.
- [ ] The title bar is 32 px and quiet: the traffic lights centred in it, `mouseless` in mono after them, a hairline below across sidebar and detail; the window drags by it.
- [ ] With the database unreadable (e.g. rename `mouseless-dev.db` to a folder), the start shows the error and **Try again** loads again once it's readable.
- [ ] The log file `~/Library/Logs/com.robin.mouseless/Mouseless.log` gets the warnings and errors.

## Look

- [ ] Text is IBM Plex Sans, keys, counts, figures and captions IBM Plex Mono; key symbols (⌘ ⇧ ⌥ ⌃ ↑ →) all come from the system font and look alike.
- [ ] Pages name themselves with a heading in their content (Overview, the app, the set), not in the title bar.
- [ ] Practice shows where it is (`NOTES · BASICS · LEARN`) above a stage bar with one segment per shortcut: a track while unseen, honey once trained, sage once learned.
- [ ] Key caps are raised in mono; a right press outlines them in sage with ✓, a wrong one in rose with ✗.
- [ ] Buttons have their labels centred; a panel's actions sit as far from its right edge as from its bottom.
- [ ] Settings rows have switches (square-ish, in the action color when on) and a flat language menu that opens the system's menu.
- [ ] Empty tracks (overview meters, progress circles, the stage bar) are visible in light as well as dark.
- [ ] With _Reduce motion_ on, the shake, the slide between shortcuts, the key cap pop and the switch's slide are gone.

## Sidebar, app and set

- [ ] The sidebar lists each app once, by category; after learning, the app moves under _Recent_. It scrolls when the window is short.
- [ ] An app shows its sets; one with due cards shows **Review N** and its due count in the sidebar; otherwise "Next review …".
- [ ] A set lists its shortcuts with their keys on the current layout, ✓ for learned ones, and **Start learning** / **Continue**; the title bar's back button returns to the app.

## Overview

- [ ] The window opens on _Overview_, the first row of the sidebar; ↑ from the first app selects it, and an unknown route leads back to it.
- [ ] Its four figures show what's due today, the reviews done today, the share without a mistake over 30 days, and the days in a row; with no reviews yet, the share shows "–".
- [ ] After a review, going back to the Overview shows the review in today's figures and bar, without a restart.
- [ ] The chart shows 4 weeks with today on the right; hovering a bar names its day and count; VoiceOver reads the total and each day.
- [ ] _Due for review_ opens an app's review; _Progress_ lists the apps with something learned, best learned first, and opens the app. With nothing learned, the hint to choose an app shows instead.
- [ ] Switching the keyboard layout shows that layout's figures; **Reset progress** in Settings empties them.
- [ ] At 640 px wide the four figures stay in one row, in light and dark.

## Keyboard

- [ ] In the sidebar, ↑ and ↓ select the app above or below, and → moves into the detail; the selection is a raised row with an action-colored bar on its left edge.
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
- [ ] A tested shortcut is learned only at its second correct recall in a row, with others in between; after the first, its stage bar segment turns half sage, and a mistake turns it back.
- [ ] "N mastered" shows when a shortcut is learned; leaving with **Overview** keeps the learned ones.
- [ ] A finished set shows as completed; its shortcuts become due for review.
- [ ] Review tests the due shortcuts, requeues a wrong one, and returns to the app when done.
- [ ] Learning and reviewing are stored: after a restart the progress is still there, and the log shows no rejected command arguments (Rust checks what the webview sends).
- [ ] VoiceOver (⌘F5) announces the shortcut, "Correct" and "Not quite" with the right keys.

## Menu bar and popover

- [ ] The menu bar icon shows, tinted for light and dark menu bars; a click opens the popover centred below it, as an opaque panel with a hairline, small corners and a shadow.
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

- [ ] The tabs in the title bar switch between General, Popover and Progress; the chosen tab is raised, its icon in the action color.
- [ ] The language switches the Settings window and the main window at once, and is kept after a restart.
- [ ] **Reset progress** asks for a second click, clears everything, and ends a practice session running in the main window.
- [ ] The menu bar and Dock icons switch at once, and the last one left can't be turned off.
- [ ] The language also switches the app menu and the icon's menu (English "Settings…", German "Einstellungen …").
- [ ] After midnight, focusing the window moves due counts to the new day.

## Packaged app

- [ ] `pnpm tauri build` makes `Mouseless.app`; copied to `/Applications`, it starts, and **About Mouseless** shows its version.
- [ ] It keeps its own database (`mouseless.db`, beside the dev build's `mouseless-dev.db`) across a reinstall.
- [ ] After a rebuild, it asks for Input Monitoring and Accessibility again: the ad-hoc signature changed.

## Learning from how I work

- [ ] Settings → General → **Learn from how I work** is off at first. Turned on without Accessibility or Input Monitoring, a row names each missing one, and **Open System Settings** opens it there; once both are allowed and the window is back in front, the rows go away.
- [ ] With it on, choosing a Notes menu item that Mouseless knows (Darstellung → Als Galerie) with the mouse counts one menu use in `usage` (`sqlite3 …/mouseless-dev.db 'SELECT * FROM usage'`); closing a menu with Escape, an item Mouseless doesn't know, and pressing the shortcut count nothing.
- [ ] Turning it off deletes every row in `usage`, and choices afterwards count nothing; **Reset progress** deletes them too.
- [ ] With **Show the shortcut when I use a menu** on (the default), such a choice shows a banner centred below the menu bar, with the title and keys, for about 2 s; the app stays in front, Mouseless's windows don't come forward, and clicks reach what's under it. A second choice replaces the banner; with the setting off, none shows, and the choice still counts.
- [ ] With a Notes shortcut learned (e.g. Darstellung → Als Galerie, ⌘2), pressing it in Notes counts one use by keys (`by_keys`) per press, also on the keypad; pressing it in Mouseless, or a shortcut not learned, counts nothing. (System Events' `keystroke` types digits on the keypad; `key code 19` is the 2 in the top row.)
- [ ] After choosing a known shortcut from an app's menu, the app's page shows _Chosen from menus, last 30 days_ with _Your commands_, the most chosen first; it's learned like any set, its progress survives a restart, and the app counts what it taught as learned.
- [ ] Holding ⌘ still opens the popover while it's on.
