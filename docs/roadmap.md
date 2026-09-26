# Roadmap

The rewrite is built in small steps, and building it is also a way to learn: functional TypeScript, Rust and macOS APIs, Tauri and Vue architecture, and test-driven development.

## How a step works

1. **Learn:** read the concepts and resources listed for the step, then Claude explains them using this project's code.
2. **Decide:** go through the step's open decisions. Claude recommends an option; you decide.
3. **Build:** on a branch named per [Conventional Branch](https://conventionalbranch.org), e.g. `feature/keyboard-domain`.
   - **You write** the pure domain code and its tests, test first: write a failing test, make it pass, refactor. A step's first function starts from a test Claude writes as a worked example.
   - **Claude writes** the plumbing (config, IPC, Rust FFI, data porting) and walks you through it.
   - **Claude reviews** your code the way a senior developer would: it points out issues, explains why, and gives hints before solutions. It doesn't rewrite your code unless you ask.
4. **Check:** `pnpm check` passes.
5. **Commit and merge:** Conventional Commits, then a fast-forward into `main`.
6. **Log:** add a short _What we learned_ section to the step below.

Status: ✅ done · 🚧 in progress · ⏳ planned

---

## 1. Foundation ✅

Tooling, strict configuration, docs and git conventions.

**What we learned**

- **Strictness pays off immediately.** `exactOptionalPropertyTypes` caught `hmr: undefined` in the scaffold's Vite config: leaving a property out and setting it to `undefined` are different things.
- **Functional rules need zones.** A pure core can ban every side effect, but the shell (UI, IPC) exists to cause side effects. The lint config applies different rules to `src/domain` and the rest of `src`.
- **Supply-chain cooldowns.** pnpm 12 won't install releases younger than a day. Cargo has no such rule, so crates that belong together (the Tauri family) have to be pinned by hand, in dependency order.
- **The toolchain decides "latest".** TypeScript 7 is released, but typescript-eslint and vue-tsc can't use it yet, so 6.0 is the newest version that works here.
- **Know which tool owns which file.** The Tauri CLI rewrites the `tauri` dependency in `Cargo.toml` to sync its `features`. Trimming it by hand only creates churn.
- **Git commits the index, not the working tree.** That makes it possible to commit a partial change while the working tree holds the final state, which is how commit 2 was made after the `pnpm exec` sync uninstalled commitlint mid-hook.
- **Environment:** tools need to be on the PATH of every shell. rustup's `~/.cargo/env` has to be sourced, typically from `~/.zshenv`.

## 2. Domain: keyboard and shortcuts ⏳

Branch `feature/keyboard-domain`. The pure core that turns shortcut definitions into keys for the current keyboard layout, with no Tauri, no Vue and no native code.

**Deliverables**

- `domain/shared/result.ts`: errors as values
- `domain/keyboard/`: keymap types and the ISO swap, key resolution (a chain: value → Shift → AltGr → Shift+AltGr → code), modifier ordering, `shortcutPolicy` (a chain of rules), key labels
- `domain/shortcuts/`: types, `defineApp`, legacy-compatible `shortcutId`
- `data/apps/*.ts`: the 10 apps ported and typed
- Tests: resolution against German and US keymap fixtures, policy rules, shortcut IDs against real IDs from the old `config.json`, and a data health test over all apps

**Decisions**

- `Result`: our own small type (recommended) or a library (`neverthrow`, Effect)
- Collection helpers: native array methods (recommended) or `remeda`
- SHA-256 for `shortcutId`: `@noble/hashes`, which is synchronous and keeps `shortcutId` a plain pure function, or the built-in Web Crypto API, which is asynchronous and makes everything that uses the ID async
- Fixtures: dump the German and US keymaps and a sample of shortcut IDs from the old app

**Who writes what**

- You: `Result`, key resolution, `shortcutPolicy`, `shortcutId`, the data health test, and all their tests
- Claude: the first test as a worked example, the fixture dumps, `defineApp` and its types (designed together), porting the app data, reviews

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

## 3. Domain: practice and scheduling ⏳

Branch `feature/practice-session`. The practice flow shared by learn and review, as a state machine, plus FSRS scheduling.

**Deliverables:** the practice session (State + Command as a reducer), the next-item strategies (weighted buckets for learn, due queue for review), grading, the `Scheduler` port with FSRS, run snapshots (Memento), and `reconcileProgress`.

**Decisions:** keep the hand-written FSRS-5 or switch to `ts-fsrs`; whether skipped shortcuts survive across sessions; whether to use a pattern-matching library (`ts-pattern`) or plain `switch`.

**Who writes what:** you write the reducer, the strategies, grading and reconcile, test first. Claude brings in FSRS (port or library) and reviews.

**Concepts:** state machines and reducers, injecting randomness and time for determinism (seeded random numbers), property-style tests, spaced repetition.

**Resources:** [statecharts.dev](https://statecharts.dev/) · [refactoring.guru: State, Command, Strategy, Memento](https://refactoring.guru/design-patterns/catalog) · [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm) · [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) · [ts-pattern](https://github.com/gvergnaud/ts-pattern) · [legacy-architecture.md](legacy-architecture.md) §8–9

## 4. Persistence and IPC ⏳

Branch `feature/persistence`. Settings and progress stored by Rust and reached through a typed platform facade.

**Deliverables:** the Rust `AppError`, a settings store, a SQLite progress repository with migrations, typed commands and events (`tauri-specta` if it's stable), the `platform/` facade, and Pinia stores.

**Decisions:** SQLite or JSON for progress; whether `tauri-specta` is ready; the settings schema (`trigger` as a union).

**Who writes what:** you write Rust commands and repository queries, and the Pinia stores. Claude writes the migrations setup, the typed-bindings plumbing and the facade skeleton, and reviews.

**Concepts:** Rust ownership and borrowing, `Result` and `?`, traits, `thiserror`; the Tauri process model, commands, state management and capabilities; Pinia setup stores; ports and adapters.

**Resources:** [Rust book: Ownership](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html), [Error handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html), [Traits](https://doc.rust-lang.org/book/ch10-02-traits.html) · [Rust by Example](https://doc.rust-lang.org/rust-by-example/) · [thiserror](https://docs.rs/thiserror/latest/thiserror/) · [rusqlite](https://docs.rs/rusqlite/latest/rusqlite/) · [Tauri process model](https://tauri.app/concept/process-model/), [IPC](https://tauri.app/concept/inter-process-communication/), [Calling Rust](https://tauri.app/develop/calling-rust/), [State management](https://tauri.app/develop/state-management/), [Capabilities](https://tauri.app/security/capabilities/) · [tauri-specta](https://github.com/specta-rs/tauri-specta) · [Pinia](https://pinia.vuejs.org/core-concepts/)

## 5. Main window UI ⏳

Branch `feature/main-window`. The library, sets, set detail, learn, review and options screens, with transitions and keyboard navigation.

**Deliverables:** presentational components (`KeyCap`, `BaseButton`, `CircleProgress`, …), feature routes, composables (`useKeyCapture`, `usePracticeSession`, `useSpatialNav`), styles ported from the old app.

**Decisions:** spatial navigation (library or our own composable); design tokens as CSS custom properties; UI language (English UI with German shortcut titles, or i18n).

**Who writes what:** you write the composables and feature components. Claude ports the styles and the presentational components, and reviews.

**Concepts:** Vue reactivity (`ref`, `computed`, `watch`), composables and effect cleanup, presentational vs. container components, typed props and emits, the router.

**Resources:** [Vue: Reactivity in depth](https://vuejs.org/guide/extras/reactivity-in-depth.html) · [Composables](https://vuejs.org/guide/reusability/composables.html) · [TypeScript with the Composition API](https://vuejs.org/guide/typescript/composition-api.html)

## 6. Native keyboard layout ⏳

Branch `feature/native-keymap`. Read the current keyboard layout in Rust, replacing `native-keymap`.

**Deliverables:** the `KeymapSource` trait, a macOS implementation (`TISCopyCurrentKeyboardLayoutInputSource` + `UCKeyTranslate`), layout-change events, and output that matches the step 2 fixtures.

**Who writes what:** Claude writes the unsafe FFI bindings with `// SAFETY:` comments and walks you through them. You write the safe translation into our keymap type and the comparison tests against the fixtures.

**Concepts:** FFI and `unsafe`, `objc2`, Core Foundation memory rules, traits as ports (Bridge pattern).

**Resources:** [The Rustonomicon](https://doc.rust-lang.org/nomicon/) · [objc2](https://docs.rs/objc2/latest/objc2/) · [UCKeyTranslate](https://developer.apple.com/documentation/coreservices/1390584-uckeytranslate)

## 7. Menu bar popover and trigger ⏳

Branch `feature/popover`. Tray icon, popover window, hold ⌘ and global shortcut, window coordination, dock icon, autostart, single instance, and a strict CSP.

**Who writes what:** you write the `WindowCoordinator` (Mediator) logic. Claude writes the event tap and the plugin wiring.

**Concepts:** the Mediator pattern, macOS activation policy and focus handling, event taps, the Content Security Policy.

**Resources:** [Tauri system tray](https://tauri.app/learn/system-tray/) · [Tauri CSP](https://tauri.app/security/csp/) · [NSWorkspace.frontmostApplication](https://developer.apple.com/documentation/appkit/nsworkspace/frontmostapplication)

## 8. Menu shortcut lookup ⏳

Branch `feature/menu-lookup`. Read any app's menu shortcuts through the Accessibility API, and show them with search in the popover.

**Who writes what:** Claude writes the AX FFI. You write the recursive menu walk, the mapping into shortcut data, and the lookup feature.

**Concepts:** the Accessibility API and permissions, recursion over trees, matching apps by bundle ID.

**Resources:** [AXUIElement](https://developer.apple.com/documentation/applicationservices/axuielement_h)

## 9. Import and packaging ⏳

Branch `feature/electron-import`. Import settings and progress from the old app's `config.json`, then build the app.

**Who writes what:** you write the importer (an Adapter) with fixture tests. Claude writes the bundle config and signing.

## 10. Linux ⏳

Platform implementations for X11/Wayland, a UI driven by capabilities, and Linux key labels. Planned in detail once macOS is complete.
