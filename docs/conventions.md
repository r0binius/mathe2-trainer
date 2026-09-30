# Conventions

How code in this repo is written. Most of it is enforced by tooling; the rest is checked in review. `pnpm check` runs every check (see the README).

## Paradigm: functional first

The frontend has two zones with different rules (see [architecture.md](architecture.md) §1):

| Rule                                      | Functional core `src/domain` | Imperative shell (the rest of `src`)        | Enforced by                            |
| ----------------------------------------- | ---------------------------- | ------------------------------------------- | -------------------------------------- |
| No classes, no `this`                     | ✓                            | ✓                                           | `functional/no-classes`, …             |
| No `let`, no loops                        | ✓                            | ✓                                           | `functional/no-let`, …                 |
| No mutation of data                       | ✓                            | ✓, except writing a Vue ref (`x.value = …`) | `functional/immutable-data`            |
| Readonly parameters                       | deep                         | shallow                                     | `functional/prefer-immutable-types`    |
| No side-effect statements                 | ✓                            | –                                           | `functional/no-expression-statements`  |
| Every function returns a value            | ✓                            | –                                           | `functional/no-return-void`            |
| No `throw`/`try`: errors are values       | ✓                            | –                                           | `functional/no-throw-statements`, …    |
| `if` only when every branch returns       | ✓                            | –                                           | `functional/no-conditional-statements` |
| No framework imports (Vue, Pinia, Tauri)  | ✓                            | –                                           | `no-restricted-imports`                |
| Only `src/platform` imports `@tauri-apps` | –                            | ✓                                           | `no-restricted-imports`                |

In practice:

- **Transform, don't mutate.** Use `map`, `filter`, `reduce`, `flatMap`, spread and `toSorted()`. Write new objects instead of changing existing ones.
- **Readonly types.** Declare data types with `readonly` properties and `readonly T[]`, and prefix them with `Readonly…` or `Immutable…` when the type-declaration rule asks for it.
- **Errors are values.** Domain functions that can fail return a `Result` (a discriminated union of `ok` and `err`) and never throw. The shell decides how to show or log the error.
- **Inject dependencies.** A function that needs time, randomness, a keymap or a repository receives it as a parameter or in a command's data (`now: Date`, `{ type: 'advance', roll: 0.42 }`), never by calling `Date.now()` or `Math.random()`. This keeps functions pure and tests deterministic.
- **Side effects at the edges.** Timers, IPC, DOM listeners and logging live in `platform/`, stores, composables and components, never in the domain.
- **An escape hatch needs a reason.** If a rule really doesn't fit, disable it on that line with an explanation: `// eslint-disable-next-line <rule> -- <why>`.

## Clean code

- **Small functions with one job.** Cyclomatic complexity of at most 10, nesting depth of at most 3 (enforced).
- **At most 3 parameters** (enforced). Beyond that, pass one named object. Avoid boolean flag parameters; write two functions instead.
- **Named functions are `function` declarations** (enforced). Arrow functions are for inline callbacks only.
- **Names say what, not how.** Functions are verbs (`resolveKeys`, `gradeAnswer`), data is nouns (`keymap`, `dueCards`), booleans read as questions (`isLearned`, `hasModifier`). No abbreviations except well-known ones (`id`, `url`).
- **Name by domain role, not by pattern:** `shortcutPolicy`, not `validationChain`.
- **Named constants instead of magic numbers:** `const SUCCESS_PAUSE_MS = 1000`.
- **Comments explain why, not what.** Code that needs a "what" comment should be renamed or split instead. Doc comments follow each language's own standard (see [Documentation](#documentation)).
- **Exhaustive by construction.** Model variants as discriminated unions, and `switch` on them exhaustively (enforced), so a new variant is a compile error everywhere it matters.
- **No dead code, no commented-out code.** Git remembers it.

## TypeScript

- Every strictness flag is on (`tsconfig.json`), including `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` and `strictTemplates` for Vue templates.
- **Only erasable syntax** (`erasableSyntaxOnly`): no `enum`, `namespace` or parameter properties. Use string literal unions and `as const` objects instead of enums.
- `type` instead of `interface` (enforced).
- `import type` for type-only imports (enforced).
- Explicit return types on exported functions (enforced). Inference is fine inside modules.
- No `any`, no non-null assertions (`!`), no unchecked casts (`as`). Narrow with type guards instead.
- Boolean conditions must be booleans (`strict-boolean-expressions`): write `text !== ''` rather than `text`. Nullable objects may be checked directly.

## Modules and files

- **Named exports only.** Vue components are the exception, because SFCs have a default export by nature.
- **No barrel files** (`index.ts` that only re-exports). Import from the module that defines the thing.
- Imports are sorted automatically (`simple-import-sort`).
- **File names:** `camelCase.ts` for modules, `PascalCase.vue` with multi-word names for components (`KeyCap.vue`, not `Key.vue`), and tests next to their module as `name.test.ts`.
- **The `@/` alias** for imports across folders. Relative imports only within a folder or within one domain module.

## Vue

- `<script setup lang="ts">` in the order script, template, style (enforced).
- Type-based `defineProps`/`defineEmits`, typed `ref<T>()`, and `useTemplateRef` (enforced).
- **Presentational components** (`components/`) get data through props and report through events. **Feature components** (`features/`) connect stores and composables.
- **Templates stay declarative.** Anything beyond a simple expression becomes a `computed`.
- Prefer `computed` over `watch`. A `watch` is for side effects only.

## Rust

The Rust code follows three references, [High Assurance Rust](https://highassurance.rs/) weighing most, then [Canonical's Rust best practices](https://canonical.github.io/rust-best-practices/) and [Rust Design Patterns](https://rust-unofficial.github.io/patterns/). Where they leave a choice or disagree, the rule below decides.

- `cargo fmt` formats, and `cargo clippy` runs with `pedantic` and `-D warnings` (on the command line, not `#![deny(warnings)]`).
- **Few runtime failures:** no overflowing arithmetic, `as` casts or panicking indexing (Clippy's `arithmetic_side_effects`, `as_conversions`, `indexing_slicing`). Use `checked_*`, `From`/`TryFrom` and `.get()`. Tests may slice.
- Nesting depth of at most 3, as in TypeScript: Clippy's `excessive_nesting` with the threshold in `src-tauri/clippy.toml`. It counts nested blocks (closures, `if`, `match`, loops), not struct literals or tuples, so data can still be written out in its own shape.
- **No `unwrap()`** (denied everywhere). Outside tests, `expect()` only where failure is a bug, with a message saying why it can't happen. Tests `expect` with a message saying what must hold instead of returning `Result`, so a failure points at its line.
- **`unsafe` lives in one small module per foreign API** (`platform/macos/carbon.rs`), which opts in with `#![expect(unsafe_code, reason = …)]` and offers only safe functions. Each `unsafe` block does one unsafe operation and has a `// SAFETY:` comment (both enforced by Clippy).
- **Invariants in types:** an API that only works on the main thread is a method of a capability that holds objc2's `MainThreadMarker` (`TextInputSources`), made once where a command comes in.
- **The webview is untrusted:** what it sends is decoded into newtypes (`ShortcutId`, `LayoutId`, `EpochMillis`) and checked types (`Card`) through serde's `try_from`, with the frontend decoders' rules. Rows read back from the database are wrapped as stored (`stored`), so the frontend can skip a row that no longer fits.
- **Errors:** `Result<T, AppError>` with `thiserror`. A variant that wraps an error keeps it in a `source` field; one that doesn't says why in a `reason` field. Messages are lowercase and start with "cannot". Errors from other crates are converted where they occur. Commands return errors to the frontend and never panic.
- **Row writers name every field:** they destructure the record exhaustively and bind named SQL parameters (`:app_id`), so a new field fails to compile until it's stored.
- **Modules:** a module with files of its own has a `mod.rs`. `lib.rs` and every `mod.rs` only declare modules and re-export (`pub use self::…`), with `#[cfg]`-gated items last.
- **Canonical's style:** derives list `Copy` first, then std traits, then other crates' traits, each alphabetically; imports come in three groups (std, other crates, `self`/`super`/`crate`); an `impl` block follows its type; a function returning `Result<()>` ends in `x?; Ok(())`; no method calls on a closing `}`; no `|&x|` patterns; struct literals take plain bindings. Hex is lowercase, except where it copies Apple's headers (`kVK_…`).
- Lint exceptions use `#[expect(…, reason = "…")]`, never a bare `#[allow]`.
- Prefer immutable bindings, iterators over index loops, and small pure functions. Keep OS calls in `platform/`.
- **Dependencies:** `pnpm rust:audit` (`cargo-deny`, `src-tauri/deny.toml`) checks the macOS dependency tree for advisories, yanked releases, licenses and sources. Run it after `cargo update` and before a merge.

## Documentation

Each language documents code its own standard way, so editors and doc tools pick it up.

- **TypeScript: [TSDoc](https://tsdoc.org/).** Every exported function, type and constant gets a `/** … */` comment (enforced by `eslint-plugin-jsdoc` with its TSDoc preset). It starts with a one-sentence summary, followed by details if needed. Types live in the signature, never in the comment: no JSDoc `{type}` annotations. Use `@param` and `@returns` only when they add something the names and types don't say. Use `@example` for non-obvious usage and `@see` for references, such as the legacy behaviour a function reproduces.
- **Vue:** document props, emits and models with TSDoc on the members of the type passed to `defineProps`/`defineEmits`/`defineModel`, so Vue's language tools show them where the component is used.
- **Rust: [rustdoc](https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html).** `///` on public items and `//!` for crate and module docs (enforced by the `missing_docs` lint), with a summary line first. Standard sections where they apply: `# Errors` (enforced by Clippy), `# Panics`, `# Safety` on `unsafe fn`, and `# Examples`. Link to other items with intra-doc links (``[`AppError`]``). An `unsafe` block gets a `// SAFETY:` comment (enforced by Clippy).
- **Inline comments** (`//`) explain why: constraints, legacy quirks, workarounds. They never narrate the code.
- **Tests document through their names:** `describe`/`it` read as a spec, and there are no doc comments on test cases.
- **Markdown** docs live in `docs/`, and the README only introduces the project and links to them.

## Formatting

Prettier formats TypeScript, Vue, CSS, JSON and Markdown, and rustfmt formats Rust. Prettier uses its defaults except for single quotes and 100 columns (the `prettier` key in `package.json`); rustfmt uses its defaults. Formatting is never discussed in review.

## Git

Enforced by git hooks (`.config/lefthook.yml`), which `pnpm install` sets up.

- **Commits** follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/#specification), checked by commitlint (`@commitlint/config-conventional`): `<type>[(scope)][!]: <description>`, with types `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci`, `chore` and `revert`. The scope is optional and names the area (`domain`, `ui`, `platform`, `rust`, …). Breaking changes use `!` or a `BREAKING CHANGE:` footer.
- **Branches** follow [Conventional Branch](https://conventionalbranch.org): `<type>/<description>` with `feature/`, `fix/`, `hotfix/`, `release/` or `chore/`, in lowercase letters, digits and single hyphens (dots only in versions, like `release/v1.2.0`).
- **One branch per step.** Nothing is committed directly on `main`; the pre-commit hook rejects it.
- **Merging** is rebase / fast-forward only, so every conventional commit lands on `main` unchanged and the history stays linear.
- `pnpm check` passes before every commit.
