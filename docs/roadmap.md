# Roadmap

The rewrite is built in small steps. Claude writes the code; you decide and review.

## How a step works

1. **Decide:** go through the step's open decisions. Claude recommends an option; you decide.
2. **Build:** on a branch named per [Conventional Branch](https://conventionalbranch.org), e.g. `feature/keyboard-domain`. Claude writes the code, domain code test first, one sub-step at a time.
3. **Review:** after each sub-step, Claude walks you through the diff. Feedback is applied before committing.
4. **Check:** `pnpm check` passes, and before the merge the [smoke test](smoke-test.md) in the running app.
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
- Key labels (`domain/keyboard/labels.ts`): `labelKey(labels, key)` returns `{ symbol, name? }`, where `labels` is a platform's table (`macosKeyLabels` now, a Linux table later). The table replaces `keyboard-symbol` and the second labels of the old `Key` component. Names stay English, like the keycaps, and aren't translated. Any other key shows its character uppercased, unless the uppercase form is longer (`ß` → `SS`), which replaces the old hard-coded `ß` exception, and named keys keep their name (`F5`). New compared to the old app: `Home` ↖ and `End` ↘ as in macOS menus, and `Numpad0` as `0` with the name `Numpad`.
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

## 5. Main window UI ✅ ([#5](https://codeberg.org/gobin/mouseless/issues/5))

Branch `feature/main-window`. The library, sets, set detail, learn, review and options screens, with transitions and keyboard navigation.

**Deliverables:** presentational components (`KeyCap`, `BaseButton`, `CircleProgress`, …), feature routes, composables (`useProgram`, the Elm runtime; `useKeyCapture`, `usePracticeSession`, `useSpatialNav`), styles ported from the old app.

**From the domain:** `practiceItems` / `appPracticeItems` / `reviewItems` build what a session practices, `combinationOf` turns a `KeyboardEvent`'s code and modifiers into an answer (named like resolved keys, see `keyOf`), `startSession` / `updateSession` run the session, and `reviewCard`, `recordLearning` and `reconcileProgress` update progress. The shell supplies what the domain can't compute purely: `Date.now()` and `Math.random()` in messages, the presentation number from `advanceAfter` back in `advance`, the local UTC offset with each review (`-new Date(at).getTimezoneOffset()`), the local end of today for `dueCards`, and the current `LayoutId`.

**Decisions**

- Styles: plain modern CSS, no Sass. Tokens are CSS custom properties (`styles/tokens.css`), components use scoped `<style>` with native nesting, and `color-mix()` replaces Sass's `rgba($color, 0.5)`. Once tokens are custom properties, Sass would only add BEM's `&__part`, which scoped styles make unnecessary. Only the tokens components use are ported: six colours, the window's black and two easing curves (the old `$ease` and `$easeInOut` are CSS's `ease` and `ease-in-out`). Modern CSS needs a recent WebKit, so step 9 sets `minimumSystemVersion`.
- Font: Source Sans 3 instead of Inter, from `@fontsource-variable/source-sans-3` (OFL): one variable file per subset covering all weights, bundled offline, and `unicode-range` loads only the subsets a text needs. The old app's Fira Code was never used and is dropped.
- Spatial navigation: our own `useSpatialNav`. A pure function picks the nearest element in the arrow's direction from rectangles, and a composable wires it to the DOM. `spatial-navigation-js` hasn't been released since 2022, is untyped and a global singleton. The arrows move focus; Escape goes back a level, and so does ← once nothing lies to the left, while → there opens the focused item, as the old set rows did. A screen focuses its first element, which is its main action (Start, Review or the first item). Practice screens don't navigate, since every key there is an answer.
- UI language: vue-i18n 11 in composition mode (its JIT compiler needs no `eval`, so it fits a strict CSP), with English and German UI text. It follows the system language from 5.3 on; 5.6 adds a `language: 'system' | 'en' | 'de'` setting (default `system`). UI text lives in `src/locales/{en,de}.json`, and the apps' catalogs, read from `data/apps.ts`, join the same instance as `apps.<id>.*`. Components translate through our own `useText()` rather than vue-i18n's `t`: its key type accepts any string, so vue-i18n's typed keys only add autocomplete, while `useText` types keys as the paths of `en.json` and makes a typo a type error. `satisfies` keeps the German text complete. Shortcut titles stay German until English catalogs are written, and app titles the vendor translates itself (Apple's Notes is `Notizen` on a German Mac) stay hard-coded in the data for now.
- Keymap until step 6: a `keymap` store reads through a `KeymapSource` port whose adapter returns the German fixture as `com.apple.keylayout.German`. Step 6 swaps only the adapter.
- No `parseTime`: the scheduler throws if a review's `at` isn't a finite number (noted in step 3.4), but the shell's `Date.now()` is the only source of message times and never produces one, so the guard would cover an input that can't occur.
- Tests in the shell: `useProgram`, the spatial navigation geometry and the composables. `happy-dom` only for the test files that need a DOM, added in the sub-step that first does; no `@vue/test-utils`, as presentational components are checked in the running app.
- Router: vue-router 5 with hash history, so the route survives a reload during development.
- Library: _recent_ apps and sets are those with something learned, as before, but ordered by when they were last practiced (`updatedAt`), newest first. A shortcut in two sets counts once for its app (the old app counted it twice), and an app's due count is what its review session would offer. Categories show in a fixed order (`appCategories`).
- Catalog: `data/apps.ts` lists the apps explicitly, so the list is type-checked and adding an app is one visible line. Each definition carries its texts (`catalogs: { de }`, imported from its `de.json`), so an app folder describes itself completely and there's no second list of catalogs to keep in step; the health test checks the list against the folders. Each app folder holds its `logo.svg`, which the screens find by folder name, so the domain types carry no asset URLs.
- A failed save during practice doesn't stop the session: what was just pressed is still right. A notice in the footer says progress couldn't be saved, and the error is logged. The next successful save writes the set's whole record again, so only the failed review log entry is lost.
- Options: an overlay, as in the old app, that slides up over the current screen, so closing it returns exactly there, even mid-practice. It holds only what works in step 5: the language and resetting progress. The trigger, the menu bar and Dock icons and launching at login join in step 7, together with the Rust side that applies them, so no toggle is ever without an effect. Reset is confirmed with a second click on the same button rather than `window.confirm`, which WKWebView doesn't reliably show. The language switches live and sets the document's `lang`.
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
- [x] 5.5 Learn and review screens
  - [x] 5.5.1 `useProgram`, the Elm runtime
  - [x] 5.5.2 `useKeyCapture`
  - [x] 5.5.3 `usePracticeSession`
  - [x] 5.5.4 Learn screen
  - [x] 5.5.5 Review screen
- [x] 5.6 Options
  - [x] 5.6.1 Language setting
  - [x] 5.6.2 Options overlay
- [x] 5.7 Spatial navigation

**Concepts:** Vue reactivity (`ref`, `computed`, `watch`), composables and effect cleanup, presentational vs. container components, typed props and emits, the router.

**Resources:** [Vue: Reactivity in depth](https://vuejs.org/guide/extras/reactivity-in-depth.html) · [Composables](https://vuejs.org/guide/reusability/composables.html) · [TypeScript with the Composition API](https://vuejs.org/guide/typescript/composition-api.html)

**What we learned**

- **The Elm Architecture carries the UI.** With the session pure since step 3, `useProgram` (a `shallowRef`, `dispatch` and an `AbortSignal` for effects) and `usePracticeSession` (clock, randomness, keys, timers and saving) were small, and each screen differs only in its strategy and its `save`. Leaving a screen aborts the signal, so a late timer never changes a model nobody shows.
- **Pure view logic belongs next to the view, with tests.** `keyCapsOf`, `nearestInDirection`, the progress summaries and `allLoaded` replaced what the old app spread over `v-if` branches and component methods, and each got its tests before its component.
- **Our lint shapes the composables.** `functional/no-mixed-types` turned `{ init, update, run }` into `useProgram(init, { update, run })` returning a tuple, and `prefer-immutable-types` turned `Ref` parameters into getters, which also read the current value at each use. Both read well, so the rules stayed on; one that only restated TypeScript (`vue/require-default-prop`) went.
- **Library types aren't always checks.** vue-i18n's typed keys accept any string, so our own `useText()` types keys as the paths of `en.json`, and a test on the types proves a typo fails. `satisfies` and a runtime test keep German and English in step.
- **Only the running app proves the platform.** Unit tests couldn't say whether macOS menu shortcuts (⌘W, ⌘Q, ⌘H) reach the webview in Tauri; a throwaway probe in the app showed they do, so practice needs no Rust menu. A look into the development database settled that "progress isn't saved" was the old rule that only a first-try test counts as learned.
- **Tooling caches can hide changes.** `vue-tsc --build` didn't notice a changed `vueCompilerOptions` or `lib` until its build info was deleted; `node_modules/.tmp/*.tsbuildinfo` goes when such options change.
- **Split big steps when they turn out big.** 5.3 became five sub-steps and 5.5 five, each one diff with a look at the running app. Transitions moved forward once navigation existed, so later screens were reviewed with their final motion.
- **Modern CSS is enough.** Custom properties, native nesting, `color-mix()` and scoped styles replaced Sass, and naming colours by role (`--color-surface`, `--color-text-muted`) came once the same shades had repeated 21 times.

## Technical debt after step 5 ✅ ([#12](https://codeberg.org/gobin/mouseless/issues/12))

Branch `chore/technical-debt`. An assessment of the whole codebase after step 5 found debt in the practice session's edges, a module cycle, test and accessibility gaps, missing logging, and drifted docs. It's paid off before step 6, one reviewable diff each (CI is postponed), together with three product gaps: trained shortcuts are kept, the shortcut texts exist in English, and a US layout fixture tests ANSI keyboards.

**Decisions**

- Resetting progress (and, from step 6, changing the layout) ends a running practice session, which returns to its set or app. A session never writes from a stale snapshot.
- No hosted CI for now: Codeberg's runners require a free license, and the app is for personal use. `pnpm check` stays the local gate; CI comes back once the repository moves to its own Forgejo instance with its own runner.
- Logging goes through `tauri-plugin-log`, for Rust and the webview, into the macOS log folder.
- Trained shortcuts are kept between learning sessions (`SetProgress.trained`, migration `0003_trained.sql`), unlike in the old app, so leaving a session loses only what wasn't pressed yet; they come back as tests. The effect that saves learning progress fires whenever a shortcut changes its stage and is called `learningChanged`.
- The shortcut data exists in English too, worded like each app's English menus. Every app needs both catalogs with the same entries (a type and a health rule), so vue-i18n falls back only on a mistake. An app's `title` is its English name; a catalog's `appTitle` translates it where the vendor does (Notes is Notizen in German).
- A test can be given up with **Forgot**: the right keys show, and it counts as a wrong answer (failed, graded _again_, back to trained, requeued in review) until the keys are pressed. The session records why a test failed as `failure: { kind: 'wrong', keys } | { kind: 'forgot' }`. It's a button only: every key is an answer during practice, and the data has shortcuts without modifiers.

**Sub-steps**

- [x] TD.1 End sessions on reset
- [x] TD.2 Break the router cycle
- [x] TD.3 Shell tests
- [x] TD.4 Accessible practice
- [x] TD.5 Logging
- [x] TD.6 Database off the async threads
- [x] TD.7 Small fixes
- [x] TD.8 CI (dropped, see the decisions)
- [x] TD.9 Docs and smoke test
- [x] TD.10 Keep trained progress
- [x] TD.10b Forgot button
- [x] TD.11 US keymap fixture
- [x] TD.12 English shortcut texts
  - [x] TD.12a English catalogs and translatable app titles
  - [x] TD.12b English for Bitwarden, Helium, Notes, Rectangle, Spotify, Terminal and WhatsApp
  - [x] TD.12c English for Bitwig and VSCodium
  - [x] TD.12d English for macOS, then English required
- [x] TD.13 Notes for the future

**What we learned**

- **Assess before paying off.** Collecting evidence first (sizes, test gaps, escapes, cycles, drift) turned a vague "some debt" into a ranked list, and most of it was small once named.
- **A snapshot needs an owner.** The practice session copies the progress it starts from; resetting underneath it was harmless until the session saved again. Ending the session when its origin changes is simpler than keeping both in sync.
- **Break code on purpose to trust a test.** Disabling the router guard and the trigger reservation made exactly the new tests fail, proving they guard what they claim.
- **Read the library before believing its docs.** `#[tauri::command(async)]` runs a synchronous body on the async runtime, not on a blocking thread; the macro's source showed it, and `spawn_blocking` fixed it. `expect` lints then reported the obsolete `needless_pass_by_value` by themselves.
- **Vue's `inject` ignores its fallback outside an app.** A composable that injects needs an app context in tests too (`app.runWithContext`), which matches how it runs for real.
- **Required fields find every case.** Making `trained` and English catalogs required turned the change into a list of compiler errors to fix, where optional fields would have hidden the gaps; a mechanical fix still needs review (it once hit a destructuring pattern, caught by lint).
- **A second fixture finds real data bugs.** Running the capture contract on a US layout showed six shortcuts written from a German keyboard that can't be practiced on US.
- **Check external services' terms before building on them.** Codeberg's hosted runners require a free license and stop jobs after 5 or 10 minutes; learning that first would have saved the CI detour, now reverted and kept in the history for an own Forgejo.

## 6. Native keyboard layout ✅ ([#6](https://codeberg.org/gobin/mouseless/issues/6))

Branch `feature/native-keymap`. Read the current keyboard layout in Rust, replacing `native-keymap`.

**Deliverables:** the `KeymapSource` trait, a macOS implementation (`TISCopyCurrentKeyboardLayoutInputSource` + `UCKeyTranslate`) that names the ISO keys as WebKit's `event.code` does, layout-change events, and output that matches the step 2 fixture.

**Decisions**

- Rust, not Swift: Swift would add a second FFI boundary, a toolchain and a third language under our rules, and these Carbon APIs aren't Swift-friendly either.
- `objc2-core-foundation` for the Core Foundation types, whose `CFRetained` releases what a _Copy_ function returned. No objc2 crate binds the Carbon functions (`objc2-carbon` is empty, `objc2-core-services` lacks CarbonCore and HIToolbox), so they're declared by hand in one `extern "C"` block.
- A thin FFI and a pure mapping: the `unsafe` module only reads raw data (per macOS key code its four characters, the layout ID, whether the keyboard is ISO); a pure function turns it into our keymap and is tested without a keyboard.
- Keys are named as WebKit's `event.code` names them, since key capture looks them up by it. Checked on an ISO keyboard: WebKit doesn't undo macOS's ISO codes as Chromium does, so the key left of 1 is `IntlBackslash` and the key next to left Shift `Backquote`, crossed from the W3C names. The German fixture swaps its two entries back to match (step 2 had applied Chromium's swap).
- The `TIS` functions run on the main thread, so the command hands its work to it.
- `keymap-changed` is only a signal: the keymap store loads again through the same command and decoder, and keeps its value when the layout ID didn't change (input methods post the same notification).
- The frontend's `KeymapSource` port lives in `ports.ts` next to `Logger`, not in the domain: its `onChange` subscription is an effect, which the functional core has none of. Ports that only return data, like the repositories, stay in the domain. When the layout changes, the store reads it again, keeps its state when the ID is the same, and keeps the old layout (logging why) when reading fails.
- Shortcuts written from a German keyboard get a second combination for US where the German one can't be pressed there (Shift + `+` would need Shift twice), or presses the wrong key (⌘`<` is ⌘`` ` `` on US). Practice takes the shortest combination the layout allows, so German keeps its keys. The health rule is now per shortcut: every shortcut can be practiced on both fixtures. Bitwig's two US combinations are unverified guesses.
- Fixtures come from a Cargo example run by hand per layout (`cargo run --example dump_keymap`, `-- --ansi` for the US fixture): tests can't read the layout, since libtest runs them off the main thread. There's only an ISO keyboard to read, so the US fixture is translated for the first ANSI keyboard type macOS knows. The German fixture matched the reader exactly; the hand-written US one had two mistakes (Shift+Option+K types the Apple logo, the numpad's decimal key a period).

**Sub-steps**

- [x] 6.1 Rename `StorageError` to `PlatformError`
- [x] 6.2 `KeymapSource` trait, `platform::current()` and the pure mapping with the ISO fix
- [x] 6.3 macOS FFI and the `get_keymap` command; the frontend reads the real layout
- [x] 6.4 Fixtures from the reader: compare German, replace US with ANSI output
- [x] 6.5 Layout-change events
- [x] 6.6 Alternatives for the six shortcuts that can't be practiced on US

**Carried over** (from step 5 and the technical debt round)

- Replace the German stand-in (`platform/keymap.ts` and its one lint exception) by the Rust reader, and rename `StorageError` to `PlatformError`, since the keymap port uses it too.
- Replace the hand-written US fixture (`usKeymap.fixture.json`, from the US layout tables) by the reader's real output on an ANSI keyboard, and compare the German fixture with it on ISO.
- A layout change ends a running practice session: `useSessionExit` already watches the layout, so check it once the layout can switch at runtime (smoke test, _Later steps_).
- Six shortcuts can't be practiced on US: written from a German keyboard, their character needs a modifier the shortcut already has (Shift + `+` becomes Shift twice). Give them an alternative combination for such layouts: Bitwig's octave up and vertical zoom in, macOS's previous window, Rectangle's smaller and larger, Terminal's show all tabs.

**Concepts:** FFI and `unsafe`, `objc2`, Core Foundation memory rules, traits as ports (Bridge pattern).

**Resources:** [The Rustonomicon](https://doc.rust-lang.org/nomicon/) · [objc2](https://docs.rs/objc2/latest/objc2/) · [UCKeyTranslate](https://developer.apple.com/documentation/coreservices/1390584-uckeytranslate)

**What we learned**

- **Check the consumer, not the spec.** The keymap was built with the W3C's names for the two ISO keys, but WebKit's `event.code` keeps macOS's crossed codes. Pressing the keys in the running app found it; the names only have to match what key capture reads.
- **Let a real reader judge the fixtures.** The German fixture matched the reader exactly, while the hand-written US one had two mistakes, and U.S. International turned out to be a different layout with dead keys. A dump tool beats writing data from tables.
- **Main-thread APIs shape the tools.** libtest runs every test on its own thread, so the layout can't be read in a test; a Cargo example can. A guard that returns an error made this visible instead of crashing.
- **FFI stays small when the logic moves out.** The `unsafe` module only reads raw data and registers a callback; the key mapping is a pure table with tests, and `CFRetained` plus lifetimes carry Core Foundation's Copy and Get rules.
- **A callback through C needs one thin pointer.** Being generic over the closure type (`layout_changed::<F>`) avoids double boxing, and leaking the one callback that lives as long as the app is honest about its lifetime.
- **Subscriptions are effects.** `onChange` couldn't live in the functional core, so ports with effects moved to the shell next to `Logger`, while ports that only return data stay in the domain.
- **Tests find what the data can't be pressed as, not what's wrong.** The six impossible US shortcuts were flagged, but Next window resolving to ⇧⌘, on US wasn't; knowing the apps' real shortcuts still takes a person.

## Rust review ✅ ([#16](https://codeberg.org/gobin/mouseless/issues/16))

Branch `chore/rust-review`. The Rust code is refactored along three references, with [High Assurance Rust](https://highassurance.rs/) weighing most: [Canonical's Rust best practices](https://canonical.github.io/rust-best-practices/) and [Rust Design Patterns](https://rust-unofficial.github.io/patterns/). The code already meets most of them (no `unwrap`, `unsafe` in one module, `thiserror`, `-D warnings` from the command line); this round turns review rules into compiler checks and closes the gaps.

**Decisions**

- Canonical's module layout: a module with files of its own has a `mod.rs`, which only declares modules and re-exports, instead of `platform.rs` next to `platform/`.
- The main thread is proven by a token: the Carbon calls take objc2's `MainThreadMarker`, checked once where a command comes in, instead of a runtime check inside every call (High Assurance: functions on a resource called in the right sequence).
- Rust validates what the webview sends (High Assurance: external inputs must be validated; Tauri treats the webview as untrusted): newtypes for shortcut IDs, layout IDs and times, and range checks on a card's memory, decoded with serde's `try_from`. The frontend's decoders stay.
- Rust tests `expect` with a message instead of returning `Result` (Clippy's `allow-expect-in-tests`), so a failure points at its line, as Canonical asks; `unwrap` stays denied everywhere.
- `cargo-deny` checks the Rust dependencies (advisories, sources, licenses) in its own script, `pnpm rust:audit`, so `pnpm check` stays offline.

**Sub-steps**

- [x] RR.1 Module layout with `mod.rs`
- [x] RR.2 Lints that lock in what the code already follows
- [x] RR.3 Smallest `unsafe` module and the main-thread token
- [x] RR.4 Errors: `source` and `reason` fields, "cannot …" messages
- [x] RR.5 Newtypes and checks for what the webview sends
- [x] RR.6 Row writers that name every field and SQL parameter
- [x] RR.7 Canonical style
  - [x] RR.7a Derives, imports, ordering, returns and struct literals
  - [x] RR.7b Tests that `expect` instead of returning `Result`
- [x] RR.8 `cargo-deny`
- [x] RR.9 Conventions, UML and what we learned

**Concepts:** static, dynamic and operational assurance; parse, don't validate; typestate and capability tokens; containing `unsafe`; supply-chain checks.

**Resources:** [High Assurance Rust](https://highassurance.rs/) · [Canonical Rust best practices](https://canonical.github.io/rust-best-practices/) · [Rust Design Patterns](https://rust-unofficial.github.io/patterns/) · [Clippy lints](https://rust-lang.github.io/rust-clippy/master/) · [cargo-deny](https://embarkstudios.github.io/cargo-deny/)

**What we learned**

- **Turn review rules into compiler checks.** "Every `unsafe` block has a SAFETY comment", "no overflow" and "no indexing" held already, but only because someone looked. As lints they hold without anyone looking; deleting one SAFETY comment on purpose failed the build.
- **A capability beats a runtime check.** A zero-sized `TextInputSources` that holds a `MainThreadMarker` turns "call this on the main thread" into a type rule: the check runs once where a command comes in, and nothing that holds one can run elsewhere.
- **Make the compiler list what a new field touches.** Destructuring every field in the row writers made one extra field on `Card` fail the build in exactly the three places that have to handle it: checking, writing and reading. Named SQL parameters make the column next to each value visible, where positions let two IDs swap silently.
- **Check at the boundary, not on the way back.** Values from the webview are parsed into newtypes; rows read from the database aren't checked again, so a rule that tightens later can't lock anyone out of their progress. Where to check was a decision, not a detail.
- **A supply-chain tool pays off on its first run.** `cargo-deny` found a yanked crate deep under Tauri; the fix was hours old, so the cooldown rule held it at the release before. Rules about time need someone who checks the date.
- **References disagree, so write down which one decides.** Canonical wants `mod.rs` and `unwrap` in tests; the Rust book prefers `foo.rs`, and High Assurance calls the layout a preference. Choosing once per question and recording it in `conventions.md` beats rediscovering the conflict in every review.
- **Render the diagram to check it.** Moving boxes by coordinates in XML looked right until draw.io's CLI rendered the page: two arrows cut through boxes, and an old bend point made a box seem to point where it didn't.

## Memory leaks ✅

Branch `fix/memory-leaks`. An audit of both sides for listeners, timers, subscriptions and callbacks that outlive their owner, before step 7 keeps the popover open for days. Everything is cleaned up except one listener per answer in a practice session, and one intentional Rust leak that nothing keeps from happening twice.

**Decisions**

- The practice session's timer removes its `abort` listener when it fires, so a session no longer collects one per correct answer.
- The layout observer stays leaked on purpose, since it lives as long as the app, but a second registration fails with an error (a `static` flag) instead of leaking again and sending every change twice. A guard that removes the observer on drop would need more `unsafe` for a registration that never ends.
- A failed `listen` for layout changes is logged instead of being an unhandled rejection.

**Sub-steps**

- [x] ML.1 The session timer removes its abort listener
- [x] ML.2 The layout observer registers once
- [x] ML.3 Failed layout listening is logged
- [x] ML.4 Smoke test, UML and what we learned

**What we learned**

- **Cleanup has two exits.** The timer was cancelled when the session ended, but its cancel handler stayed behind when the timer fired first. Whatever registers two things that race must remove the loser, whichever wins.
- **Measure a leak at its registration.** Spying on `AbortSignal.prototype` (not `EventTarget`, which happy-dom's signals don't go through) counted the listeners directly; memory tools would only have shown a slow drift.
- **An intentional leak needs a guard.** Leaking the layout observer is right for something that lives as long as the app, but only if nothing can do it twice; the guard lives in `SystemKeymap`, since a module-level flag would break the rule against singletons.
- **Check a fix against every rule, not only the bug.** The first version of the guard was a `static`; asking whether it fits the functional style and The Elm Architecture found it, and moved `undefined` to a `Result` in the same review.
- **Unhandled rejections are silent failures.** Nothing leaked, but a failed `listen` would never have reached the log; a test with a failing `listen` made Vitest report the rejection itself.

## 7. Menu bar popover and trigger ✅ ([#7](https://codeberg.org/gobin/mouseless/issues/7))

Branch `feature/popover`. Tray icon, popover window, hold ⌘ and global shortcut, window coordination, dock icon, autostart, single instance, and a strict CSP. The typed `settings-changed` events between the windows (moved here from step 4) moved on to step 8, which fills the popover.

**Decisions**

- The popover is its own page (`popover.html`, `popover.ts`) without the router, placed by our own code from the tray icon's position (no positioner plugin), which also serves the trigger. It's transparent with the native popover material and a dark theme, which needs `macOSPrivateApi`.
- A pure coordinator decides what every window event does (`coordinate(Showing, Event) → Vec<Action>`), and one executor carries it out. Closing the popover gives focus back by hiding the app, unless the main window shows; closing the main window hides it, and the Dock, a second launch, ⌘, and the icon's Options bring it back.
- Holding ⌘ is watched with a listen-only event tap, which needs Input Monitoring; it's asked for only once hold ⌘ is the trigger. Detecting the hold is a small pure update with a press counter, so an old wait can't fire.
- The trigger shortcut stays stored as characters; Rust registers the key typing them on the current layout, and again after a layout change. The recorder needs ⌘, ⌃ or ⌥ and rejects ⌘ with one key, which apps use for their standard commands.
- The Dock and menu bar icons apply live, and one of them always stays. Launch at login uses a LaunchAgent, in release builds only. Both menus are built by us in English and German, since Tauri's default menu isn't translated.
- A strict CSP for built apps (`'self'` plus IPC) and a `devCsp` with only what Vite needs, a frozen prototype, and capabilities that grant each window only what it uses.

**Sub-steps**

- [x] 7.1 Tray icon and popover window
- [x] 7.2 `WindowCoordinator` (Mediator)
- [x] 7.3 Trigger: hold ⌘ event tap and global shortcut
- [x] 7.4 Dock icon, autostart, single instance
- [x] 7.5 Strict CSP, verified in the running app

**Concepts:** the Mediator pattern, macOS activation policy and focus handling, event taps, the Content Security Policy.

**Resources:** [Tauri system tray](https://tauri.app/learn/system-tray/) · [Tauri CSP](https://tauri.app/security/csp/) · [NSWorkspace.frontmostApplication](https://developer.apple.com/documentation/appkit/nsworkspace/frontmostapplication)

**What we learned**

- **A pure coordinator pays off with every new input.** Once window behaviour was `coordinate(Showing, Event)`, the trigger, the Dock, a second launch and Escape were each one event and one test, and questions like "does Escape hide the main window too?" were answered in a unit test, not in the running app.
- **The Elm Architecture fits Rust too.** Holding ⌘ became an update function with a `Wait` effect; a press counter replaced cancelling timers, so a stale wait simply doesn't match.
- **Where to start watching is a permission decision.** The event tap needs Input Monitoring, so it starts only when hold ⌘ is chosen; people who use a shortcut are never asked.
- **Keep the stored format, translate at the edge.** The trigger stays in characters like every other combination; only registering it needs a key, which Rust looks up on the current layout and again after a change.
- **Prove a security policy by breaking it.** An empty violation log meant nothing until a build with `font-src 'none'` showed 14 blocked fonts in it: both the policy and the logging were live.
- **A plugin's cooldown is its whole dependency tree.** Two plugins brought 40 crates; every new lockfile entry was checked, not only the ones we named.
- **Strict templates turn fallthrough attributes into documented props.** `aria-pressed` and `title` couldn't pass through, so `BaseButton.pressed` and `OptionRow.hint` say what they're for.
- **Defaults hide features.** Replacing Tauri's untranslated menu meant building the Edit menu ourselves, which is also what gives text fields ⌘C and ⌘V.

## Native design ✅ ([#17](https://codeberg.org/gobin/mouseless/issues/17))

Branch `feature/native-design`. The app looks and behaves like a native Mac app, following [Apple's design resources for macOS](https://developer.apple.com/design/resources/#macos-apps) and the Human Interface Guidelines, before step 8 builds the lookup UI. Built in one go and reviewed as a whole.

**Decisions**

- A sidebar lists the apps by category (and Recent) on macOS's sidebar material; the detail shows an app, a set, learning or review, with a toolbar whose back button is a glass capsule, instead of sliding screens. The window is resizable with a minimum size.
- The appearance follows the system, light and dark. The system font (SF Pro) replaces Source Sans 3; colors are semantic tokens measured from System Settings on macOS 27, the accent follows the user's accent color, controls are native or capsules, and grouped boxes have no border and inset separators.
- Liquid Glass (`NSGlassEffectView`, which Tauri 2.12 exposes as a window effect) is used where macOS 27 uses it: the popover. Window sidebars keep the sidebar material, as Settings and Finder do; a clear glass sidebar let the desktop show through in streaks.
- The options became a Settings window of their own (⌘,), with toolbar panes, and "Options" is called "Settings" in English. Windows learn about changes made in another one through `settings-changed` and `progress-reset` events (brought forward from step 8). Only the Settings window may save settings or reset progress.
- This replaces the invariant that the rewrite keeps most of the old app's look; it keeps its functionality and data.

**Sub-steps**

- [x] ND.1 Foundations: system font, system colors for light and dark, native controls
- [x] ND.2 Window: resizable, sidebar material, traffic lights over the sidebar
- [x] ND.3 Sidebar and detail navigation
- [x] ND.4 Keyboard navigation for the sidebar and the detail
- [x] ND.5 Settings window, and events between the windows
- [x] ND.6 Practice screens and popover in the native look
- [x] ND.7 Docs, UML and smoke test

**Concepts:** the macOS Human Interface Guidelines (sidebars, toolbars, settings windows), semantic system colors, window materials.

**Resources:** [Apple Design Resources: macOS](https://developer.apple.com/design/resources/#macos-apps) · [HIG: Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars) · [HIG: Color](https://developer.apple.com/design/human-interface-guidelines/color) · [HIG: Settings](https://developer.apple.com/design/human-interface-guidelines/settings)

**What we learned**

- **Measure against the system, not memory.** The first version followed the HIG and a recollection of Tahoe, and looked almost right. Screenshots of System Settings and Finder, sampled pixel by pixel, gave the real content, box and separator colors, row heights and capsule sizes, and showed that sidebars are flush, not floating.
- **The newest effect isn't always the native one.** Liquid Glass was available and impressive, but macOS 27 uses it for floating things (popovers, toolbar capsules), while window sidebars keep the sidebar material. Copying what the system does beat using what the toolkit offers.
- **Design kits can't be read, the running system can.** Figma and Sketch links were closed to tools and the kit's download held only pointers; the Mac running the target OS was the better reference.
- **A second window turns local state into shared state.** Moving the options into their own window meant the main window had to hear about saved settings and resets: two events from Rust, followed by the stores, not a message between windows.
- **A grid needs a row height to scroll.** The sidebar didn't scroll because the window grid's only row grew with its content; `grid-template-rows: minmax(0, 1fr)` let it shrink to the window.
- **A big step in one go needs screenshots, not only tests.** 406 tests passed while the sidebar couldn't scroll and the glass looked wrong; only looking at the running app found both.

## 8. Menu shortcut lookup ✅ ([#8](https://codeberg.org/gobin/mouseless/issues/8))

Branch `feature/menu-lookup`. Read any app's menu shortcuts through the Accessibility API, and show them with search in the popover.

**Sub-steps**

- [x] 8.1 AX FFI and the permission flow
- [x] 8.2 Recursive menu walk and mapping into shortcut data
- [x] 8.3 Lookup UI with search

**Decisions**

- The Accessibility API through `objc2-application-services`, its `unsafe` in `accessibility.rs`; the window list's in `window_list.rs`.
- Access is asked for lazily: only an app without built-in sets shows the request, whose button shows macOS's prompt and opens System Settings.
- The looked-up app is the frontmost one, or, when that's Mouseless, the owner of the topmost other window. Rust finds it before the popover takes focus, keeps its process, and tells the popover its name and bundle ID with `popover-opened`.
- Rust maps menu items into the shortcut data's key names (`menu_keys.rs`); groups are the top-level menus, the Apple menu left out, Option alternates kept. The popover reads them with an async command, off the main thread, with a 1 s AX timeout.
- Built-in sets win, matched by bundle ID (`bundleIds` in the data), so the menus aren't read for those apps.
- Search is our own: every word in the title or the menu's title, ignoring case and accents. No fuse.js.
- The popover's flow is an Elm program (`updateLookup`); an opening counter drops stale menus. It follows the language setting and the layout like the other windows.

**Concepts:** the Accessibility API and permissions, recursion over trees, matching apps by bundle ID.

**Resources:** [AXUIElement](https://developer.apple.com/documentation/applicationservices/axuielement_h)

**What we learned**

- **Check remembered constants against the running system.** Apple's menu glyph codes are no longer in the SDK's headers. A throwaway dump of ten apps' menus confirmed the table, and showed the only unknown codes were Globe and Dictation, which no shortcut can name.
- **One message per item keeps a cross-process walk fast.** Reading an item's five attributes with `AXUIElementCopyMultipleAttributeValues` takes Finder's menus in 50 ms; big apps like Preview still take over a second, so it runs off the main thread with a timeout.
- **Keep the target on the trusted side.** Rust remembers which process the popover opened over; the webview only learns its name and can't ask to read another one.
- **A counter beats cancelling, again.** As with holding ⌘, numbering the openings made a slow answer for an earlier one simply not match.
- **Recognize apps by what doesn't get translated.** Bundle IDs replaced the old match by the localized name, which had forced the Notes data to be titled "Notizen".
- **`overflow: hidden` makes a flex item shrinkable.** The popover's title disappeared under the search field once a long list filled the column; `flex: none` keeps it. Only the running app showed it.
- **Dev builds borrow the terminal's permissions.** Under `tauri dev`, macOS checks Accessibility for the terminal, so the request flow needs a packaged build to test.
- **A sub-step can be split for review.** The lookup UI went in as four commits (data, search, the program, the view), each reviewed on its own.

## 9. Packaging ✅ ([#9](https://codeberg.org/gobin/mouseless/issues/9))

Branch `chore/packaging`. Build and sign the app. There's no importer: progress and settings start fresh.

**Sub-steps**

- [x] 9.1 Bundle config and signing
- [x] 9.2 Remove launch at login

**Decisions**

- For this Mac only, like the old app: `pnpm tauri build` makes just `Mouseless.app` (no disk image), ad-hoc signed (`signingIdentity: "-"`), with no notarization.
- Version 1.0.0, kept only in `Cargo.toml`: Tauri reads it from there when `tauri.conf.json` has none, and the private `package.json` doesn't need one.
- At least macOS 14 (`minimumSystemVersion`), for ES2023 (`toSorted`), `color-mix()` and native CSS nesting in the system's WebKit. Category Productivity.
- No launch at login: the setting, its toggle and the autostart plugin are gone. A stored `launchAtLogin` row needs no migration: loading skips keys that are no longer settings, and the next save rewrites the table.

**What we learned**

- **An ad-hoc signature is a hash of the build.** macOS ties Input Monitoring and Accessibility to the signature, so every rebuild loses both grants; only a certificate gives an identity that lasts.
- **One place for the version.** Without `version` in `tauri.conf.json`, Tauri takes `Cargo.toml`'s, and a private `package.json` needs none.
- **Storing only changed settings makes removing one free.** Loading skips keys that are no longer settings, so launch at login went without a migration.
- **The bundle's file name collides, not its identifier.** The old and new app have different IDs but are both `Mouseless.app` in `/Applications`.
- **Check the code before describing it.** The review first claimed dev and packaged builds share a database; `database.rs` gives debug builds their own file.

## Learning overview ✅ ([#13](https://codeberg.org/gobin/mouseless/issues/13))

Branch `feature/learning-overview`. A view of where learning stands: what's due for review today, and how much of everything is learned, so you see how you're doing and what's left for the day.

**Sub-steps**

- [x] LO.1 Reading the review log
- [x] LO.2 The overview's figures
- [x] LO.3 The progress store keeps the log
- [x] LO.4 The Overview screen

**Decisions**

- An _Overview_ row at the top of the sidebar, selected at launch, replaces the start screen (the detail without a chosen app).
- It shows today (what's due, by app, and the reviews done), progress (learned out of all practicable shortcuts, overall and by app), performance (the share of tests without a mistake over 30 days, and the days in a row with practice) and the reviews per day over 4 weeks as a small chart in plain SVG.
- Everything counts the current layout, and days are local days, from each review's stored UTC offset.
- The review log reaches the frontend as rows (time, UTC offset, grade) of the last year, through `load_review_log`; the pure domain computes every figure. The progress store keeps the log, adds each new review and forgets it on a reset, so the overview stays current.

**What we learned**

- **Count each moment in its own time zone.** A review stores its UTC offset, so `localDay` puts a review made before a change to summer time on the day it was made, not the day it is now.
- **Let the store keep what a screen derives from.** The overview is computed from the store's log, and the store adds each saved review to it, so the figures change without reloading or events.
- **A late answer for an old question is dropped, again.** Remembering which layout was asked for last keeps a slow log from overwriting the new layout's.
- **Check helpers against the oldest supported WebKit.** `Promise.withResolvers` (ES2024) isn't in the project's `lib`, nor in macOS 14's WebKit; a timer did the test's job.
- **A small reformat can break the previous commit's check.** One longer word in a Markdown table made Prettier re-pad the whole table; run the formatter after every edit, not only before the first commit.
- **A blank screenshot is a permission, not a bug.** `screencapture -l` returns only the frame without Screen Recording access, so a person still looks at new screens.

## Science-backed training 🚧 ([#18](https://codeberg.org/gobin/mouseless/issues/18))

Close the gaps between the shortcut trainer and the research in `docs/specs/shortcut-learning-research.md` (§5): a learning criterion of two recalls, grading limits relative to the learner's own times, and a coach that connects practice to real use. The design is in `docs/specs/science-backed-training.md`.

**Sub-steps**

- [x] 18.1 Learning criterion
- [ ] 18.2 Relative grading
- [ ] 18.3 Spike: menu choices
- [ ] 18.4 The switch and the coach
- [ ] 18.5 The banner
- [ ] 18.6 Key presses
- [ ] 18.7 Your commands and the overview

**Decisions**

- A shortcut is learned after two correct recalls without the keys, with others in between; a mistake resets the count.
- Easy and hard are relative to the learner's median time for shortcuts with as many keys (the last 200 correct first tries), with today's 2 s and 6 s until there are 20.
- One switch, off by default (_Learn from how I work_), lets Mouseless watch menu choices and key presses of known shortcuts. Only counts per shortcut and day are stored, and turning it off deletes them.
- Menu choices of known shortcuts fill an app's _Your commands_ set and, unless turned off, show a brief banner with the keys. The overview shows the share done by keyboard and the commands still chosen from menus.

## UI/UX overhaul ✅ ([#14](https://codeberg.org/gobin/mouseless/issues/14))

Branch `feature/ui-overhaul`. Give Mouseless a look of its own, after Halloy and Gram: IBM Plex Sans and Mono, a warm dark and a paper light palette with one accent per meaning, a flat frame, compact chrome and lists, and a generous practice stage. It replaces the _native Mac app_ invariant. The design is in `docs/specs/ui-overhaul.md`.

**Sub-steps**

- [x] 14.1 Tokens and fonts
- [x] 14.2 Frame and sidebar
- [x] 14.3 Lists, overview, app and set screens
- [x] 14.4 Practice
- [x] 14.5 Popover
- [x] 14.6 Settings window

**Decisions**

- Away from the native look (no system materials, system blue or SF Pro), still a Mac window: traffic lights, system appearance, keyboard conventions.
- IBM Plex Sans for text, Plex Mono for keys, figures and captions, bundled from Fontsource (IBM's own packages install telemetry); key symbols fall back to the system font.
- Our own light and dark palette following the system appearance, checked for contrast; accents for action, learned, mistake, due and info.
- A quiet, flat 32 px title bar (traffic lights, the app's name, a page's buttons); pages name themselves in their content. No sidebar or popover glass; compact frame and lists, a generous practice stage; equal spacing on a panel's edges, actions in its bottom-right corner.

**What we learned**

- **A preview is a spec, so copy its numbers.** The first pass followed the spec's rounded sizes and drifted: a busier title bar, looser rows, a missing heading. Taking paddings, heights and sizes from the preview's CSS closed the gap.
- **Font smoothing changes the look.** `-webkit-font-smoothing: antialiased` drew Plex visibly thinner than the browser preview; WebKit's default matches it.
- **Read a font file before planning markup around it.** Fontsource's Latin files have no key symbols but ↑ and ↓, so leaving those two out of the range lets every symbol fall back to the system font, with no wrapper element.
- **Check a package's install scripts, not only its licence.** IBM's Plex packages pull in a telemetry dependency; Fontsource ships the same OFL fonts with none.
- **Check light colors against their neighbours, not only against text.** _Raised_ on _box_ is nearly invisible in light, so empty tracks use the border color.
- **A global class name has to be free.** `.label` was already a scoped class in `SkipButton`; the shared caption became `.caption`.
- **Keyboard hints need keys that are free.** Practice takes every key as an answer, so the preview's `esc` and `⇥` hints had no keys to show.
- **A restyle leaves repetition behind.** The refactor round after it found the same window listeners, language line, logo, back button and practice setup in several places, each now one composable or component (`useWindowListener`, `useSettingsLanguage`, `AppLogo`, `BackButton`, `usePracticeScreen`), and a font face nothing used.
- **A removal needs the options it was added with.** `removeEventListener` only removes a capturing listener when given `capture` again, so `useWindowListener` passes the same options to both.
- **Group parameters by kind to keep types unmixed.** `functional/no-mixed-types` rejected one options object of data and functions; what to practice (data) and how the screen hooks in (functions) became two.

## Linux ⏳ ([#10](https://codeberg.org/gobin/mouseless/issues/10))

Platform implementations for X11/Wayland, a UI driven by capabilities, and Linux key labels. Not scheduled yet; planned in detail when it starts.

**Carried over**

- Linux key labels: `main.ts` provides the platform's labels (`keyLabelsKey`), so only that line changes.
- CI can run the Rust checks on Linux, but only macOS builds the macOS-specific code.

## Unscheduled

Found along the way, not tied to a step yet.

- **CI:** once the repository moves to its own Forgejo instance with a runner. The workflow is in the history (`5c3d104`); Codeberg's hosted runners required a free license.
- **Data:** the German Notes catalog calls _Monostyled_ "Proportional", which means the opposite; check Apple's German menu name.
- **Set screen:** show trained shortcuts (kept since the debt round) apart from new ones, not only the learned ones.
- **Dead-key layouts:** on U.S. International, Shift+6 and Shift+`are dead keys that type`ˆ`and`˜`(spacing accents), so shortcuts written with`^`or`~` don't resolve there. Resolve a character to the dead key that types its accent, if such layouts matter.
- **VoiceOver:** two identical announcements in a row are read once; a counter in the text would repeat a second identical mistake.
- **Keyboard navigation:** going back focuses the screen's first element rather than the item you came from.
- **Popover focus:** opening the popover activates Mouseless, so a main window behind other apps comes forward with it. If that bothers in use, make the popover a non-activating panel.
- **Trigger recorder:** it can't offer `IntlBackslash` (the ISO key left of 1), since global-hotkey has no macOS key code for it. A shortcut that can't be registered (such as one another app holds) is only logged (`ErrorKind::Trigger`); `set_settings` could return it so the recorder shows it.
- **Globe shortcuts in menus:** the Accessibility API's modifier mask has no flag for the Globe key (🌐), so a menu item like Finder's _Fill_ (probably 🌐⌃F) reads as ⌃F. Fixing it needs another source than the menu item's attributes.
- **Developer ID signing:** an ad-hoc signature changes with every build, so macOS forgets the Input Monitoring and Accessibility grants after a rebuild. Sign with an Apple Developer certificate (and notarize) once there is an account, and before the app is handed to others. Before that, check the two community logos from macosicons.com, which are fine for personal use only.
- **TypeScript 7** once typescript-eslint and vue-tsc support it, and dropping the `is-immutable-type` patch once its upstream fix lands (both in `CLAUDE.md`).
