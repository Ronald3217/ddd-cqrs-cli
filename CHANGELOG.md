# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
Roadmap (not yet implemented):
- [ ] `ddd-cqrs init` — bootstrap the Shared Kernel in a brand-new project.
- [ ] `--db` flag — select database (mongo/mysql/inmemory).
- [ ] `--http` flag — select HTTP framework (express/elysia/fastify).
-->

## [Unreleased]

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

<!--
[unreleased]: https://github.com/OWNER/ddd-cqrs-cli/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/OWNER/ddd-cqrs-cli/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/OWNER/ddd-cqrs-cli/releases/tag/v0.1.0
-->
