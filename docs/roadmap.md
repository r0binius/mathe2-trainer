# Roadmap

The rewrite is built in small steps. Claude writes the code; you decide and review.

## How a step works

1. **Decide:** go through the step's open decisions. Claude recommends an option; you decide.
2. **Build:** on a branch named per [Conventional Branch](https://conventionalbranch.org), e.g. `feature/keyboard-domain`. Claude writes the code, domain code test first, one sub-step at a time.
3. **Review:** after each sub-step, Claude walks you through the diff. Feedback is applied before committing.
4. **Check:** `pnpm check` passes.
5. **Commit:** one Conventional Commit per sub-step, after your review, with its box ticked in the sub-step list.
6. **Refactor:** once the sub-steps are done, a cleanup round over the whole app, not only the step's code, reviewed and committed like a sub-step. What counts, in order: idiomatic Vue and Rust; as much functional programming and The Elm Architecture as possible; clean code; each language's documentation standard (TSDoc, rustdoc). Design patterns are guidelines, not goals.
7. **Diagram:** bring [`uml.drawio`](uml.drawio) up to date with what the step changed (components, classes, states, sequences), in the step's last commit, so the diagram always matches `main`.
8. **Merge:** the step's last commit ends with `Closes #N` (the step's issue), so the fast-forward into `main` closes it once pushed.
9. **Log:** add a short _What we learned_ section to the step below.

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
- Shortcut definitions: `keys` is always a non-empty list of combinations (`[['Meta', 'f']]`), so there's one shape and no runtime check between `string[]` and `string[][]`. `defineApp` is a typed identity, like Vite's `defineConfig` (replaced by `satisfies AppDefinition` in the refactoring during step 4), and rules that types can't express go in the data health test. `category` is a union of the categories in use, as language-neutral IDs (`'development'`). Dropped: the set `version` (saved, never read), the `debug` flag and test app (fixtures replace them) and the app `description` (never shown).
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

## 3. Domain: practice and scheduling ✅ ([#3](https://codeberg.org/gobin/mouseless/issues/3))

Branch `feature/practice-session`. The practice flow shared by learn and review, as a state machine, plus FSRS scheduling.

**Deliverables:** the practice session (State + Command as an Elm-style update), the next-item strategies (weighted buckets for learn, due queue for review), grading, the `Scheduler` port with FSRS, run snapshots (Memento), and `reconcileProgress`.

**Decisions**

- FSRS: `ts-fsrs` 5.x (FSRS-6, by the algorithm's authors, no dependencies) behind the `Scheduler` port, instead of porting the hand-written FSRS-5. The adapter turns off its short-term learning steps and keeps our rules: `again` is due tomorrow, and a card is due until the end of its day. Upgrade to 6.0 once it's stable.
- Skipped shortcuts last for the session only, as before: a skip means "not now", and a run with skips stays unfinished, so they come back next session.
- Matching: a plain exhaustive `switch`, no `ts-pattern`.
- Randomness and time are carried by messages: the shell puts `Math.random()` and `Date.now()` values into them (`advance { roll }`, `answer { keys, at }`), so the update stays pure and tests pass fixed numbers. No seeded random number generator.
- [The Elm Architecture](https://guide.elm-lang.org/architecture/) (`architecture.md` §1.1): the session is a model with messages and `updateSession(session, msg) → { model, effects }`, in Elm's vocabulary (Model, Msg, update) but with `Effect` instead of `Cmd`, since GoF's Command is the message. Effects are data the shell carries out: results to save, and timers such as the 1 s pause after a success (`advanceAfter`), which makes that timing a tested domain rule. The shell's runtime (`useProgram`) comes in step 5. One model per concern, not one for the app.
- Grading uses only what was measured, never the user's own estimate: a mistake → again, over 6 s → hard, under 2 s → easy, otherwise good (the old app never used easy). The 2 s limit is fixed for now and gets revisited with real data; a limit relative to the user's own speed needs the review log. `gradeRecall` is a plain function, not an injected strategy, while there's only one grading. Using the whole scale lets fluent shortcuts space out faster. Every review is logged from step 4 on, so FSRS's weights can later be fitted to the user's own data.
- Scheduling: the `Scheduler` port is a function, `(memory, grade, time) → memory`, and `scheduleWithFsrs` in `domain/scheduling/fsrs.ts` adapts `ts-fsrs` to it. It's deterministic computation, not I/O, so it counts as core, and a lint rule keeps `ts-fsrs` out of every other file. Our rules stay outside the port (`reviewCard`, `dueCards`): a card is created on the first success, `again` is due tomorrow, and a card is due until the local end of today, which the shell computes and passes in. Settings: 90 % retention, at most 365 days between reviews (as before), fuzz on so cards learned together spread out (seeded by `ts-fsrs` from the card and review time, so still deterministic), and short-term steps off. Without them, a second review on the same day barely changes a card, where the old FSRS-5 code used a separate short-term formula. Times in the domain are epoch milliseconds; the storage format is decided in step 4. `Grade` moved to `scheduling`, since it's FSRS's scale. `ts-fsrs` throws on invalid input, so the port only takes valid memory: `CardMemory` is a branded type that only `parseCardMemory` (a `Result`: finite values, stability 0.001–36500, difficulty 1–10, consistent counts and dates) and a scheduler create, and step 4's decoders reuse the parser. A review timed before the last one (a clock set back) counts as made at the last one instead of failing, and a test over a grid of inputs checks that the adapter's output always parses.
- Run snapshots (Memento): a `LearnSnapshot` holds the shortcut IDs the session covered, the learned ones and whether the set is complete (everything the session covered is learned). Saving replaces only the covered shortcuts' progress, so learned shortcuts that can't be pressed on this layout today are kept (both fixed in the review after step 3). The learn strategy emits it as `learnedChanged` only when the learned shortcuts change. Instead of the old app's list of runs, the app keeps one `SetProgress` per set and layout (`{ learned, completedAt?, updatedAt }`): the screens only ever needed the latest progress and whether the set was completed. `learnPool` starts over when every shortcut is already learned, as a new run did before, and `completedAt` survives that, so the set still shows as done. Skipping is a flag on the entry, not a stage, so skipping a learned shortcut keeps it learned (the 3.2 pool lost it).
- `reconcileProgress` deletes only what's gone from the data, on every layout: the progress of removed sets, learned IDs no longer in their set, and cards of shortcuts no longer in any set. Shortcuts that are only impossible on the current layout (unpressable, or reserved) keep their progress, since practice leaves them out and they can become possible again, for example when the trigger changes; the old app deleted them. The review log is history and stays, so FSRS can be fitted to every review. Unchanged records keep their identity, so the shell can write only what changed.

**Sub-steps**

- [x] 3.1 Practice session update (State + Command, Elm style)
- [x] 3.2 Next-item strategies: weighted buckets for learn, due queue for review
- [x] 3.3 Grading
- [x] 3.4 `Scheduler` port and FSRS
- [x] 3.5 Run snapshots (Memento)
- [x] 3.6 `reconcileProgress`

**Concepts:** state machines and reducers, The Elm Architecture (model, update, effects as data), injecting randomness and time for determinism (values carried in messages), property-style tests, spaced repetition.

**Resources:** [statecharts.dev](https://statecharts.dev/) · [The Elm guide](https://guide.elm-lang.org/), especially [The Elm Architecture](https://guide.elm-lang.org/architecture/) and [Commands and Subscriptions](https://guide.elm-lang.org/effects/) · [refactoring.guru: State, Command, Strategy, Memento](https://refactoring.guru/design-patterns/catalog) · [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm) · [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) · [legacy-architecture.md](legacy-architecture.md) §8–9

**What we learned**

- **Effects as data move rules into the core.** Once waiting is an effect, the old 1 s pause became a tested constant instead of a `setTimeout` in a component, and the session stayed small: it passes on what the strategies report.
- **A library behind a port still has failure modes to read.** `ts-fsrs` throws on inputs our types allowed, including a real one (a clock set back gives negative elapsed time). A branded type that only a parser creates rules them out at compile time, a test over a grid of inputs shows the adapter's output always parses, and breaking the fix on purpose showed the tests catch it.
- **One random number can make a two-stage choice.** Where a roll falls inside the chosen bucket's share is again evenly distributed, so it picks the item too, with the exact old odds.
- **Designing the next piece tests the last one.** Writing the snapshot showed that skipping as a stage would forget a learned shortcut, a bug no test of 3.2 looked for.
- **Store what the screens read.** The old list of runs existed to answer two questions, the latest progress and whether a set was completed, so one record per set answers them directly.
- **Legacy behaviour is a reference, not a spec.** Reading the old code closely surfaced a just-trained shortcut being tested right away, and progress deleted for shortcuts that were only reserved; both were changed on purpose and pinned by tests.
- **Flat config replaces rule options, it doesn't merge them.** An exception for one file has to repeat the zone's other restrictions.

## Review after step 3 ✅ ([#11](https://codeberg.org/gobin/mouseless/issues/11))

Branch `fix/review-findings`. A review of the whole codebase before step 4 found two bugs and some risks for the next steps. They're fixed first, one reviewable diff each.

**Decisions**

- Keyboard layouts are identified by the macOS input source ID (`com.apple.keylayout.German`), which stays the same when the system language changes, unlike the old app's localized name. It's part of the domain types (`LayoutId` on cards and set records), so no caller can mix layouts by forgetting to filter.
- `keyOf(keymap, code)` names a physical key the same way for key resolution and key capture: its character for the main keys, and its code for `Space` and the numpad, which the data names by code. Without it, the space bar would be captured as `" "` and never match `Space`.
- The session numbers its presentations. `advanceAfter` carries that number and `advance` sends it back, so an `advance` from an old timer is ignored.
- FSRS counts days in local time: reviews carry the local UTC offset, and the adapter shifts the dates it hands to `ts-fsrs`, which counts UTC calendar days.
- A shortcut is practiced with the shortest alternative the practice policy allows (`practicableKeys`, replacing `resolveShortest`). The old app took the shortest and hid the shortcut if that one was reserved or unpressable, even when another alternative worked. `practiceItems`, `appPracticeItems` and `reviewItems` build what a session practices, and `PracticeItem` carries the shortcut's title and description keys for the UI.
- Only `*.test.ts` files may import `*.fixture.*` files (a lint rule).

**Sub-steps**

- [x] R.1 Learning progress: completion ignores skipped learned shortcuts, and saving keeps learned shortcuts the session didn't cover
- [x] R.2 Keyboard: one combination comparison, `keyOf`, and turning a key press into a combination
- [x] R.3 Layout in the domain types
- [x] R.4 Practice items and the review queue
- [x] R.5 Session and FSRS: the advance token and local days
- [x] R.6 Cleanup: fixture lint rule, brand comment, doc wording, merged branches

**What we learned**

- **Review the seams, not only the modules.** Every module was tested, yet both bugs lived between them: the snapshot's completion rule against `learnPool`'s restart, and saving a session against shortcuts it never saw. Writing a scenario across three modules exposed both in minutes.
- **Contracts between two directions need their own test.** Resolution and capture each looked right on their own, but named the space bar differently. One data health rule that feeds every shortcut through both now pins the contract, and it lists the 14 shortcuts that would have broken.
- **Break a fix on purpose.** Disabling each fix and watching its test fail (clock skew, the Space rule, local days) proved the tests guard what they claim.
- **Put invariants in the types.** The layout on every card and set record replaces a rule every caller would have had to remember.
- **Time has more than one clock.** A library's idea of a day (UTC) and the app's (local) must agree, and an `advance` has to say which success it ends, or an old timer acts on a new state.
- **Flat config replaces rule options per rule**, which also applies to `no-restricted-syntax`: one rule's selectors live in one place per zone.

## 4. Persistence and IPC ✅ ([#4](https://codeberg.org/gobin/mouseless/issues/4))

Branch `feature/persistence`. Settings and progress stored by Rust and reached through a typed platform facade.

**Deliverables:** the Rust `AppError`, a settings store, a SQLite progress repository with migrations, their commands, the `platform/` facade, and Pinia stores.

**Decisions**

- Storage: one SQLite database, `mouseless.db` in the app data directory (`mouseless-dev.db` in debug builds, so development never touches the progress of an installed build), owned by Rust through `rusqlite` (with bundled SQLite) and `rusqlite_migration`. The frontend reaches it only through our own commands, never through SQL, so `tauri-plugin-sql` isn't used: it would put the queries in TypeScript and give the webview raw database access. A JSON file, as in the old app, would be rewritten in full on every save and need hand-rolled migrations, while the review log only ever grows and saving a review writes a card and a log entry together, in one transaction.
- Settings live in the same database, in a `settings` table, not in `tauri-plugin-store`: one storage mechanism, one file, and no extra plugin, package or permission for four values. Rust reads them too (the trigger in step 7, the dock icon, autostart). The schema: `trigger: { kind: 'holdCommand' } | { kind: 'shortcut'; keys: KeyCombination }`, `showMenuBarIcon`, `showDockIcon` and `launchAtLogin`, by default hold ⌘ and all on, as before. The UI language is added in step 5. The table holds only the settings that differ from their defaults, one key/value row each with the value as JSON, so a new setting needs no migration and a changed default reaches everyone who never changed that setting. The defaults live in one place, `Settings::default()` in Rust, and a stored value that no longer fits its setting falls back to its default instead of spoiling the rest.
- Typed IPC: hand-written typed wrappers in `platform/`. `tauri-specta` is still a release candidate (`2.0.0-rc.25`, with `specta-typescript` at `0.0.12`), and since every response is decoded at the boundary anyway, generated types would add little. Revisit once it's stable.
- Decoding: hand-written decoders that return our `Result`, built on a few small helpers, with no schema library. There are only a few types (settings, set records, cards, review log entries), and the branded ones (`ShortcutId`, `LayoutId`, `CardMemory`) need our own parsers either way. `valibot` and `zod` would each bring their own issue model next to `Result`. They're built like Elm's `Json.Decode`: small decoders compose into larger ones (`object({ learned: array(decodeShortcutId), completedAt: optional(integer) })`), errors carry a path (`sets[3].progress.learned[0]`), and each type's decoder lives next to the type, in the domain, so it's pure and strictly linted. Loading progress skips a record or card that no longer decodes and reports it, instead of failing the rest: one damaged card shouldn't lock the user out.
- The review log gets one entry per `tested` effect, including a failed first test that creates no card: `shortcut_id`, `layout`, `reviewed_at`, `utc_offset_minutes`, `grade`, `failed` and `duration_ms`. That's what the FSRS optimizer needs (card, time, rating, duration), plus the measurements, so the grading limits can be fitted later too. The grade is stored as its word (`'good'`), which a `CHECK` constraint limits to the four grades, and mapped to FSRS's 1–4 only when exporting for the optimizer.
- Progress tables: `set_progress` (one row per set and layout, the learned IDs as a JSON array that a `CHECK` keeps an array, since the list is always read and written whole), `cards` (one per shortcut and layout) and the append-only `reviews`. Recording a review writes its log entry and its card in one transaction. Reconciling writes back by replacing all set records and cards in one transaction: the data is small, it only happens at startup when something changed, and there's no second wire format for changes. The review log stays.
- The `platform/` facade: the domain declares the ports (`SettingsRepository`, `ProgressRepository`, each a record of functions) and `StorageError` (`storage`, `database`, `ipc`, `invalidResponse`, plus a message for logs). `platform/ipc.ts` turns a command into a `Promise<Result<T, StorageError>>` that never rejects: it decodes the answer, passes on the command's `AppError`, and reports a failed call. The repositories take Tauri's `invoke` as an argument, so tests pass a fake one and need neither Tauri nor a DOM.
- Stores: Pinia 4 setup stores. They get their repositories through Vue's `provide`/`inject` with typed keys, and `platform/tauri.ts` is the one place that hands the real `invoke` to the repositories. Loaded data is a `Loadable` (`loading | loaded | failed`, like Elm's `RemoteData`), so the UI can't show data that isn't there. Writes are pessimistic: the domain computes the change, the repository saves it, and the store shows it only then, returning the `Result`. A change that needs the stored progress before it's loaded fails with `notLoaded` instead of overwriting what it hasn't seen. Loading progress reconciles it with the app data and writes it back only if something changed.
- Each sub-step brings its own commands (settings in 4.2, progress in 4.3), so nothing sits unused. Events move to step 7: the only one planned so far, `settings-changed`, matters once a second window exists.
- Times are stored as epoch milliseconds (`INTEGER`), as in the domain. The old app mixed two ISO formats.
- Reset clears set progress, cards and the review log in one transaction. The old app left the cards, so reviews kept showing up.
- Commands run off the main thread (`#[tauri::command(async)]`), and the connection sits behind a `Mutex` in Tauri's managed state, held only for one query or transaction. Migrations are `.sql` files in `src-tauri/migrations/`, compiled in with `include_str!`.
- Our own commands go through Tauri's permission system: `build.rs` declares them in an app manifest, Tauri generates an `allow-…` permission for each, and a window's capability grants the ones it uses. The popover in step 7 then gets only what it needs.

**Sub-steps**

- [x] 4.1 Rust `AppError`
- [x] 4.2 SQLite database, migrations and the settings table
- [x] 4.3 Progress repository and review log
- [x] 4.4 `platform/` facade
- [x] 4.5 Pinia stores

**Concepts:** Rust ownership and borrowing, `Result` and `?`, traits, `thiserror`; the Tauri process model, commands, state management and capabilities; Pinia setup stores; ports and adapters.

**Resources:** [Rust book: Ownership](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html), [Error handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html), [Traits](https://doc.rust-lang.org/book/ch10-02-traits.html) · [Rust by Example](https://doc.rust-lang.org/rust-by-example/) · [thiserror](https://docs.rs/thiserror/latest/thiserror/) · [rusqlite](https://docs.rs/rusqlite/latest/rusqlite/) · [Tauri process model](https://tauri.app/concept/process-model/), [IPC](https://tauri.app/concept/inter-process-communication/), [Calling Rust](https://tauri.app/develop/calling-rust/), [State management](https://tauri.app/develop/state-management/), [Capabilities](https://tauri.app/security/capabilities/) · [tauri-specta](https://github.com/specta-rs/tauri-specta) · [Pinia](https://pinia.vuejs.org/core-concepts/)

**What we learned**

- **Decode at the boundary, and generated types matter less.** Every answer from Rust goes through a decoder anyway, so `tauri-specta`'s generated types would have added a build step for little. Decoders written like Elm's `Json.Decode` read like the types they produce, and their errors say where (`cards[0].reps`).
- **Only the running app proves the wire.** Unit tests on both sides pinned the same JSON shapes, but only a round trip in `pnpm tauri dev` showed that the argument names, `null` for `Option<Card>` and the error shape really fit together.
- **Inject what talks to the outside.** Passing Tauri's `invoke` into the repositories, and the repositories into the stores via `provide`/`inject`, made every layer testable without Tauri or a DOM. The real `invoke` appears in one function.
- **Store only what differs from the defaults.** Settings as key/value rows of changed values keep the defaults in one place, need no migration for a new setting, and let a stored value that no longer fits fall back on its own.
- **Model loading and saving honestly.** `Loadable` (Elm's `RemoteData`) makes "not loaded yet" and "failed" states the UI has to handle, and saving before showing, plus `notLoaded`, means the UI never shows progress that isn't on disk, or overwrites progress it hasn't read.
- **The linters teach idiom.** `unused_async` led to `#[tauri::command(async)]`, `needless_pass_by_value` to one module-wide `expect` for Tauri's by-value arguments, a forbidden `throw` to `inject(key, fallback)`, and a forbidden rest parameter to inferring `oneOf` from a tuple. `expect` instead of `allow` removes itself once it's no longer needed.
- **Refactor with a rule of three, and recheck defaults.** A shared `firstViolation` for two call sites cost more than it saved and went again. `satisfies` replaced an identity function, and TypeScript 6 and `@vue/tsconfig` already set flags we repeated.
- **Review your own diff before handing it over.** Rereading `oneOf` found a tie that reported "one of no decoders" instead of the real error; a test pinned it first.

## 5. Main window UI 🚧 ([#5](https://codeberg.org/gobin/mouseless/issues/5))

Branch `feature/main-window`. The library, sets, set detail, learn, review and options screens, with transitions and keyboard navigation.

**Deliverables:** presentational components (`KeyCap`, `BaseButton`, `CircleProgress`, …), feature routes, composables (`useProgram`, the Elm runtime; `useKeyCapture`, `usePracticeSession`, `useSpatialNav`), styles ported from the old app.

**From the domain:** `practiceItems` / `appPracticeItems` / `reviewItems` build what a session practices, `combinationOf` turns a `KeyboardEvent`'s code and modifiers into an answer (named like resolved keys, see `keyOf`), `startSession` / `updateSession` run the session, and `reviewCard`, `recordLearning` and `reconcileProgress` update progress. The shell supplies what the domain can't compute purely: `Date.now()` and `Math.random()` in messages, the presentation number from `advanceAfter` back in `advance`, the local UTC offset with each review (`-new Date(at).getTimezoneOffset()`), the local end of today for `dueCards`, and the current `LayoutId`.

**Decisions**

- Styles: plain modern CSS, no Sass. Tokens are CSS custom properties (`styles/tokens.css`), components use scoped `<style>` with native nesting, and `color-mix()` replaces Sass's `rgba($color, 0.5)`. Once tokens are custom properties, Sass would only add BEM's `&__part`, which scoped styles make unnecessary. Only the tokens components use are ported: six colours, the window's black and two easing curves (the old `$ease` and `$easeInOut` are CSS's `ease` and `ease-in-out`). Modern CSS needs a recent WebKit, so step 9 sets `minimumSystemVersion`.
- Font: Source Sans 3 instead of Inter, from `@fontsource-variable/source-sans-3` (OFL): one variable file per subset covering all weights, bundled offline, and `unicode-range` loads only the subsets a text needs. The old app's Fira Code was never used and is dropped.
- Spatial navigation: our own `useSpatialNav`. A pure function picks the nearest element in the arrow's direction from rectangles, and a composable wires it to the DOM. `spatial-navigation-js` hasn't been released since 2022, is untyped and a global singleton.
- UI language: vue-i18n 11 in composition mode (its JIT compiler needs no `eval`, so it fits a strict CSP), with English and German UI text. It follows the system language from 5.3 on; 5.6 adds a `language: 'system' | 'en' | 'de'` setting (default `system`). UI text lives in `src/locales/{en,de}.json`, and the apps' catalogs, read from `data/apps.ts`, join the same instance as `apps.<id>.*`. Components translate through our own `useText()` rather than vue-i18n's `t`: its key type accepts any string, so vue-i18n's typed keys only add autocomplete, while `useText` types keys as the paths of `en.json` and makes a typo a type error. `satisfies` keeps the German text complete. Shortcut titles stay German until English catalogs are written, and app titles the vendor translates itself (Apple's Notes is `Notizen` on a German Mac) stay hard-coded in the data for now.
- Keymap until step 6: a `keymap` store reads through a `KeymapSource` port whose adapter returns the German fixture as `com.apple.keylayout.German`. Step 6 swaps only the adapter.
- No `parseTime`: the scheduler throws if a review's `at` isn't a finite number (noted in step 3.4), but the shell's `Date.now()` is the only source of message times and never produces one, so the guard would cover an input that can't occur.
- Tests in the shell: `useProgram`, the spatial navigation geometry and the composables. `happy-dom` only for the test files that need a DOM, added in the sub-step that first does; no `@vue/test-utils`, as presentational components are checked in the running app.
- Router: vue-router 5 with hash history, so the route survives a reload during development.
- Library: _recent_ apps and sets are those with something learned, as before, but ordered by when they were last practiced (`updatedAt`), newest first. A shortcut in two sets counts once for its app (the old app counted it twice), and an app's due count is what its review session would offer. Categories show in a fixed order (`appCategories`).
- Catalog: `data/apps.ts` lists the apps explicitly, so the list is type-checked and adding an app is one visible line. Each definition carries its texts (`catalogs: { de }`, imported from its `de.json`), so an app folder describes itself completely and there's no second list of catalogs to keep in step; the health test checks the list against the folders. Each app folder holds its `logo.svg`, which the screens find by folder name, so the domain types carry no asset URLs.
- A route to an app or set that doesn't exist (a hash route left over after the data changed) redirects to the library, so screens always get a real app and set. The old app crashed.

**Sub-steps**

- [x] 5.1 Styles and design tokens
- [x] 5.2 Presentational components
- [x] 5.3 Router, library and set screens
  - [x] 5.3.1 Keymap store, app list and progress summaries
  - [x] 5.3.2 vue-i18n with English and German UI text
  - [x] 5.3.3 Router, page layout and window chrome
  - [x] 5.3.4 Loading at startup, summary context and logos
  - [x] 5.3.5 Library, app and set screens
- [x] 5.4 Route transitions and fade-in
- [ ] 5.5 Learn and review screens (`useKeyCapture`, `usePracticeSession`)
- [ ] 5.6 Options screen
- [ ] 5.7 Spatial navigation

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

Branch `feature/popover`. Tray icon, popover window, hold ⌘ and global shortcut, window coordination, typed events between the windows (`settings-changed`, moved here from step 4), dock icon, autostart, single instance, and a strict CSP.

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
