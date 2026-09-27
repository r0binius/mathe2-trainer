# Roadmap

The rewrite is built in small steps. Claude writes the code; you decide and review.

## How a step works

1. **Decide:** go through the step's open decisions. Claude recommends an option; you decide.
2. **Build:** on a branch named per [Conventional Branch](https://conventionalbranch.org), e.g. `feature/keyboard-domain`. Claude writes the code, domain code test first, one sub-step at a time.
3. **Review:** after each sub-step, Claude walks you through the diff. Feedback is applied before committing.
4. **Check:** `pnpm check` passes.
5. **Commit and merge:** one Conventional Commit per sub-step, after your review, with its box ticked in the sub-step list. The step's last commit ends with `Closes #N` (the step's issue), so the fast-forward into `main` closes it once pushed.
6. **Log:** add a short _What we learned_ section to the step below.

Status: ✅ done · 🚧 in progress · ⏳ planned

---

## 1. Foundation ✅ ([#1](https://codeberg.org/gobin/mouseless/issues/1))

Tooling, strict configuration, docs and git conventions.

**What we learned**

- **Strictness pays off immediately.** `exactOptionalPropertyTypes` caught `hmr: undefined` in the scaffold's Vite config: leaving a property out and setting it to `undefined` are different things.
- **Functional rules need zones.** A pure core can ban every side effect, but the shell (UI, IPC) exists to cause side effects. The lint config applies different rules to `src/domain` and the rest of `src`.
- **Supply-chain cooldowns.** pnpm 12 won't install releases younger than a day. Cargo has no such rule, so crates that belong together (the Tauri family) have to be pinned by hand, in dependency order.
- **The toolchain decides "latest".** TypeScript 7 is released, but typescript-eslint and vue-tsc can't use it yet, so 6.0 is the newest version that works here.
- **Know which tool owns which file.** The Tauri CLI rewrites the `tauri` dependency in `Cargo.toml` to sync its `features`. Trimming it by hand only creates churn.
- **Git commits the index, not the working tree.** That makes it possible to commit a partial change while the working tree holds the final state, which is how commit 2 was made after the `pnpm exec` sync uninstalled commitlint mid-hook.
- **Environment:** tools need to be on the PATH of every shell. rustup's `~/.cargo/env` has to be sourced, typically from `~/.zshenv`.

## 2. Domain: keyboard and shortcuts ✅ ([#2](https://codeberg.org/gobin/mouseless/issues/2))

Branch `feature/keyboard-domain`. The pure core that turns shortcut definitions into keys for the current keyboard layout, with no Tauri, no Vue and no native code.

**Deliverables**

- `domain/shared/result.ts`: errors as values
- `domain/keyboard/`: the keymap type, key resolution (a chain: value → Shift → Alt → Shift+Alt → code), modifier ordering, `shortcutPolicy` (a chain of rules), key labels
- `domain/shortcuts/`: types, `defineApp`, a readable `shortcutId`
- `data/apps/<id>/`: the 10 apps ported and typed, each with its German catalog
- Tests: resolution against a German keymap fixture, policy rules, shortcut IDs, and a data health test over all apps

**Decisions**

- `Result`: our own type, tagged by `kind: 'ok' | 'err'`, rather than `neverthrow` or Effect. It starts with the constructors only; helpers come when a caller needs them.
- Collection helpers: native array methods, no `remeda`.
- No compatibility with the old app's user data: the shortcut data is ported, but progress and settings start fresh, so there's no importer and `shortcutId` doesn't have to reproduce the old SHA-256 IDs. It's a readable string derived from the app ID and the definition keys, with no hashing and no dependency: `vscodium/Meta+k|Meta+t`, with modifiers ordered ⌃⌥⇧⌘ and alternatives sorted. The set isn't part of it, so the same keys in two sets of one app share progress, as before.
- Shortcut definitions: `keys` is always a non-empty list of combinations (`[['Meta', 'f']]`), so there's one shape and no runtime check between `string[]` and `string[][]`. `defineApp` is a typed identity, like Vite's `defineConfig`, and rules that types can't express go in the data health test. `category` is a union of the categories in use, as language-neutral IDs (`'development'`). Dropped: the set `version` (saved, never read), the `debug` flag and test app (fixtures replace them) and the app `description` (never shown).
- Translatable text is written as message keys (`title: 'essentials.find'`), with a catalog per app and language next to its data (`data/apps/vscodium/de.json`). German is required and the fallback; other languages are optional and can be added gradually. Keys are plain strings in the domain, which doesn't import the data, and the data health test checks them against `de`, including unused keys. App titles are product names and aren't translated. vue-i18n comes with the UI in step 5.
- Porting the data: message keys are English camelCase names of what a shortcut does, grouped by set (`halves.topLeft`), and set IDs are camelCase too (`newitem` became `newItem`), and each catalog is nested JSON (`{ "halves": { "title": …, "topLeft": … } }`), vue-i18n's default shape. The 5 descriptions are sibling keys with a `Hint` suffix (`files.saveAsHint`), so every catalog entry stays a single string. Keys and German texts are ported verbatim, and a throwaway script checks each app 1:1 against the old file. Oddities go to the data health test (2.10) and are fixed there as separate changes. One app per commit.
- Shortcut policy (`domain/keyboard/policy.ts`): a rule returns a `Rejection` (`duplicate-key` naming the key, `modifier-only`, `reserved`) or `undefined`, and `checkShortcut` returns the first rejection as a `Result`. `practicePolicy(reserved)` is the chain for the practice filter and the data health test. The caller passes the platform's list plus the current trigger and rebuilds the policy when the trigger changes, so there's no separate trigger rule and no stale trigger. The recorder's rules (needs ⌘, ⌃ or ⌥; not an app-standard shortcut like ⌘Q) come with the recorder in step 7. `macosReserved` lists what macOS takes before the practice window sees it: the old list plus ⌥⌘Space, ⌃Space, ⌃⌥Space, ⇧⌘3 and ⌃⌘Q. It hides a few ported shortcuts, such as Bitwig's ⌥⌘Space and VSCodium's ⌃Space, which can't be practiced while macOS takes them.
- Key labels (`domain/keyboard/labels.ts`): `labelKey(labels, key)` returns `{ symbol, name? }`, where `labels` is a platform's table (`macosKeyLabels` now, a Linux table in step 10). The table replaces `keyboard-symbol` and the second labels of the old `Key` component. Names stay English, like the keycaps, and aren't translated. Any other key shows its character uppercased, unless the uppercase form is longer (`ß` → `SS`), which replaces the old hard-coded `ß` exception, and named keys keep their name (`F5`). New compared to the old app: `Home` ↖ and `End` ↘ as in macOS menus, and `Numpad0` as `0` with the name `Numpad`.
- Data health test (`src/data/apps/health.test.ts`): it finds the apps with `import.meta.glob`, so a new folder can't be forgotten (the app registry comes with the UI in step 5), and has one test per rule that lists every violation. Rules: app ID = folder name, unique set IDs, the same keys at most once per set (across sets they share a shortcut ID, as decided), known key names, characters the German layout types, and on the German fixture exactly one key besides the modifiers and no rejection by `practicePolicy([])` (reserved combinations are allowed in the data, practice hides them), in every alternative. Plus every message key in `de` and every `de` entry used. It found 4 shortcuts that can't be pressed on German (a US character that already needs the added modifier, such as ⇧⌘\` → ⇧⇧⌘´): macOS window cycling became ⌘< / ⇧⌘<, as in Terminal's German menu, and VSCodium's go to bracket, fold and unfold were dropped.
- `is-immutable-type` is patched (`patches/`): its shared cache made `functional/prefer-immutable-types` results depend on which files were linted together ([is-immutable-type#625](https://github.com/RebeccaStevens/is-immutable-type/issues/625)). The patch gives each check its own cache. Remove it once upstream ships a fix.
- Fixtures: one German keymap in our own `Keymap` shape (`germanKeymap.fixture.json`), which is exactly what the domain receives in the app. It was dumped from the old app's `native-keymap` and cleaned up: the ISO swap is applied, keys that type no character are left out, and `native-keymap` artifacts (`AudioVolumeUp`, the JIS keys) are removed. **No US keymap:** only German is in use, so add a fixture when someone uses another layout.

**Sub-steps**

- [x] 2.1 `Result` type
- [x] 2.2 Fixture: the German keymap
- [x] 2.3 Keymap type
- [x] 2.4 Key resolution chain and modifier ordering
- [x] 2.5 `shortcutId`
- [x] 2.6 Shortcut types and `defineApp`
- [x] 2.7 `shortcutPolicy`
- [x] 2.8 Key labels
- [x] 2.9 Port the 10 apps
- [x] 2.10 Data health test

**Concepts**

- Pure functions, immutability, readonly types
- Discriminated unions and narrowing: making illegal states unrepresentable
- Errors as values (railway-oriented programming), parse, don't validate
- Chain of Responsibility as an array of functions
- Test-driven development and fixture-based tests

**Resources**

- [TypeScript: Narrowing and discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Making illegal states unrepresentable](https://fsharpforfunandprofit.com/posts/designing-with-types-making-illegal-states-unrepresentable/)
- [Railway oriented programming](https://fsharpforfunandprofit.com/rop/)
- [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
- [Functional core, imperative shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell) (screencast)
- [Professor Frisby's Mostly Adequate Guide to FP](https://mostly-adequate.gitbook.io/mostly-adequate-guide/), chapters 1–4
- [Test-driven development](https://martinfowler.com/bliki/TestDrivenDevelopment.html) · [Vitest guide](https://vitest.dev/guide/)
- [`KeyboardEvent.code`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)
- [legacy-architecture.md](legacy-architecture.md) §6–7

**What we learned**

- **Characters aren't keys.** Shortcut data written with US characters (`` ` ``, `\`, `[`) can need a modifier on German that the shortcut already adds, which makes it impossible to press. A test only catches the impossible cases; a shortcut that resolves but isn't what the app binds (VSCodium's ⌘\\ becoming ⇧⌥⌘7) can only be read from the app itself on the target layout, ideally from its menu bar.
- **Types for the shape, tests for the rules.** `defineApp` is a typed identity: the compiler checks the shape of ~600 shortcuts, and everything types can't express (unique IDs, known keys, catalog coverage) lives in one data health test.
- **Report every violation at once.** Collecting all hits of a rule and comparing with `[]` shows the whole problem list in one run, instead of stopping at the first bad shortcut.
- **A rule that is green on real data proves little.** Nine of the ten rules passed at once, so breaking the data on purpose, once per rule, showed that each one actually fails when it should.
- **A throwaway check makes a large port reviewable.** A script comparing each ported app 1:1 with the old file let the review focus on naming and oddities instead of retyped keys.
- **Plain objects inherit keys.** A lookup table indexed by user data finds `constructor` unless it's checked with `Object.hasOwn`.
- **Tool caches can leak between files.** A shared cache in `is-immutable-type` made lint results depend on which files were linted together; a small patch fixed it until upstream does.

## 3. Domain: practice and scheduling 🚧 ([#3](https://codeberg.org/gobin/mouseless/issues/3))

Branch `feature/practice-session`. The practice flow shared by learn and review, as a state machine, plus FSRS scheduling.

**Deliverables:** the practice session (State + Command as an Elm-style update), the next-item strategies (weighted buckets for learn, due queue for review), grading, the `Scheduler` port with FSRS, run snapshots (Memento), and `reconcileProgress`.

**Decisions**

- FSRS: `ts-fsrs` 5.x (FSRS-6, by the algorithm's authors, no dependencies) behind the `Scheduler` port, instead of porting the hand-written FSRS-5. The adapter turns off its short-term learning steps and keeps our rules: `again` is due tomorrow, and a card is due until the end of its day. Upgrade to 6.0 once it's stable.
- Skipped shortcuts last for the session only, as before: a skip means "not now", and a run with skips stays unfinished, so they come back next session.
- Matching: a plain exhaustive `switch`, no `ts-pattern`.
- Randomness and time are carried by messages: the shell puts `Math.random()` and `Date.now()` values into them (`advance { roll }`, `answer { keys, at }`), so the update stays pure and tests pass fixed numbers. No seeded random number generator.
- [The Elm Architecture](https://guide.elm-lang.org/architecture/) (`architecture.md` §1.1): the session is a model with messages and `updateSession(session, msg) → { model, effects }`, in Elm's vocabulary (Model, Msg, update) but with `Effect` instead of `Cmd`, since GoF's Command is the message. Effects are data the shell carries out: results to save, and timers such as the 1 s pause after a success (`advanceAfter`), which makes that timing a tested domain rule. The shell's runtime (`useProgram`) comes in step 5. One model per concern, not one for the app.
- Grading uses only what was measured, never the user's own estimate: a mistake → again, over 6 s → hard, a fast first try → easy, otherwise good (the old app never used easy). Using the whole scale lets fluent shortcuts space out faster. Every review is logged from step 4 on, so FSRS's weights can later be fitted to the user's own data.

**Sub-steps**

- [x] 3.1 Practice session update (State + Command, Elm style)
- [x] 3.2 Next-item strategies: weighted buckets for learn, due queue for review
- [ ] 3.3 Grading
- [ ] 3.4 `Scheduler` port and FSRS
- [ ] 3.5 Run snapshots (Memento)
- [ ] 3.6 `reconcileProgress`

**Concepts:** state machines and reducers, The Elm Architecture (model, update, effects as data), injecting randomness and time for determinism (values carried in messages), property-style tests, spaced repetition.

**Resources:** [statecharts.dev](https://statecharts.dev/) · [The Elm guide](https://guide.elm-lang.org/), especially [The Elm Architecture](https://guide.elm-lang.org/architecture/) and [Commands and Subscriptions](https://guide.elm-lang.org/effects/) · [refactoring.guru: State, Command, Strategy, Memento](https://refactoring.guru/design-patterns/catalog) · [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm) · [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) · [legacy-architecture.md](legacy-architecture.md) §8–9

## 4. Persistence and IPC ⏳ ([#4](https://codeberg.org/gobin/mouseless/issues/4))

Branch `feature/persistence`. Settings and progress stored by Rust and reached through a typed platform facade.

**Deliverables:** the Rust `AppError`, a settings store, a SQLite progress repository with migrations, typed commands and events (`tauri-specta` if it's stable), the `platform/` facade, and Pinia stores.

**Decisions:** SQLite or JSON for progress; whether `tauri-specta` is ready; the settings schema (`trigger` as a union); how data from IPC and disk is decoded into domain types (hand-written decoders or a schema library); the review log's shape (every review with its measurements and grade, so FSRS can later be fitted to it).

**Sub-steps**

- [ ] 4.1 Rust `AppError`
- [ ] 4.2 Settings store
- [ ] 4.3 SQLite progress repository and migrations
- [ ] 4.4 Typed commands and events
- [ ] 4.5 `platform/` facade
- [ ] 4.6 Pinia stores

**Concepts:** Rust ownership and borrowing, `Result` and `?`, traits, `thiserror`; the Tauri process model, commands, state management and capabilities; Pinia setup stores; ports and adapters.

**Resources:** [Rust book: Ownership](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html), [Error handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html), [Traits](https://doc.rust-lang.org/book/ch10-02-traits.html) · [Rust by Example](https://doc.rust-lang.org/rust-by-example/) · [thiserror](https://docs.rs/thiserror/latest/thiserror/) · [rusqlite](https://docs.rs/rusqlite/latest/rusqlite/) · [Tauri process model](https://tauri.app/concept/process-model/), [IPC](https://tauri.app/concept/inter-process-communication/), [Calling Rust](https://tauri.app/develop/calling-rust/), [State management](https://tauri.app/develop/state-management/), [Capabilities](https://tauri.app/security/capabilities/) · [tauri-specta](https://github.com/specta-rs/tauri-specta) · [Pinia](https://pinia.vuejs.org/core-concepts/)

## 5. Main window UI ⏳ ([#5](https://codeberg.org/gobin/mouseless/issues/5))

Branch `feature/main-window`. The library, sets, set detail, learn, review and options screens, with transitions and keyboard navigation.

**Deliverables:** presentational components (`KeyCap`, `BaseButton`, `CircleProgress`, …), feature routes, composables (`useProgram`, the Elm runtime; `useKeyCapture`, `usePracticeSession`, `useSpatialNav`), styles ported from the old app.

**Decisions:** spatial navigation (library or our own composable); design tokens as CSS custom properties; vue-i18n setup and the UI's language (the data is translatable from step 2); app titles the vendor translates itself (Apple's Notes is `Notizen` on a German Mac, hard-coded in the data for now).

**Sub-steps**

- [ ] 5.1 Styles and design tokens
- [ ] 5.2 Presentational components
- [ ] 5.3 Router, library and set screens
- [ ] 5.4 Learn and review screens (`useKeyCapture`, `usePracticeSession`)
- [ ] 5.5 Options screen
- [ ] 5.6 Spatial navigation and transitions

**Concepts:** Vue reactivity (`ref`, `computed`, `watch`), composables and effect cleanup, presentational vs. container components, typed props and emits, the router.

**Resources:** [Vue: Reactivity in depth](https://vuejs.org/guide/extras/reactivity-in-depth.html) · [Composables](https://vuejs.org/guide/reusability/composables.html) · [TypeScript with the Composition API](https://vuejs.org/guide/typescript/composition-api.html)

## 6. Native keyboard layout ⏳ ([#6](https://codeberg.org/gobin/mouseless/issues/6))

Branch `feature/native-keymap`. Read the current keyboard layout in Rust, replacing `native-keymap`.

**Deliverables:** the `KeymapSource` trait, a macOS implementation (`TISCopyCurrentKeyboardLayoutInputSource` + `UCKeyTranslate`) that reports `Backquote` and `IntlBackslash` correctly on ISO keyboards (`native-keymap` swapped them), layout-change events, and output that matches the step 2 fixture.

**Sub-steps**

- [ ] 6.1 `KeymapSource` trait
- [ ] 6.2 macOS FFI: `TISCopyCurrentKeyboardLayoutInputSource` + `UCKeyTranslate`
- [ ] 6.3 Safe translation into our keymap type and fixture comparison tests
- [ ] 6.4 Layout-change events

**Concepts:** FFI and `unsafe`, `objc2`, Core Foundation memory rules, traits as ports (Bridge pattern).

**Resources:** [The Rustonomicon](https://doc.rust-lang.org/nomicon/) · [objc2](https://docs.rs/objc2/latest/objc2/) · [UCKeyTranslate](https://developer.apple.com/documentation/coreservices/1390584-uckeytranslate)

## 7. Menu bar popover and trigger ⏳ ([#7](https://codeberg.org/gobin/mouseless/issues/7))

Branch `feature/popover`. Tray icon, popover window, hold ⌘ and global shortcut, window coordination, dock icon, autostart, single instance, and a strict CSP.

**Sub-steps**

- [ ] 7.1 Tray icon and popover window
- [ ] 7.2 `WindowCoordinator` (Mediator)
- [ ] 7.3 Trigger: hold ⌘ event tap and global shortcut
- [ ] 7.4 Dock icon, autostart, single instance
- [ ] 7.5 Strict CSP, verified in the running app

**Concepts:** the Mediator pattern, macOS activation policy and focus handling, event taps, the Content Security Policy.

**Resources:** [Tauri system tray](https://tauri.app/learn/system-tray/) · [Tauri CSP](https://tauri.app/security/csp/) · [NSWorkspace.frontmostApplication](https://developer.apple.com/documentation/appkit/nsworkspace/frontmostapplication)

## 8. Menu shortcut lookup ⏳ ([#8](https://codeberg.org/gobin/mouseless/issues/8))

Branch `feature/menu-lookup`. Read any app's menu shortcuts through the Accessibility API, and show them with search in the popover.

**Sub-steps**

- [ ] 8.1 AX FFI and the permission flow
- [ ] 8.2 Recursive menu walk and mapping into shortcut data
- [ ] 8.3 Lookup UI with search

**Concepts:** the Accessibility API and permissions, recursion over trees, matching apps by bundle ID.

**Resources:** [AXUIElement](https://developer.apple.com/documentation/applicationservices/axuielement_h)

## 9. Packaging ⏳ ([#9](https://codeberg.org/gobin/mouseless/issues/9))

Branch `chore/packaging`. Build and sign the app. There's no importer: progress and settings start fresh.

**Sub-steps**

- [ ] 9.1 Bundle config and signing

## 10. Linux ⏳ ([#10](https://codeberg.org/gobin/mouseless/issues/10))

Platform implementations for X11/Wayland, a UI driven by capabilities, and Linux key labels. Planned in detail once macOS is complete.
