# Legacy architecture (mouseless-old)

How the Electron version in `../mouseless-old` is built, as a reference for the rewrite. It covers what each part does, how the parts interact, the behaviour details that are easy to miss, and what the rewrite should keep or change.

Paths are relative to `mouseless-old/src/`. The target design lives in `mouseless-old/REWRITE.md`.

---

## 1. What the app does

- **Library:** apps grouped by category → sets of an app → the shortcuts of a set, with progress.
- **Learn:** practice one set until every shortcut is pressed correctly without seeing its keys.
- **Review:** spaced repetition (FSRS-5) for learned shortcuts, one due queue per app.
- **Lookup:** a menu bar popover that shows the shortcuts of the frontmost app, either from built-in sets or read from the app's menu bar.
- **Layout-aware:** every shortcut is translated to the current keyboard layout. Progress is stored separately per layout.

There are about 630 shortcuts across 10 apps (plus a `test` app that only shows in debug mode). Shortcut titles are German and the UI is English.

---

## 2. Big picture

```
┌──────────────────────── Electron main process (Node) ────────────────────────┐
│ index.js      windows, IPC handlers, single instance, dock, layout reload    │
│ MenuBar       tray + popover (menubar lib), global shortcut, context menu    │
│ LongPress     hold ⌘ for 1 s, system-wide (uiohook-napi)                      │
│ ActiveApp     frontmost app name (osascript + JXA)                            │
│ WindowShortcuts  menu shortcuts of any app (window-shortcuts binary, AX API) │
│ Keymap        keyboard layout (native-keymap)                                 │
│ Store         config.json (electron-store)                                    │
│ MenuBuilder, AutoStart                                                        │
└───────────────▲──────────────────────────────────────────────┬───────────────┘
                │ ipcRenderer.sendSync / send                  │ webContents.send
┌───────────────┴────────── preload/index.js ───────────────────▼──────────────┐
│ window.mouseless = { store.get/set/delete/clear (sync), keymap, send, on }   │
└───────────────▲──────────────────────────────────────────────┬───────────────┘
┌───────────────┴──────── renderer (Vue 3, sandboxed) ──────────▼──────────────┐
│ one bundle, two windows:                                                     │
│   main window     600×480   routes /, /app/...                               │
│   popover         300×480   route /shortcuts                                 │
│ services: DB, Keyboard, Reviews, FSRS, CleanUp, HealthCheck, Store, Event    │
│ models:   App, Run                                                           │
│ apps/*.js shortcut data, one file per app                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

The rule the old app follows, and the new one keeps: **the native side owns the OS and the disk, and the web side owns the domain and the UI.** The old app breaks it in one direction only: the renderer reads and writes the disk synchronously, through IPC, whenever it wants.

---

## 3. Startup sequence

Main process (`main/index.js`):

1. Takes the single-instance lock. A second launch triggers `second-instance`, which shows the main window.
2. Hides the dock icon if `showDockIcon` is false. This happens before `ready`.
3. On `ready`: `AutoStart.update()`, sets the app menu, registers IPC, and subscribes to `Keymap.onChange`, which reloads **all** windows.
4. Creates the main window, hidden if the app was opened at login (`wasOpenedAtLogin`).
5. `MenuBar.create()`: tray + a preloaded, hidden popover window + the trigger (global shortcut or hold ⌘).

Renderer (`renderer/src/main.js`), in each window:

1. The preload has already fetched the keymap synchronously (`keymap:get`).
2. Importing `Keyboard.js` builds the **module-level** keymap (ISO swap, blocked numpad keys removed) and the blocked shortcuts. The blocked list includes the current Mouseless shortcut, read **once**.
3. `CleanUp.run()` prunes runs and cards and imports learned shortcuts as cards (§9).
4. In dev only, `HealthCheck.run()` logs data problems.
5. Mounts `Wrapper`, which sets up spatial navigation and the options overlay.

Both windows run steps 3–4, so cleanup runs twice. It's idempotent, so this is harmless.

---

## 4. The bridge (`preload/index.js`)

| Member                    | Implementation                | Notes                                                                                                                           |
| ------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `store.get(key, default)` | `sendSync('store:get')`       | **Synchronous**, blocks the renderer. Called from getters that run during render.                                               |
| `store.set/delete/clear`  | `sendSync`                    | Values are deep-cloned with `JSON.parse(JSON.stringify())` in `services/Store.js`, because Vue proxies can't be cloned for IPC. |
| `keymap`                  | `sendSync('keymap:get')` once | A snapshot. A layout change reloads the window instead of updating it.                                                          |
| `send(channel, ...args)`  | `ipcRenderer.send`            | Untyped string channels.                                                                                                        |
| `on(channel, cb)`         | `ipcRenderer.on`              | Returns an unsubscribe function.                                                                                                |

IPC channels in use:

| Direction       | Channel                                        | Purpose                                          |
| --------------- | ---------------------------------------------- | ------------------------------------------------ |
| renderer → main | `app:relaunch`                                 | "Restart App" button after dock/menu bar toggles |
|                 | `openAccessibilitySettings`                    | opens System Settings → Privacy → Accessibility  |
|                 | `showMainWindow`                               | "maximize" in the popover                        |
|                 | `shortcutChanged`                              | re-registers the trigger                         |
|                 | `hide`                                         | Escape in the popover                            |
| main → renderer | `activeWindow:loading` / `:response` / `:hide` | lookup lifecycle (§10)                           |
|                 | `showOptions`                                  | menu → Preferences                               |

---

## 5. Persistence

A single file, `~/Library/Application Support/Mouseless/config.json` (electron-store):

```jsonc
{
  "shortcut": ["Meta"],          // ["Meta"] alone means "hold ⌘ for 1 s", anything else is an accelerator
  "showMenubar": true,
  "showDockIcon": true,
  "autoStart": true,
  "runs": {                      // object keyed by run id
    "<uuid>": {
      "id": "<uuid>", "appId": "rectangle", "setId": "halves", "setVersion": 1,
      "createdAt": "2026-01-31T12:00:00Z", "finishedAt": null,
      "trainedIds": [], "learnedIds": ["<sha256>", …], "skippedIds": [],
      "locale": "Deutsch"         // native-keymap localizedName of the layout
    }
  },
  "cards": [                     // a list, because layout names may contain dots (electron-store dot paths)
    {
      "appId": "rectangle", "shortcutId": "<sha256>", "locale": "Deutsch",
      "stability": 3.17, "difficulty": 5.3, "lastReviewAt": "ISO", "dueAt": "ISO",
      "reps": 2, "lapses": 0
    }
  ]
}
```

- Migrations are keyed by app version (`1.0.0` clears everything, `1.1.0`/`1.5.0` change the default shortcut).
- Every model getter reads the store again: `DB.runs` → `Store.get('runs')` → sync IPC → JSON parse. Nothing in the renderer is reactive; the UI stays correct only because routes remount on navigation.
- Timestamps use two formats: runs use `utcNow()` (`…Z` without milliseconds), cards use `toISOString()`.
- **Bug:** "Reset Progress" only deletes `runs`, so `cards` survive and reviews keep showing up.

---

## 6. Keyboard layout (`services/Keyboard.js`, `main/services/Keymap.js`)

This is the most intricate part and the one most worth understanding.

### 6.1 The keymap

`native-keymap` returns one entry per [`KeyboardEvent.code`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code):

```js
KeyZ:  { value: 'y', withShift: 'Y', withAltGr: '¥', withShiftAltGr: 'Á' }   // German
Digit7:{ value: '7', withShift: '/', withAltGr: '|', withShiftAltGr: '\\' }
```

Adjustments:

- **ISO swap:** on ISO keyboards, `Backquote` and `IntlBackslash` are swapped (a known native-keymap quirk, see vscode#24153).
- **Blocked keys:** the numpad operators are removed, so `+`, `-`, `*` and `/` resolve to the main keyboard.
- `locale` is the layout's `localizedName` (for example `"Deutsch"` or `"U.S."`), and progress is stored per locale.

### 6.2 Resolving a definition (`resolveCodesFromKeys`)

Shortcut data uses **characters** (`'?'`, `'k'`) or **codes** (`'ArrowUp'`, `'F6'`) plus modifiers (`Meta`, `Control`, `Alt`, `Shift`). For each key it searches the keymap in this order:

1. `value === key` → `key` (the unshifted character itself)
2. `withShift === key` → `['Shift', value]`
3. `withAltGr === key` → `['Alt', value]`
4. `withShiftAltGr === key` → `['Shift', 'Alt', value]`
5. no match → `key` unchanged (codes like `ArrowUp`)

Then it flattens the result, drops empty values and sorts the modifiers **⌃ ⌥ ⇧ ⌘** (Control, Alt, Shift, Meta), with other keys after them. If a definition has several alternatives (`[[…], […]]`), the **shortest** resolved one wins.

Example on a German layout: `['Meta', '?']` → `?` is `withShift` of `Minus` (value `ß`) → `['Shift', 'Meta', 'ß']`.

The result is a list of **characters as your layout labels them**, not physical codes, despite the name.

### 6.3 `isPossible(keys)`

A shortcut is dropped (hidden everywhere) if:

- it contains a key twice (for example `['Shift', 'Shift', …]`, which can happen after resolving),
- it consists only of modifiers,
- it matches a blocked system shortcut, compared as a set: ⌘Tab, ⌘⇧4/5/6, ⌥⌘Esc, F11, ⌘Space, ⌃ + arrows, ⌃⌘D, ⌥⌘D, or **the current Mouseless shortcut**.

### 6.4 Capturing key presses (`new Keyboard()`)

An instance listens to `keydown`/`keyup` on `window` and emits two events:

- `update` on every change of modifiers (used to light up keys while holding them).
- `shortcut` when a non-modifier key goes down. The pressed keys are then reset.

`getKeyValue(event)` maps `event.code` to a character using the layout:

- Shift alone → `withShift`; Alt alone → `withAltGr`; Shift + Alt → `withShiftAltGr`; anything else (including ⌘ + Shift) → `value`.
- A space (or non-breaking space) → `'Space'`, and an empty value → the code.

Matching (`is(expected)`) resolves the pressed keys with the same function and compares both sides as **case-insensitive sets**. The pressed keys go through the same pipeline as the definition, which is why characters work on any layout.

Users of this class: `TestRoute`, `ReviewRoute`, and the shortcut recorder in `OptionsOverlay`. Each creates an instance and must call `destroy()`.

### 6.5 Labels

`helpers.keyLabel` uses `keyboard-symbol` in mac mode (`Meta` → `⌘`) and uppercases the result, except `ß`. `Key` also shows a second label for special keys (`Cmd`, `Ctrl`, `Esc`, …).

---

## 7. Shortcut data and models

### 7.1 App definition (`apps/<id>.js`)

```js
export default {
  id: 'rectangle', title: 'Rectangle', category: 'System', description: null,
  debug: false,                                   // only shown with VITE_DEBUG=true
  sets: [{ id: 'halves', title: 'Hälften und Ecken', version: 1, shortcuts: [
    { title: 'Linke Hälfte', keys: ['Control', 'Alt', 'ArrowLeft'] },
    { title: 'Quick Switcher', keys: [['Meta', 'k'], ['Meta', 't']] },   // alternatives
    { title: '…', description: 'optional', keys: [...] },
  ] }],
}
```

`DB.js` loads them with `import.meta.glob`. Logos come from `assets/logos/<id>.svg`.

### 7.2 Shortcut IDs

```js
sha256(appId + collect(shortcut.keys).sort().toArray().toString()); // hex
```

- It hashes the **definition** keys, not the resolved ones, so the ID is the same on every layout.
- It uses JS's default sort (string comparison), and for alternatives it sorts the nested arrays by their `toString()`. `toString()` flattens nested arrays with commas.
- The set ID is not part of it. The same keys in two sets of one app share an ID, so learning one also counts for the other.
- The title isn't part of it either, so renaming a shortcut keeps its progress, while changing its keys resets it.

All runs and cards reference these IDs. The rewrite doesn't carry over the old progress, so it keeps the semantics above but not the hash and its sort quirks.

### 7.3 `App` model (`models/App.js`)

- `shortcutsBySet(setId)`: formats every shortcut (`{ …definition, id, resolvedKeys, isPossible }`), drops impossible ones, and caches the result per set. The cache is safe because the window reloads when the layout changes.
- `runs`: `DB.runs` filtered by app, read again from the store on every access.
- `bestRunBySet(setId)`: the run with the most `learnedIds`, which is what the progress UI shows.
- `latestRunBySet`, `latestUpdatedSet`: not used by the UI.
- `learnedShortcuts`: the union of learned shortcuts across each set's best run. It drives the "Recent" apps list and the app progress.
- `recentSets` / `unrecentSets`: sets with at least one learned shortcut, and the rest.

---

## 8. Learn mode (`components/TestRoute`, `models/Run.js`)

### 8.1 Run lifecycle

- On entering the route it resumes the newest **unfinished** run for the app, set and layout, or creates a new one (`uuid`, `createdAt`, `locale`, `setVersion`).
- Only `learnedIds` are restored. `trainedIds` always start empty, and `skippedIds` are **not** restored either.
- After every shortcut, `run.update({ trainedIds, learnedIds, skippedIds })` writes the whole run.
- A run is finished when `learnedIds.length === shortcuts.length`, where the count excludes this session's skipped shortcuts. `finishedAt` is set only if nothing was skipped. With skips, the run stays unfinished and the user is sent back.
- `setVersion` is stored but never compared.

### 8.2 One step

Each shortcut is in one of three states for this session: **unseen**, **trained** (pressed correctly while the keys were shown) or **learned** (pressed correctly without seeing the keys).

```
pick next ──► unseen? ──yes──► TRAINING: keys visible
                │                 correct → trained, next after 1 s
                │                 wrong   → shake (0.5 s), try again
                no (trained or learned)
                ▼
             TEST: keys hidden
                correct on first try → learned, card review "good"/"hard"
                wrong → shake, show your keys vs the right keys (testFailed)
                        correct afterwards → back to trained, card review "again"
```

The picker is weighted random by bucket: **unseen 90, trained 50, learned 10** (`helpers.weightedRandom`), then a random shortcut within the chosen bucket. Empty buckets are dropped, and the current shortcut is excluded if its bucket has other options. Skip adds the shortcut to `skippedIds` for this session.

**Reviews during learning:** the first test of each shortcut in a session calls `Reviews.review()`, graded by `failed` and the time since it was shown. Later tests in the same session don't count.

### 8.3 Timings and UI

1 s pause after success (input ignored), 0.5 s shake after a failure, and a 3 s "N mastered" toast in `SetProgress`. `ReviewRoute` duplicates the same logic, with the same timers and `testFailed` handling.

---

## 9. Review mode (`services/Reviews.js`, `services/FSRS.js`, `components/ReviewRoute`)

- **Cards:** one per `(appId, shortcutId, locale)`. A card is created on the **first successful** test; failing before that doesn't create one.
- **Grading:** failed → `again`; otherwise more than 6 s → `hard`, else `good`. `easy` is never used.
- **FSRS-5** (`FSRS.js`, hand-written, default weights, 90 % retention, maximum interval 365 days):
  - new card: initial stability and difficulty from the grade
  - reviewed again within a day: short-term stability formula
  - `again`: forget formula, and the card is due **tomorrow** regardless of stability
  - otherwise: recall formula → interval → `dueAt`
- **Due:** `dueAt` is before the end of **today** (local time), so a morning session also covers the evening.
- **Review session:** the due queue is sorted by `dueAt`. A failed card goes back to the end of the queue until it's recalled on the first try (one grade per attempt). Skip counts as done without grading. When the queue is empty, the app returns to the sets list.
- **Startup maintenance** (`CleanUp.run`):
  - `cleanUpRuns`: drops runs whose app or set no longer exists. For the **current** layout only, it also drops learned IDs that no longer exist and resets `finishedAt` if the set is no longer complete.
  - `Reviews.cleanUp`: drops current-layout cards whose shortcut no longer exists (or is now impossible).
  - `importLearnedShortcuts`: creates a `good` card for every learned ID without a card, dated to the run's `createdAt`. This migrated data from before spaced repetition existed, and it runs on every start.

---

## 10. Lookup popover (`main/services/MenuBar.js`, `components/ShortcutsRoute`)

```
trigger/tray click ─► menubar 'show'
   │
   ├─ ActiveApp.getName()   osascript JXA: NSWorkspace.frontmostApplication.localizedName;
   │                        if that is Mouseless/Electron → topmost layer-0 window owner
   ├─ send activeWindow:loading
   ├─ no name              → response { app: 'Mouseless' }            (placeholder)
   ├─ no AX permission     → response { app, needsAccessibility: true }
   └─ windowShortcuts(app) → response { app, shortcuts: [{ title, keys, group }] }
                             (binary, 10 s timeout, last JSON line of stdout)

menubar 'hide'       → send activeWindow:hide (renderer resets search + shows loader)
menubar 'after-hide' → app.hide() to give focus back, unless the main window is visible
```

In the renderer:

- **Built-in app?** Matched by `app.title === activeWindow.app`, the **localized** app name. This is why the Notes file is titled "Notizen". If it matches, the popover shows the built-in sets and ignores the menu shortcuts.
- Otherwise it resolves the menu shortcuts through the same keyboard pipeline, drops impossible ones, and groups them by `group` (the menu name).
- Search uses `fuse.js` (threshold 0.3 on `title`), applied per set. The search input keeps focus by refocusing on blur, and Escape sends `hide`.
- "Maximize" sends `showMainWindow`. Preferences requested while the popover is active also open the main window.
- Tray right click (or ctrl-click) opens a context menu: About, Preferences, Quit.

---

## 11. Trigger (global shortcut vs. hold ⌘)

- `shortcut === ['Meta']` → `LongPress.enable(toggle)`, otherwise `globalShortcut.register('Command+Shift+M', toggle)` (`Meta` → `Command`).
- **LongPress:** uiohook listens to every key and mouse event. Pressing ⌘ (left or right) alone starts a 1 s timer. Any other key, ⌘ together with Shift/Alt/Ctrl, releasing ⌘, or a mouse click (⌘-click) cancels it. It starts only once Accessibility access is granted, polling every 3 s, because otherwise uiohook shows its own system prompt.
- **Recorder** (`OptionsOverlay`): uses a `Keyboard` instance and accepts only shortcuts with ⌘, ⌃ or ⌥ that aren't reserved (⌘Q, ⌘W, ⌘H, ⌘M, ⌘,, ⌘Tab, ⌘Space). This reserved list is separate from `Keyboard.blockedShortcuts`. A "Hold ⌘" button switches back to the long press.
- After a change, `shortcutChanged` re-registers the trigger. `Keyboard.blockedShortcuts` still contains the old shortcut until the window reloads.

---

## 12. App behaviour

- **Windows:** main window 600×480, not resizable, `hiddenInset` title bar (traffic lights over the content, `Page` adds spacing), black background. Closing it destroys it; `activate` (dock click) and `showMainWindow` recreate it.
- The app stays alive with no windows and quits with ⌘Q.
- **Dock icon:** hidden at startup only, so toggling it requires a restart ("Restart App" button). The menu bar toggle works the same way.
- **Autostart:** login item in packaged builds only, updated whenever `autoStart` changes.
- **App menu:** standard roles, plus Preferences (⌘,), which broadcasts `showOptions` to all windows and shows them, and "Show Developer Tools".
- **Layout change:** all windows reload.

---

## 13. UI layer

- **Routes** (hash history): `/` apps, `/app/:appId/sets`, `/app/:appId/sets/:setId`, `/app/:appId/sets/:setId/learn`, `/app/:appId/review`, `/shortcuts` popover, and a catch-all that shows the apps list.
- **Transitions:** `Wrapper` slides right when going to `apps` and left otherwise. Inside `AppRoute`, a depth table (`sets 0, set 1, review 1, test 2`) picks the direction. The popover has no transition.
- **Keyboard navigation:** `spatial-navigation-js` on `[data-focusable]`. `Set` listens to `sn:willmove`: left goes back, right opens the set. `SetRoute` focuses "Start" (Enter starts) and handles Escape/← to go back.
- **Components:** Options API, one folder per component (`index.vue` + `style.scss`, often scoped). Main ones: `Page` (title bar, back slot, options button), `Btn`, `Icon`, `Key` (large animated key cap with success/fail badge), `SmallKey`, `CircleProgress`, `TextProgress`, `SetProgress`, `ListSection`, `AppsList`/`AppsItem`, `Sets`/`Set`.
- **Globals:** `this.$db` (DB) and `this.$key` (keyLabel), plus an `Event` bus for `showOptions`/`hideOptions`.
- **Styles:** SCSS with `variables.scss` injected everywhere (colors: white `#F2F2F2`, black `#121212`, dark grey `#1F1F1F`, green, yellow, red; easing curves), Inter and Fira Code fonts, and `animations.scss` (slide, pop-up, shake, options).

---

## 14. Dev tooling

- `HealthCheck` (dev only, console tables): duplicate IDs in a set, impossible shortcuts, more than one non-modifier key, and misspelled key codes (multi-character names that aren't known codes).
- `VITE_DEBUG=true` shows only apps with `debug: true`.
- The keymap is printed as a table in dev.
- There are no tests and no types.

---

## 15. Weak spots → rewrite decisions

| Weak spot                                                                                       | Where                                                           | Direction for the rewrite                                                                                                           |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Domain logic inside components; Test and Review duplicate the same state machine                | `TestRoute`, `ReviewRoute`                                      | One pure `practice` state machine (show → answer → success/fail) used by learn and review; components only render it and run timers |
| Global singletons, module-level keymap, sync IPC in getters                                     | `DB`, `Keyboard`, `Reviews`, `Store`                            | Pure functions that take the keymap and progress as arguments; async platform layer; Pinia stores loaded once                       |
| Not reactive, correct only because routes remount                                               | models                                                          | Derived state as `computed` over Pinia state                                                                                        |
| No types, no tests                                                                              | everywhere                                                      | Strict TS, Vitest for the domain, fixture keymaps (German/US)                                                                       |
| App matched by localized name                                                                   | `ShortcutsRoute`                                                | Match by bundle ID                                                                                                                  |
| `['Meta']` as a special value                                                                   | `Store`, `MenuBar`, `OptionsOverlay`                            | `{ kind: 'hold', key: 'Meta' } \| { kind: 'shortcut', keys }`                                                                       |
| Two separate lists of forbidden shortcuts, and the blocked list reads the current shortcut once | `Keyboard.blockedShortcuts`, `OptionsOverlay.isAllowedShortcut` | One `shortcutPolicy` module, parameterized by the current trigger                                                                   |
| Reset Progress leaves cards                                                                     | `OptionsOverlay`                                                | Reset clears runs, cards and the review log                                                                                         |
| Dock and menu bar toggles need a restart                                                        | `index.js`, `MenuBar`                                           | Apply live (activation policy, tray show/hide)                                                                                      |
| Untyped string IPC channels                                                                     | preload                                                         | `tauri-specta` generated commands and events                                                                                        |
| Reads another app's menus through a prebuilt arm64 binary                                       | `WindowShortcuts`                                               | Native AX calls in Rust                                                                                                             |
| `collect.js`, `Emitter`, `Event` bus                                                            | many                                                            | Plain arrays; Vue/Pinia reactivity; Tauri events                                                                                    |

## 16. Invariants to keep

1. The `shortcutId` semantics (§7.2): derived from the definition keys, so it's the same on every layout, kept on renaming and new when the keys change. Not the hash itself: the rewrite doesn't carry over the old progress.
2. Progress is stored separately per keyboard layout.
3. Resolution semantics: lookup order value → Shift → AltGr → Shift + AltGr, ⌃⌥⇧⌘ sorting, the shortest alternative wins, and the ISO swap.
4. Learning rules: training vs test, only the first test per session counts for reviews, bucket weights 90/50/10, and a run finishes only without skips.
5. Review rules: a card is created on the first success, due until the end of the day, `again` → tomorrow and requeued in the session, and the 6 s `hard` threshold.
6. Lookup: built-in sets take priority, Mouseless itself is never the looked-up app, and focus returns to the previous app on hide.

## 17. Open decisions (made step by step during the rewrite)

- UI language: the data is translatable from step 2 (message keys, per-app catalogs, German as the fallback). Which language the UI starts in and the vue-i18n setup are decided in step 5.
- FSRS: keep the hand-written FSRS-5 or switch to `ts-fsrs`.
- Whether runs remember skipped shortcuts across sessions (they don't today).
- Where progress lives: SQLite in Rust (per REWRITE.md) or a JSON store to begin with.
- What progress is keyed by per layout: the old `localizedName` depends on the system language ("Deutsch" or "German"), so switching it orphans progress. The macOS input source ID (`com.apple.keylayout.German`) is stable. Decided in step 4 or 6.
- `reconcileProgress` (step 3) no longer needs `importLearnedShortcuts`, which only migrated data from before spaced repetition. Pruning progress of removed shortcuts stays.
