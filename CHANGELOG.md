# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
Roadmap (not yet implemented):
- [ ] `ddd-cqrs init` — bootstrap the Shared Kernel in a brand-new project (currently the CLI requires a project that already has the kernel).
- [ ] `gen module --events` — generate CRUD domain events and publish them from command handlers (design decisions still open in docs/events-flag-blueprint.md).
-->

## [Unreleased]

## [0.1.0] - 2026-08-14

### Added

- Portable DDD/CQRS scaffolding CLI (`ddd-cqrs`) with `gen` subcommands: `module`, `command`, `query`, `controller`, and `schema`.
- `gen module` generates a complete module (21 files by default) following the project's hexagonal layout: entity, repository interface, commands and queries with handlers, controller, router, Zod schemas, and MongoDB/MySQL/InMemory repository implementations.
- Module options: `--owned` (nested entity), `--no-admin` (skip admin commands/queries), `--fields`, `--context`, `--contexts-root`, `--force`, and `--dry-run`.
- `--container` wiring: updates the target project's dependency container (`ContainerUpdater`) — registers repositories, connects command/query handlers, and rebuilds the in-memory buses.
- npm package metadata for publishing (`files`, `prepublishOnly`) and MIT license.
- Detailed README covering usage, options, and architecture.

### Fixed

- Global Windows binary invoked through the npm shim failed silently (missing shebang); added `#!/usr/bin/env node` to the CLI entry so `ddd-cqrs` runs on Windows.

<!--
[unreleased]: https://github.com/OWNER/ddd-cqrs-cli/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/OWNER/ddd-cqrs-cli/releases/tag/v0.1.0
-->
