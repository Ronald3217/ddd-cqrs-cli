# AGENTS.md — ddd-cqrs-cli

Portable DDD-CQRS scaffolding CLI. Generates complete hexagonal-architecture modules into any Node.js/TypeScript project.

## Quick Start

```bash
npm install
npm run build          # tsc + tsc-alias (rewrites @/* aliases)
npm run ddd-cqrs -- --help   # dev entry via tsx
```

## Commands

| Script | What it does |
|---|---|
| `npm run build` | Compile TS → dist/ + rewrite @/* aliases to relative |
| `npm run ddd-cqrs` | Dev CLI via tsx (no build needed) |
| `npx tsx src/Contexts/Scaffolding/Infrastructure/Cli/Index.ts` | Direct entry (bypasses npm flag swallowing) |

**No test script.** No vitest, jest, or test files. Zero tests.

## Architecture

Single DDD bounded context: **Scaffolding**.

```
src/Contexts/Scaffolding/
├── Domain/              # ModuleSpec, PieceSpec, FieldSpec, NamingRules, ScaffoldingError
├── Application/         # Build*Plan classes (pure data assembly, no side effects)
└── Infrastructure/
    ├── Cli/Index.ts     # Entry point (Commander, 5 subcommands)
    ├── FileWriter.ts    # Idempotent writer (--force, --dry-run)
    ├── ContainerUpdater.ts  # Regex-based DI container editor
    ├── ProjectLayout.ts     # CWD → package.json → config resolution
    └── Templates/           # 9 template files (Entity, Repository, Command, Query, etc.)
```

**Runtime dependency:** `commander` only.

## CLI Subcommands (v0.1.0)

- `ddd-cqrs gen module --name <Entity> [options]` — full 17-file module
- `ddd-cqrs gen command --module <M> --name <N>` — 2 files
- `ddd-cqrs gen query --module <M> --name <N>` — 2 files
- `ddd-cqrs gen controller --module <M>` — 2 files
- `ddd-cqrs gen schema --module <M>` — 1 file

Config: `ddd-cqrs.config.json` (keys: `contextRoot`, `defaultContext`, `containerPath`).

## Gotchas

- **`@/*` alias:** tsx resolves against wrong tsconfig when run from outside repo. Fix: `npx tsx --tsconfig <repo>/tsconfig.json <entry> <args>`
- **npm flag swallowing:** `npm run ddd-cqrs -- --version` may eat flags. Use direct tsx entry instead.
- **`dist/` not in git:** Must `npm run build` before using the published binary.
- **Container files written before existence check:** Module files persist even if `--container` points to missing file.
- **No `dev` branch:** Project uses `main` directly.
- **docs/ is gitignored:** Local working notes, not distributable.

## CodeGraph

Indexed. Use `CODEGRAPH_COMMANDS.txt` for full reference.

```bash
# From repo root
codegraph node BuildModulePlan
codegraph query "template"

# From PROJECT_EXAMPLE
Set-Location docs/PROJECT_EXAMPLE
codegraph node DomainEventSubscriber
```

## Project Example

`docs/PROJECT_EXAMPLE/` contains a full copy of the reference backend (adlinksmanager-backend):
- `src/` (181 files), `tests/` (94 files), `public/` (11 files)
- Root configs: package.json, tsconfig.json, vitest.config.ts, Dockerfile, docker-compose.yaml
- Has its own `.codegraph/` index — queryable with `workdir` param or `Set-Location`

## Backend Reference Docs

`docs/backend-reference/` contains source-of-truth patterns from adlinksmanager-backend:
- `07_DOMAIN_EVENTS.md` — event subscriber patterns
- `12_ESTRUCTURA.md` — module template structure
- `17_INMEMORY_BUSES.md` — bus implementations
- `99_CODE_STYLE_FULL.md` — full style guide
- `EXPLORATION_FULL_PROJECT.md` — annotated project exploration
- `BASE_PROMPT.md` — module generation template

**The backend is the source of truth.** These files are copies.

## Roadmap

- Phase 0 ✅ (v0.1.0): gen module/command/query/controller/schema
- Phase 1: gen value-object/error/entity — atomic domain pieces
- Phase 2: gen event/subscriber — event chain
- Phase 3: gen service/repository — infrastructure pieces
- Phase 4: init — greenfield bootstrap (kernel ~64 files). **Blocks v0.2.x release.**

## Release Rule

NO 0.2.x published until `init` (Phase 4) is implemented.
