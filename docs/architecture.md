# Architecture

The target architecture of the Tauri rewrite. It builds on the analysis of the old app in [legacy-architecture.md](legacy-architecture.md) and the plan in `../mouseless-old/REWRITE.md`.

Four things shape it:

1. **Functional programming** as the main paradigm, and clean code throughout (§1, [conventions.md](conventions.md)).
2. **Tauri 2 and Vue 3 best practices** (§3, §4).
3. **Design patterns** from the [refactoring.guru catalog](https://refactoring.guru/design-patterns/catalog), in their functional form, used only where they solve a problem the old app actually had (§5).
4. **Testability:** the domain logic runs without Tauri, Vue or a real keyboard.
5. **[The Elm Architecture](https://guide.elm-lang.org/architecture/)** for every flow with logic: a model, messages, a pure update that returns effects as data, and a small runtime in the shell (§1.1).

---

## 1. Principles

- **Functional first.** Pure functions over immutable data. No classes, no `this`, no `let`, no loops, and no exceptions in the domain: errors are values (`Result`). This is enforced by `eslint-plugin-functional` (see [conventions.md](conventions.md)).
- **Functional core, imperative shell.** Domain logic (keyboard resolution, practice sessions, scheduling, reconciling progress) is made of pure TypeScript functions over plain data. Side effects (IPC, disk, timers, DOM events) live at the edges: `platform/`, stores, composables and components.
- **Ports and adapters (hexagonal).** The domain declares the capabilities it needs as types, each a record of functions (`ProgressRepository`, `Scheduler`, …). Adapters implement them: Tauri commands in production, in-memory versions in tests. Dependencies are passed as arguments, never imported globally.
- **Dependencies point inward.** `features → stores → domain` and `platform → domain`. The domain imports nothing from Vue, Pinia or Tauri, and an ESLint rule enforces this.
- **Rust owns the OS and the disk; TypeScript owns the domain and the UI.** Rust never decides what a shortcut means, and TypeScript never touches the file system.
- **No module-level singletons.** Single instances exist, but they are created in one place and injected: Tauri's managed state in Rust, Pinia stores and `provide`/`inject` in Vue. This fixes the old app's biggest structural problem.
- **Name code by its domain role, not by the pattern.** Write `ShortcutPolicy`, not `ValidationChain`. This doc records which pattern each module uses.

### 1.1 The Elm Architecture

The app's flows (a practice session, and later the stores' changes) follow [The Elm Architecture](https://guide.elm-lang.org/architecture/). Its ideas fit functional core, imperative shell exactly: the core decides, the shell carries out.

| Elm                   | Here                                                                                                                                                                                                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Model`               | An immutable value, a discriminated union when the flow has phases, so impossible states can't be represented (`Session`).                                                                                                                                                                    |
| `Msg`                 | Plain data describing what happened (`{ type: 'answer', keys, at }`). A message that needs time or randomness carries it, filled in by the shell, just as Elm's `Time.now` and `Random.generate` deliver their values as messages.                                                            |
| `update`              | A pure function `(model, msg) → { model, effects }`, named by its domain role (`updateSession`).                                                                                                                                                                                              |
| `Cmd`                 | `Effect`: data describing work for the shell, such as saving a review or waiting (`{ type: 'advanceAfter', ms }`). Waiting is an effect too, so timings like the 1 s pause after a success are domain rules with tests. We say _effect_ because GoF's Command is the message, not the effect. |
| `Sub`                 | Composables that turn outside events (key presses, Tauri events) into messages and remove their listeners in `onScopeDispose`.                                                                                                                                                                |
| `view`                | Components render the model and dispatch messages. They hold no flow logic.                                                                                                                                                                                                                   |
| The runtime           | `useProgram({ init, update, run })` (step 5): holds the model in a `shallowRef`, applies `update` on `dispatch(msg)` and passes the effects to `run`, whose results come back as messages.                                                                                                    |
| JSON decoders         | Data from IPC and disk is parsed into domain types, as a `Result`, before the domain sees it ([parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)). How is decided in step 4.                                                                        |
| `Maybe`, `Result`     | `Result` for failures, `undefined` for absence, and no exceptions in the domain (§1).                                                                                                                                                                                                         |
| One model for the app | **Not adopted:** one model per concern. Pinia setup stores hold app-wide data (settings, progress, keymap) and change it through pure domain functions, and each flow, such as a practice screen, runs its own program. That keeps Vue's component-local state instead of fighting it.        |

State + Command (§5) are this loop in pattern terms: the model is the State, and a message is the Command.

## 2. Layers

```
┌─────────────────────────────── Vue frontend (src/) ───────────────────────────────┐
│ features/   library · learn · review · lookup · settings    (routes, containers) │
│ components/ Key · Btn · Page · CircleProgress …              (presentational)     │
│ composables/ useKeyCapture · usePracticeSession · useSpatialNav                   │
│ stores/     Pinia: settings · keymap · progress · catalog    (app state)          │
│ platform/   Facade over generated Tauri bindings            (adapters)            │
│ domain/     keyboard · shortcuts · practice · scheduling · progress   (pure TS)   │
│ data/apps/  shortcut definitions                                                  │
└──────────────────────────────▲──────────────────────────┬─────────────────────────┘
                     commands (typed, async)        events (typed)
┌──────────────────────────────┴── Rust (src-tauri/src/) ─▼─────────────────────────┐
│ commands/   thin #[tauri::command] handlers                 (Facade)              │
│ app/        window coordinator, tray, trigger               (Mediator)            │
│ services/   lookup, progress repository, settings                                 │
│ platform/   traits + macos/ (+ linux/) implementations      (Bridge + Adapter)    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Tauri 2 best practices we follow

| Practice                             | How                                                                                                                                                                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Least privilege                      | One capability file per window (`main`, `popover`) that grants only the commands and plugin permissions that window uses. A strict CSP (the scaffold has `csp: null`, which we replace).                    |
| Typed IPC                            | `tauri-specta` generates TS bindings for commands and events from Rust, so no string channels. (Check its release status when we reach the IPC step; fallback: hand-written typed wrappers in `platform/`.) |
| Thin commands                        | Commands parse input, call a service and map errors. No logic in them.                                                                                                                                      |
| Errors as values                     | Commands return `Result<T, AppError>`. `AppError` uses `thiserror`, is serializable and has a `kind`, so the frontend can handle it. No `unwrap()` outside tests and setup.                                 |
| State                                | Services are registered with `app.manage()` and received as `State<'_, T>`. Mutable state goes behind `Mutex`/`RwLock`, with locks held as briefly as possible.                                             |
| Threads                              | AppKit and AX calls that need the main thread go through `run_on_main_thread`. Slow work (AX menu walk, SQLite) runs in async commands or `spawn_blocking`, never on the UI thread.                         |
| Official plugins for solved problems | `single-instance` (registered first), `autostart`, `global-shortcut`, `store`, `opener`, `positioner`, `log`.                                                                                               |
| Platform code isolated               | `#[cfg(target_os = "macos")]` only inside `platform/`. Everything else sees traits.                                                                                                                         |
| Structure                            | `main.rs` only calls `lib::run()`. `lib.rs` builds the app from modules.                                                                                                                                    |
| Quality gates                        | `cargo fmt`, `cargo clippy -- -D warnings`, `cargo test`.                                                                                                                                                   |

## 4. Vue 3 best practices we follow

| Practice                                 | How                                                                                                                                           |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `<script setup lang="ts">`               | Everywhere, with typed `defineProps`/`defineEmits`/`defineModel`. No Options API and no `this`.                                               |
| Strict TypeScript                        | Every strictness flag TypeScript offers (`tsconfig.json`) plus `strictTemplates` for templates. `vue-tsc --build` in `pnpm check`.            |
| Presentational vs. container components  | `components/` only take props and emit events. `features/*` wire stores and composables to them.                                              |
| Composables for stateful, reusable logic | `useKeyCapture()` owns its listeners and cleans them up in `onScopeDispose`, replacing the manual `new Keyboard()` + `destroy()`.             |
| Pinia setup stores                       | State as `ref`, derived values as `computed`, actions as functions. Stores call `platform/`, never `invoke` directly.                         |
| `computed` over `watch`                  | Derived state (progress, due counts, recent apps) is computed from store state, so reactivity keeps the UI correct instead of route remounts. |
| No global properties                     | Replace `$db` and `$key` with imports or `inject`.                                                                                            |
| Router                                   | Typed route names and params, lazy-loaded feature routes, and per-route `meta.depth` for transitions.                                         |
| Styles                                   | SCSS with the old design tokens as CSS custom properties, scoped styles per component, one global `styles/` entry.                            |
| Linting and formatting                   | ESLint for quality (`eslint-plugin-vue`, `typescript-eslint` strict, `eslint-plugin-functional`, import boundaries), Prettier for formatting. |

## 5. Design patterns: where and why

Each entry names the problem in the old app (see legacy-architecture.md), the pattern and the module.

The catalog describes patterns with classes. The intent of a pattern carries over to functional code, and its form gets simpler:

| Pattern                 | Functional form in this repo                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| State                   | Discriminated union of states + pure `update(model, msg) → { model, effects }` (§1.1)                   |
| Command                 | A message: a discriminated union of plain data (`{ type: 'skip', roll, at }`), interpreted by an update |
| Strategy                | A function (or record of functions) passed as an argument                                               |
| Chain of Responsibility | An array of rule functions, evaluated in order until one decides                                        |
| Adapter, Facade         | A module or factory function that returns a record of functions                                         |
| Abstract Factory        | A function that returns a matching record of implementations                                            |
| Observer                | Vue reactivity (`computed`, `watch`) and Tauri event listeners                                          |
| Memento                 | Immutable snapshots; restoring is a pure function of the snapshot                                       |

Rust stays idiomatic Rust: traits for the Bridge and Adapter patterns, structs for state, and a functional leaning (immutability by default, iterators, `Result`, pure functions where possible).

### 5.1 Used

**State: practice session** (`domain/practice/session.ts`, an Elm model, §1.1)

- _Problem:_ `TestRoute` and `ReviewRoute` each spread their own copy of the same flow over boolean flags (`success`, `isFailed`, `testFailed`, `isTest`, `timeout`). Invalid combinations are possible.
- _Pattern:_ each phase is an explicit state: `presenting` (training or testing, with the first mistake of a test), `succeeded` and `finished`. Each state defines which inputs it accepts.
- _TS form:_ a discriminated union plus a pure `updateSession(session, msg) → { model, effects }`, which is the idiomatic TypeScript version of the State pattern, instead of a class per state. Invalid states can't be represented, and the compiler checks that every state is handled.

**Command: session inputs, IPC, menu actions**

- Session inputs are messages (§1.1): `{ type: 'answer', keys, at }`, `{ type: 'skip', roll, at }`, `{ type: 'advance', roll, at }`. The component dispatches them, and the state machine interprets them, so tests can replay a whole session.
- Tauri commands and tray/app menu items map to named actions (`showPreferences`, `togglePopover`, `quit`) that the Rust window coordinator handles in one place.

**Strategy: what differs between learn and review**

- `NextItemStrategy`: `weightedBuckets` for learn (unseen 90 / trained 50 / learned 10, no immediate repeat) and `dueQueue` for review (ordered by `dueAt`, failed items requeued).
- `GradingStrategy`: the grade comes only from what was measured, never from the user's own estimate: a mistake → again, over 6 s → hard, a fast first try → easy, otherwise good.
- `Scheduler`: an FSRS implementation behind an interface, so the hand-written FSRS-5 and `ts-fsrs` are interchangeable, and tests can use a fixed scheduler.
- `KeyLabels`: ⌘⌥⇧⌃ on macOS, Super/Ctrl/Alt/Shift on Linux.
- Learn and review become the same session driven by different strategies. This replaces the duplicated route logic, and composition is preferred over a Template Method base class.

**Chain of Responsibility: shortcut policy and resolution**

- _Problem:_ two separate lists of forbidden shortcuts (`Keyboard.blockedShortcuts`, `OptionsOverlay.isAllowedShortcut`), and the current trigger is read only once.
- `ShortcutPolicy` is an ordered list of rules: `noDuplicateKeys → notModifierOnly → notReserved(reserved)`, where `reserved` is the platform's list plus the current trigger, and the recorder (step 7) adds `needsModifier` and `notAppStandard`. Each rule either passes (`undefined`) or returns a reason (`{ reason: 'reserved' }`), and `checkShortcut` returns the first one as a `Result`. The data health test, the practice filter and the shortcut recorder use the same chain with different rule sets, and the recorder can show _why_ it rejected a shortcut.
- Key resolution is a small chain as well: `value → withShift → withAlt → withShiftAlt → keep as code`.
- Rust frontmost-app detection: `frontmostApplication → topmost other window → none`.

**Adapter: foreign APIs to our interfaces**

- Rust `platform/macos/*` adapts NSWorkspace, AXUIElement and UCKeyTranslate to our traits and data types (`Keymap`, `MenuShortcut { title, keys, group }`).
- Frontend `platform/*` adapts the generated Tauri bindings to the domain ports (`ProgressRepository`, `SettingsRepository`).

**Bridge: features independent of the OS** (`src-tauri/src/platform/`)

- The abstraction side (lookup service, trigger, keymap service) works against the traits `ActiveApp`, `MenuReader`, `KeymapSource`, `ModifierHold` and `Permissions`. The implementation side is `macos/` now and `linux/` later.
- Both sides vary independently: adding Linux means no change to the lookup service.
- A `Capabilities` value (`{ menuShortcuts, holdModifier, activeApp }`) is sent to the UI once, so the UI hides what the platform can't do instead of branching on the OS.

**Abstract Factory: the platform family**

- `platform::current()` returns the matching set of implementations for the build target (chosen with `cfg`). The macOS `ActiveApp` never gets combined with a Linux `MenuReader`.

**Facade: simple entry points to subsystems**

- Frontend `platform/` is the only code that imports `@tauri-apps/api` or the generated bindings. Stores see `settings.load()`, `progress.saveRun()` and `lookup.onResult(cb)`.
- Rust `commands/` is a facade over the services for the frontend.

**Mediator: window coordination** (`src-tauri/src/app/coordinator.rs`)

- _Problem:_ the old `MenuBar` singleton knew the tray, the popover, the main window, the trigger, the store and focus handling all at once, and the windows sent each other messages.
- A `WindowCoordinator` receives events (tray click, trigger fired, popover blurred, "maximize", "preferences") and decides what happens: show or hide the popover, restore focus, show the main window, open options. Tray, trigger and windows only talk to the coordinator.

**Observer: change propagation**

- Tauri events (`keymap-changed`, `lookup-result`, `settings-changed`) with typed listeners that are removed on scope dispose.
- Inside the frontend: Vue reactivity and Pinia. This replaces the custom `Emitter` and the global `Event` bus.
- A keyboard layout change updates the `keymap` store, and everything computed from it re-resolves. Reloading the windows is no longer necessary.

**Repository (not in the catalog, the standard persistence pattern)**

- `ProgressRepository` (runs, cards, review log) and `SettingsRepository` interfaces in the domain. Production uses SQLite and the store plugin through Rust; tests use in-memory versions.

**Memento: resumable runs**

- A run's persisted state (`learnedIds`, and possibly skipped ones, see open decisions) is a snapshot of the session. `createSession(snapshot)` restores it, and `snapshot(session)` produces it. The session's internals stay private to the domain.

### 5.2 Considered and not used (for now)

| Pattern                      | Why not                                                                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Singleton                    | Hides dependencies and makes testing hard. This was the old app's main problem. Single instances come from injection instead (Tauri `manage`, Pinia, `provide`).                                                               |
| Template Method              | Learn and review differ by strategy, so composition is simpler than a base class.                                                                                                                                              |
| Builder (our own)            | Tauri already provides builders (`Builder`, `WebviewWindowBuilder`, `TrayIconBuilder`), which we use. For our data, object literals plus `defineApp()` are clearer. Test data builders may come later if fixtures get verbose. |
| Composite                    | Apps → sets → shortcuts is a fixed three-level hierarchy, and plain typed data with `computed` aggregates is enough. The AX menu tree is walked recursively in Rust without class hierarchies.                                 |
| Decorator, Proxy             | Caching resolved shortcuts per keymap is a `computed`. No wrapper objects are needed.                                                                                                                                          |
| Flyweight                    | About 630 shortcuts don't need memory tricks.                                                                                                                                                                                  |
| Prototype, Visitor, Iterator | No problem they would solve. Language features (spread, `for…of`, iterators) cover them.                                                                                                                                       |

## 6. Module sketch

```
src/
├─ domain/
│  ├─ keyboard/     keymap.ts (types), resolve.ts, policy.ts, labels.ts
│  ├─ shortcuts/    types.ts, defineApp.ts, shortcutId.ts
│  ├─ practice/     session.ts (Model, Msg, update), learn.ts, review.ts, grading.ts
│  ├─ scheduling/   scheduler.ts (port), fsrs.ts
│  ├─ progress/     types.ts, repository.ts (port), reconcile.ts
│  └─ shared/       result.ts (errors as values)
├─ data/apps/<id>/   index.ts, de.json
├─ platform/        tauri.ts (bindings), settings.ts, progress.ts, keymap.ts, lookup.ts, window.ts
├─ stores/          settings.ts, keymap.ts, catalog.ts, progress.ts
├─ composables/     useKeyCapture.ts, usePracticeSession.ts, useSpatialNav.ts
├─ features/        library/, learn/, review/, lookup/, settings/
├─ components/
├─ styles/
├─ router.ts, App.vue, main.ts
src-tauri/src/
├─ main.rs, lib.rs, error.rs
├─ commands/        settings.rs, progress.rs, keymap.rs, lookup.rs, window.rs
├─ app/             coordinator.rs, tray.rs, trigger.rs, windows.rs
├─ services/        lookup.rs, progress/ (sqlite + migrations)
└─ platform/        mod.rs (traits, Capabilities, current()), macos/, linux/
```

## 7. Testing strategy

- **Domain (Vitest):** keyboard resolution against a German keymap fixture, policy rules, shortcut IDs, session updates (replaying message sequences and checking their effects), strategies with fixed rolls, grading, FSRS against reference values, reconcile.
- **Data (Vitest):** a health test over all `data/apps` (duplicates, unknown key codes, message keys missing from or unused in `de`, several trigger keys, impossible shortcuts on the fixture layout).
- **Stores:** with in-memory repositories.
- **Rust (`cargo test`):** SQLite migrations, repository queries and keymap helpers. Platform adapters are covered by the manual smoke test.
- **Manual smoke test:** the checklist in `REWRITE.md` §9.
