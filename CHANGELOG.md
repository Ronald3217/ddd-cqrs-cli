# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Updated documentation and CLI help to reflect that `gen module` generates 17 files (removed obsolete admin command and ownership references).

## [0.2.0] - 2026-08-18

### Added

- `ddd-cqrs init` — bootstrap a new project with Shared Kernel (~43 files).
  - `--name <project>` — project name for package.json.
  - `--target <dir>` — target directory (default: current directory).
  - `--context <ctx>` — bounded context name.
  - `--no-services` — skip optional services (Password, Token, Email).
- Atomic generators (Phase 1-3):
  - `gen entity` — Entity class.
  - `gen value-object` — Value Object class (primitive and object types).
  - `gen error` — Domain Error class.
  - `gen event` — Domain Event class.
  - `gen subscriber` — Domain Event Subscriber.
  - `gen service` — Domain Service interface + implementation.
  - `gen repository` — Repository interface + persistence implementations.
- `gen router` — separate Router generation (previously combined with controller).
- `--impl-name` flag for `gen service` — custom implementation class name.
- `--http <express,elysia>` flag for `gen controller` and `gen router`.
- `--db <mongo,mysql,inmemory>` flag for `gen repository`.
- Vercel serverless support in generated Start.ts.

### Changed

- Version bumped to 0.2.0.
- Updated help documentation with all new commands and examples.

## [0.1.1] - 2026-08-14

### Added

- `ddd-cqrs help` — centralized help output showing all available commands, parameters, and examples.
- `AGENTS.md` — project conventions, architecture, and gotchas for AI assistants.
- ROADMAP: planned `--db` flag for database selection (mongo/mysql/inmemory).
- ROADMAP: planned `--http` flag for framework selection (express/elysia/fastify).

### Changed

- Simplified template signatures — removed `owned` parameter from all generators.
- Updated `.gitignore` to exclude `.codegraph/`, `*.tgz`, and `CODEGRAPH_COMMANDS.txt`.
- Updated `README.md`.

### Removed

- `--owned` flag from `gen module` — ownership is now a domain concern, not a scaffolding concern.

## [0.1.0] - 2026-08-14

### Added

- Portable DDD/CQRS scaffolding CLI (`ddd-cqrs`) with `gen` subcommands: `module`, `command`, `query`, `controller`, and `schema`.
- `gen module` generates a complete module (21 files by default) following the project's hexagonal layout: entity, repository interface, commands and queries with handlers, controller, router, Zod schemas, and MongoDB/MySQL/InMemory repository implementations.
- Module options: `--no-admin` (skip admin commands/queries), `--fields`, `--context`, `--contexts-root`, `--force`, and `--dry-run`.
- `--container` wiring: updates the target project's dependency container (`ContainerUpdater`) — registers repositories, connects command/query handlers, and rebuilds the in-memory buses.
- npm package metadata for publishing (`files`, `prepublishOnly`) and MIT license.
- Detailed README covering usage, options, and architecture.

### Fixed

- Global Windows binary invoked through the npm shim failed silently (missing shebang); added `#!/usr/bin/env node` to the CLI entry so `ddd-cqrs` runs on Windows.

[unreleased]: https://github.com/Ronald3217/ddd-cqrs-cli/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Ronald3217/ddd-cqrs-cli/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/Ronald3217/ddd-cqrs-cli/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Ronald3217/ddd-cqrs-cli/releases/tag/v0.1.0
