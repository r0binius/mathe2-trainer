# Mouseless

Keyboard shortcut training and look-up for macOS (Linux later). A rewrite of [ueberdosis/mouseless](https://github.com/ueberdosis/mouseless), an Electron app, with Tauri 2, Vue 3 and TypeScript.

## Motivation

The original Mouseless was abandoned about four years ago. I really like the idea, so I'm modernizing it with a new, current stack, and learning along the way.

## Docs

- [Architecture](docs/architecture.md): layers, best practices, design patterns
- [Conventions](docs/conventions.md): functional style, clean code, TypeScript, Vue and Rust rules
- [Roadmap](docs/roadmap.md): the steps, decisions and what we learned
- [Legacy architecture](docs/legacy-architecture.md): how the old app works and what the rewrite keeps
- [UML](docs/uml.drawio): components, classes, the practice session's states and three sequences, as a draw.io file (open it in draw.io or the VS Code draw.io extension)
- [Smoke test](docs/smoke-test.md): what to check by hand in the running app before a step is merged

## Requirements

- Node.js 24+ and pnpm (see `packageManager` in `package.json`)
- Rust (stable) via rustup
- Xcode Command Line Tools

## Scripts

| Command            | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `pnpm tauri dev`   | Run the app with hot reloading                            |
| `pnpm tauri build` | Build `Mouseless.app`, ad-hoc signed for this Mac         |
| `pnpm check`       | Run every check below; must pass before each commit       |
| `pnpm format`      | Format all files with Prettier (`format:check` to verify) |
| `pnpm lint`        | Lint with ESLint (`lint:fix` to apply fixes)              |
| `pnpm typecheck`   | Type-check with `vue-tsc`                                 |
| `pnpm test`        | Run unit tests with Vitest (`test:watch` while working)   |
| `pnpm rust:format` | Format Rust with rustfmt (`rust:format:check` to verify)  |
| `pnpm rust:lint`   | Lint Rust with Clippy                                     |
| `pnpm rust:test`   | Run Rust tests                                            |

## Editor

VS Code recommends the needed extensions (`.vscode/extensions.json`). Files are formatted with Prettier on save, and ESLint fixes are applied on save.

## Git

Commits follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) and branches follow [Conventional Branch](https://conventionalbranch.org). Git hooks installed by `pnpm install` check both. See [conventions](docs/conventions.md#git).

## License

[GPL-3.0-or-later](LICENSE). The app logos in `src/data/apps/*/logo.svg` belong to their owners and are not covered by this license.
