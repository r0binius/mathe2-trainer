# Mouseless

Keyboard shortcut training and look-up for macOS (Linux later). A rewrite of the Electron app in `../mouseless-old` with Tauri 2, Vue 3 and TypeScript.

## Docs

- [Architecture](docs/architecture.md): layers, best practices, design patterns
- [Conventions](docs/conventions.md): functional style, clean code, TypeScript, Vue and Rust rules
- [Roadmap](docs/roadmap.md): the steps, who writes what, and what we learned
- [Legacy architecture](docs/legacy-architecture.md): how the old app works and what must stay compatible

## Requirements

- Node.js 24+ and pnpm (see `packageManager` in `package.json`)
- Rust (stable) via rustup
- Xcode Command Line Tools

## Scripts

| Command            | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `pnpm tauri dev`   | Run the app with hot reloading                            |
| `pnpm tauri build` | Build the app bundle                                      |
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
