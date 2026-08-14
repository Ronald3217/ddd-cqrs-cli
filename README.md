# ddd-cqrs-cli

Portable DDD-CQRS scaffolding generator. One command generates a complete module — Domain, Application (Commands/Queries), and Infrastructure (Controller, Router, Zod schemas, repositories) — inside any Node.js/TypeScript project, without installing a single runtime dependency into it.

![npm version](https://img.shields.io/npm/v/ddd-cqrs-cli)
![License](https://img.shields.io/badge/license-MIT-blue)

The published binary is `ddd-cqrs` (package: `ddd-cqrs-cli`). TypeScript CommonJS, Node 22+, powered by Commander.

---

## Table of contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Usage — command reference](#usage--command-reference)
- [Fields syntax](#fields-syntax)
- [Configuration](#configuration)
- [What gets generated](#what-gets-generated)
- [Container wiring](#container-wiring)
- [Development](#development)
- [Publishing](#publishing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- **DDD + CQRS module scaffolding** — given an entity name, the CLI generates the full module: Domain (AggregateRoot entity + repository interface), Application (Create/Update/Delete commands, admin commands, queries), and Infrastructure (Express controller + router, Zod schemas, MongoDB/MySQL/InMemory repositories, Mongoose model).
- **Portable** — runs from *any* Node.js project: it walks up from the current directory looking for `package.json`, resolves a config file there, and generates files relative to that project root. It works in ANY project layout, not just a fixed one.
- **Zero runtime dependencies for the target project** — the CLI only installs `commander` for itself. Generated code imports your project's existing shared kernel (`@/Contexts/Shared`, express, zod, mongoose, sequelize) — the CLI generates files but never runs `npm install` in the target.
- **Admin handlers with `requesterId` + authorization stub** — `AdminUpdate`/`AdminDelete` commands carry `requesterId`, and their handlers include a `// TODO: authorize command.requesterId as an administrator` stub that you fill in with your project's authorization model.
- **Ownership opt-in** (`--owned`) — adds an `ownerId` field, `findAllByOwner()` on the repository interface and all implementations, a `GetOwned<Plural>` query + route, and ownership checks that throw `UnauthorizedError` in the `Update`/`Delete` handlers.
- **Container wiring** — optionally wires the generated handlers into an existing DI `Container` (imports, repository construction, handler instantiation, command/query bus registrations), with line-level idempotency.
- **Dry-run** (`--dry-run`) — prints the full generation plan and every container edit without touching the disk.
- **Idempotent writes** — existing files are left untouched (marked `=` in the output); `--force` overwrites them.
- **Strict validation** — PascalCase entity/context/action names, singular entity enforcement with singular suggestions, reserved and duplicate field rejection, and a typed field syntax.

## Requirements

- **Node.js 22+** for the CLI itself.
- The **target project** must:
  - Have a `package.json`. The CLI walks up from the current directory until it finds one; if none is found it fails with a clear error (see [Troubleshooting](#troubleshooting)).
  - Follow (or be willing to adopt) the `src/Contexts/<Context>/<Entity>` layout. Paths can be customized with `--contexts-root` or `contextRoot`.
  - Provide the DDD shared kernel and libraries the generated code imports: `@/Contexts/Shared` (AggregateRoot, DocumentId, DateTime, IdGenerator, Command/Query and their buses, errors like `NotFoundError`/`UnauthorizedError`/`DatabaseError`, the `auth` middleware, and the `CustomRequest` type), plus `express`, `zod`, `mongoose`, and `sequelize`. The CLI generates code that references these — it does **not** install or create them.

## Installation

The CLI can be used four ways. The command is always `ddd-cqrs` (the published binary name).

### 1. Global install

```bash
npm install -g ddd-cqrs-cli
```

`ddd-cqrs` is then available on your PATH:

```bash
ddd-cqrs gen module --name BlogPost --fields "title:string"
```

### 2. On-the-fly (no install)

Run it directly through `npx`, either by package name or binary name:

```bash
npx ddd-cqrs-cli gen module --name BlogPost --fields "title:string"
npx ddd-cqrs gen module --name BlogPost --fields "title:string"
```

### 3. Local devDependency (recommended for a project team)

```bash
npm install -D ddd-cqrs-cli
```

and add a script to your target project's `package.json`:

```json
{
  "scripts": {
    "ddd:gen": "ddd-cqrs gen module"
  }
}
```

then run:

```bash
npm run ddd:gen -- --name BlogPost --fields "title:string"
```

### 4. From source (this repository)

Install dependencies and use the dev script:

```bash
npm install
npm run ddd-cqrs -- gen module --name BlogPost --fields "title:string"
```

> **Windows / PowerShell gotcha:** `npm run` can swallow flags passed to the script (npm intercepts its own known flags before they reach the script, and argument forwarding through `cmd` is fragile). If flags get lost, call the entry point directly with `tsx`:

```bash
npx tsx src/Contexts/Scaffolding/Infrastructure/Cli/Index.ts gen module --name BlogPost --fields "title:string"
```

## Quick start

Create a brand-new project and scaffold a `Product` module into it.

```bash
mkdir shop && cd shop
npm init -y
npm i -D ddd-cqrs-cli
ddd-cqrs gen module --name Product --fields "title:string,views:number" --context Shop
```

The CLI walks up from `shop/`, finds `package.json`, and generates:

```
src/Contexts/Shop/Product/
├── Domain/
│   ├── Product.ts                          # AggregateRoot entity (id, title, views, createdAt, updatedAt)
│   └── ProductRepository.ts                # repository interface
├── Application/
│   ├── Commands/
│   │   ├── CreateProduct/                  # CreateProductCommand + CreateProductCommandHandler
│   │   ├── UpdateProduct/                  # UpdateProductCommand + UpdateProductCommandHandler
│   │   ├── DeleteProduct/                  # DeleteProductCommand + DeleteProductCommandHandler
│   │   ├── AdminUpdateProduct/             # AdminUpdateProductCommand + AdminUpdateProductCommandHandler
│   │   └── AdminDeleteProduct/             # AdminDeleteProductCommand + AdminDeleteProductCommandHandler
│   └── Queries/
│       └── GetProductById/                 # GetProductByIdQuery + GetProductByIdQueryHandler
└── Infrastructure/
    ├── ProductController.ts                # Express controller (command/query bus)
    ├── ProductRouter.ts                    # Express router
    ├── Schemas/
    │   └── ProductSchemas.ts               # Create/Update Zod schemas
    └── Persistence/
        ├── MongoDBProductRepository.ts
        ├── MySQLProductRepository.ts
        ├── InMemoryProductRepository.ts
        └── MongooseProductModel.ts
```

**21 files** with the default options. See [What gets generated](#what-gets-generated) for the exact count per option combination.

Before the module works end-to-end, you must still:

1. **Register the Sequelize model** (MySQL path): the generated `MySQLProductRepository` imports the model from your centralized `@/Contexts/Shared/Infrastructure/Persistence/sequelize`, so add a `Product` model there if you use MySQL.
2. **Wire the routes**: mount `ProductRouter(controller)` in your Express app.
3. **Provide the shared kernel**: `@/Contexts/Shared` (buses, `AggregateRoot`, errors, `auth` middleware, `CustomRequest`) must exist with the API the generated code expects.

Preview everything without writing anything:

```bash
ddd-cqrs gen module --name Product --fields "title:string" --context Shop --dry-run
```

## Usage — command reference

Run `ddd-cqrs --help`:

```
Usage: ddd-cqrs [options] [command]

Portable DDD-CQRS scaffolding generator

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  gen             Generate DDD-CQRS artifacts
  help [command]  display help for command
```

Every command shares a set of common options (`--context`, `--contexts-root`, `--container`, `--dry-run`, `--force`) plus command-specific ones. `ddd-cqrs gen` alone prints the `gen` help.

### Common options

| Option | Description | Default |
| --- | --- | --- |
| `--context <context>` | Bounded context name (PascalCase). | `MyContext`, or `defaultContext` from `ddd-cqrs.config.json` |
| `--contexts-root <dir>` | Directory that contains the contexts. Resolved against the project root. | `src/Contexts`, or `contextRoot` from `ddd-cqrs.config.json` |
| `--container <file>` | Container file to wire. Path is resolved against the project root. | none, or `containerPath` from `ddd-cqrs.config.json` |
| `--dry-run` | Show the generation plan and container edits without writing files. | `false` |
| `--force` | Overwrite existing files. | `false` |

### `ddd-cqrs gen module`

Generate a full module: Domain, Commands, Queries, Schemas, Persistence, Controller, Router — and wire the container.

```
Usage: ddd-cqrs gen module [options]

Options:
  --name <entity>        Entity name in PascalCase (e.g. BlogPost)       (required)
  --fields <fields>      Comma-separated fields as name:type             (default: "")
  --owned                Generate the owned pattern (ownerId field,
                         findAllByOwner, GetOwned<Plural> query and its route)
  --no-admin             Skip AdminUpdate/AdminDelete commands
  --context <context>
  --contexts-root <dir>
  --container <file>
  --dry-run
  --force
  -h, --help

Examples:
  $ ddd-cqrs gen module --name BlogPost --fields "title:string,views:number"
  $ ddd-cqrs gen module --name BlogPost --owned --no-admin --dry-run
```

### `ddd-cqrs gen command`

Generate a custom `Command` + `CommandHandler` into an existing module.

```
Usage: ddd-cqrs gen command [options]

Options:
  --module <entity>      Entity/module name in PascalCase               (required)
  --name <action>        Action name in PascalCase (e.g. Archive)       (required)
  --fields <fields>      Optional extra fields the command carries      (default: "")
  --context <context>
  --contexts-root <dir>
  --container <file>
  --dry-run
  --force
  -h, --help

Example:
  $ ddd-cqrs gen command --module BlogPost --name Archive --fields "reason:string"
```

Generates `Application/Commands/<Action><Entity>Command/<Action><Entity>Command.ts` and its `...CommandHandler.ts` (2 files). The generated handler loads the entity by id, throws `NotFoundError` if missing, and leaves a `// TODO` for your business logic.

### `ddd-cqrs gen query`

Generate a custom `Query` + `QueryHandler` into an existing module.

```
Usage: ddd-cqrs gen query [options]

Options:
  --module <entity>      Entity/module name in PascalCase               (required)
  --name <action>        Action name in PascalCase (e.g. SearchByTitle) (required)
  --fields <fields>      Optional fields the query carries              (default: "")
  --context <context>
  --contexts-root <dir>
  --container <file>
  --dry-run
  --force
  -h, --help

Example:
  $ ddd-cqrs gen query --module BlogPost --name SearchByTitle --fields "title:string"
```

Generates `Application/Queries/<Action><Entity>Query/<Action><Entity>Query.ts` (with a `<Action><Entity>QueryResponse`) and its `...QueryHandler.ts` (2 files).

### `ddd-cqrs gen controller`

Generate only the Controller and Router for an existing module (e.g. to regenerate after changing options).

```
Usage: ddd-cqrs gen controller [options]

Options:
  --module <entity>      Entity/module name in PascalCase               (required)
  --fields <fields>      Field list used to build command arguments    (default: "")
  --owned
  --no-admin
  --context <context>
  --contexts-root <dir>
  --container <file>
  --dry-run
  --force
  -h, --help

Example:
  $ ddd-cqrs gen controller --module BlogPost --owned
```

Generates `Infrastructure/<Entity>Controller.ts` and `Infrastructure/<Entity>Router.ts` (2 files). No container wiring is produced for this command.

### `ddd-cqrs gen schema`

Generate only the Zod `Create`/`Update` schemas for an existing module.

```
Usage: ddd-cqrs gen schema [options]

Options:
  --module <entity>      Entity/module name in PascalCase               (required)
  --fields <fields>      Field list the schemas validate                (default: "")
  --context <context>
  --contexts-root <dir>
  --container <file>
  --dry-run
  --force
  -h, --help

Example:
  $ ddd-cqrs gen schema --module BlogPost --fields "title:string,views:number"
```

Generates `Infrastructure/Schemas/<Entity>Schemas.ts` (1 file).

### Global options

| Option | Description |
| --- | --- |
| `-h, --help` | Display help for the current command (also shown automatically after a usage error, with the hint `(add --help for usage)`). |
| `-V, --version` | Print the CLI version (`0.1.0`). |

## Fields syntax

Fields are a comma-separated list of `name:type` pairs:

```bash
--fields "title:string,views:number,featured:boolean,publishedAt:Date,tags:string[]"
```

### Types

| Type | Entity property (TS) | Zod schema | Mongoose type |
| --- | --- | --- | --- |
| `string` | `string` | `z.string().min(1, '<Label> is required')` | `String` |
| `number` | `number` | `z.number()` | `Number` |
| `boolean` | `boolean` | `z.boolean()` | `Boolean` |
| `Date` | `Date` | `z.coerce.date()` | `Date` |
| `string[]` | `string[]` | `z.array(z.string())` | `[String]` |

Any other type is rejected: `Invalid type "foo" for field "title" (valid types: string, number, boolean, Date, string[])`.

### Field names

- Must be **camelCase** (e.g. `title`, `itemsPerPage`).
- **Reserved, always rejected:** `id`, `createdAt`, `updatedAt` — these are generated automatically.
- **Reserved with `--owned`:** `ownerId` — also generated automatically.
- **Duplicates are rejected** — `Duplicate field name "title" in --fields (each field must appear once)`.
- A field must be exactly `name:type` — more or fewer than two `:`-separated parts fail with `Invalid field at position N: "raw" (expected name:type, e.g. title:string)`.

### Naming rules

- **Entity and context names must be PascalCase** (no spaces or accents): `--name BlogPost`, `--context MyContext`.
- **Entity names must be singular.** The CLI rejects anything that looks plural and suggests the singular:

  | Input | Result |
  | --- | --- |
  | `Products` | error → use `Product` |
  | `Categories` | error → use `Category` |
  | `Boxes` | error → use `Box` |
  | `Status`, `Class`, `Bus`, `Analysis` | **allowed** — endings `ss`, `us`, `is` are treated as singular |

  Singular suggestion logic: `...ies` → `...y`; `...es` → drop `es`; otherwise drop the trailing `s`.
- **Pluralization** for query names and route collections: `...y` (after a consonant) → `...ies`; endings `s, x, z, ch, sh` → `...es`; otherwise append `s`.

## Configuration

Place a `ddd-cqrs.config.json` in the **project root** (where `package.json` lives) to set reusable defaults:

```json
{
  "contextRoot": "src/Contexts",
  "defaultContext": "Shop",
  "containerPath": "src/Contexts/Shop/Container.ts",
  "ownership": true
}
```

| Key | Type | Default | Used when |
| --- | --- | --- | --- |
| `contextRoot` | string | `src/Contexts` | `--contexts-root` not passed |
| `defaultContext` | string | `MyContext` | `--context` not passed |
| `containerPath` | string | none | `--container` not passed |
| `ownership` | boolean | `false` | `--owned` not passed |

Precedence: **CLI flags > config file > built-in defaults**.

Notes:

- The legacy filename `.ddd-cqrs.json` is also read if `ddd-cqrs.config.json` is absent.
- If the file is not valid JSON, the CLI prints `[ddd-cqrs] Warning: "ddd-cqrs.config.json" is not valid JSON — using defaults.` and proceeds with defaults.
- `ownership: true` and `--owned` are combined with OR — if the config enables ownership, the owned pattern is always generated (there is no `--no-owned` flag to turn it off).
- Config discovery and path resolution are anchored to the project root found by walking up from the current directory.

## What gets generated

### `gen module` — default options (admin on, not owned): **21 files**

```
<contextsRoot>/<Context>/<Entity>/
├── Domain/
│   ├── <Entity>.ts                          # AggregateRoot: id, fields, createdAt/updatedAt; create()/fromPrimitives()/toPrimitives()/update()/change<Field>() methods
│   └── <Entity>Repository.ts                # save, update, findById, findOne, findAll, delete
├── Application/
│   ├── Commands/
│   │   ├── Create<Entity>/Create<Entity>Command.ts
│   │   ├── Create<Entity>/Create<Entity>CommandHandler.ts
│   │   ├── Update<Entity>/Update<Entity>Command.ts
│   │   ├── Update<Entity>/Update<Entity>CommandHandler.ts
│   │   ├── Delete<Entity>/Delete<Entity>Command.ts
│   │   ├── Delete<Entity>/Delete<Entity>CommandHandler.ts
│   │   ├── AdminUpdate<Entity>/AdminUpdate<Entity>Command.ts
│   │   ├── AdminUpdate<Entity>/AdminUpdate<Entity>CommandHandler.ts
│   │   ├── AdminDelete<Entity>/AdminDelete<Entity>Command.ts
│   │   └── AdminDelete<Entity>/AdminDelete<Entity>CommandHandler.ts
│   └── Queries/
│       └── Get<Entity>ById/
│           ├── Get<Entity>ByIdQuery.ts      # + Get<Entity>ByIdResponse
│           └── Get<Entity>ByIdQueryHandler.ts
└── Infrastructure/
    ├── <Entity>Controller.ts
    ├── <Entity>Router.ts
    ├── Schemas/<Entity>Schemas.ts           # Create<Entity>Schema, Update<Entity>Schema
    └── Persistence/
        ├── MongoDB<Entity>Repository.ts
        ├── MySQL<Entity>Repository.ts
        ├── InMemory<Entity>Repository.ts
        └── Mongoose<Entity>Model.ts
```

### File count by option combination

| Options | Files | Notes |
| --- | --- | --- |
| (default) | 21 | admin on, not owned |
| `--no-admin` | 17 | no `AdminUpdate`/`AdminDelete` commands |
| `--owned` | 23 | + `GetOwned<Plural>` query + handler |
| `--owned --no-admin` | 19 | both variations combined |

### What `--owned` adds on top of the base module

- `ownerId: string` in the entity, its primitives, `Create` command and every repository mapping.
- `findAllByOwner(ownerId)` on the repository interface and in the MongoDB, MySQL and InMemory implementations.
- `GetOwned<Plural>` query + handler with `page`/`itemsPerPage` (defaults 1 and 10) and a `total` in the response.
- Ownership guard in `Update`/`Delete` handlers (`UnauthorizedError` if `entity.ownerId.value !== command.ownerId`).
- A `GET /` route returning the owner's entities (`req.id` is used as `ownerId`).

### Generated routes (`<Entity>Router.ts`, owned + admin example)

| Method | Path | Auth middleware | Controller method |
| --- | --- | --- | --- |
| GET | `/` | yes | `getOwned<Plural>` (owned only) |
| GET | `/:id` | **no** | `getById` |
| POST | `/` | yes | `create` |
| PATCH | `/:id` | yes | `update` |
| DELETE | `/:id` | yes | `delete` |
| PATCH | `/admin/:id` | yes | `adminUpdate` (admin only) |
| DELETE | `/admin/:id` | yes | `adminDelete` (admin only) |

The controller dispatches `Command`/`Query` objects through the `CommandBus`/`QueryBus`. `create`/`update` parse the request body with the generated Zod schemas; `adminUpdate`/`adminDelete` pass `req.id` as `requesterId`; owned routes pass `req.id` as `ownerId`. Responses are `{ statusCode, message }` for mutations, raw data for `getById`, and `{ statusCode, data, total }` for the owned list.

### Piece commands

| Command | Files generated |
| --- | --- |
| `gen command` | 2 — `<Action><Entity>Command.ts` + `...CommandHandler.ts` |
| `gen query` | 2 — `<Action><Entity>Query.ts` (+ `<Action><Entity>QueryResponse`) + `...QueryHandler.ts` |
| `gen controller` | 2 — `<Entity>Controller.ts` + `<Entity>Router.ts` |
| `gen schema` | 1 — `<Entity>Schemas.ts` |

There is no `Unlock` command or `ClaimTokenStore` generated — only the commands and queries listed above.

## Container wiring

Pass `--container <file>` (or set `containerPath` in the config) to integrate the generated handlers into an existing dependency-injection `Container` class. The path is resolved against the project root and the file must exist, otherwise the command fails with `Container file not found: <path> (...)` — note that the module files are written **before** this check runs.

`ContainerUpdater` edits the file in place, preserving its line endings. For a module it:

1. Inserts the domain repository interface import after the last existing `...Repository` interface import.
2. Inserts a `// Repositories - <Entity>` section (MySQL + MongoDB repository imports).
3. Adds a `public readonly <entityCamel>Repository: <Entity>Repository;` property.
4. Adds `const <entityCamel>Repo = env.DB_MODE ? new MongoDB<Entity>Repository() : new MySQL<Entity>Repository();` and `this.<entityCamel>Repository = <entityCamel>Repo;`.
5. Inserts `// Command Handlers - <Entity>` and `// Query Handlers - <Entity>` import sections.
6. Adds handler instantiations (e.g. `const createProductHandler = new CreateProductCommandHandler(productRepo, this.idGenerator);`).
7. Registers each handler in the `commandBus`/`queryBus` arrays (`new InMemoryCommandBus([...])` / `new InMemoryQueryBus([...])`).

**Idempotency:** every insert is preceded by an existence check — imports, properties, consts and bus entries that are already present are skipped and reported with a `=` (or `? no anchor` when the surrounding structure it needs doesn't exist). Running the same command twice produces no duplicates. `--force` does **not** affect container edits (it only governs file overwrites).

**Without a container:** if neither `--container` nor `containerPath` is provided, the module is generated "loose" — the CLI prints `(no container file specified — pass --container or set containerPath in ddd-cqrs.config.json)` and the handlers are never registered anywhere; you must wire them yourself.

**Dry-run:** with `--dry-run`, all container edits are computed and printed but nothing is written.

## Development

```bash
npm install
npm run build     # tsc && tsc-alias — emits CommonJS to dist/
```

- **Dev script:** `npm run ddd-cqrs -- <args>` runs the entry point through `tsx`. On Windows/PowerShell, `npm run` may swallow flags — prefer `npx tsx src/Contexts/Scaffolding/Infrastructure/Cli/Index.ts <args>`.
- **`tsx` vs `dist`:** the compiled output in `dist/` and the `tsx`-run source produce identical CLI behavior (verified).
- **Gotcha — running `tsx` from outside the repo:** `@/...` path aliases are resolved with the tsconfig of the *current working directory*, so from another project you get `Error: Cannot find module '@/Contexts/Scaffolding/Domain/ScaffoldingError'`. Fix: point tsx at the repo's tsconfig:

```bash
npx tsx --tsconfig F:/path/to/ddd-cqrs-cli/tsconfig.json F:/path/to/ddd-cqrs-cli/src/Contexts/Scaffolding/Infrastructure/Cli/Index.ts gen module --name BlogPost
```

## Publishing

The package is publish-ready:

```json
{
  "files": ["dist"],
  "prepublishOnly": "npm run build",
  "main": "dist/Contexts/Scaffolding/Infrastructure/Cli/Index.js",
  "bin": { "ddd-cqrs": "./dist/Contexts/Scaffolding/Infrastructure/Cli/Index.js" }
}
```

`prepublishOnly` rebuilds `dist/` before every publish, and only `dist/` is shipped.

```bash
npm login
npm publish
```

Post-publish consumption:

```bash
npm install -g ddd-cqrs-cli      # or: npm install -D ddd-cqrs-cli
ddd-cqrs gen module --name BlogPost --fields "title:string" --context Shop
```

## Troubleshooting

| Error / symptom | Cause | Fix |
| --- | --- | --- |
| `Error: [ddd-cqrs] Could not find a package.json while walking up from the current directory — run ddd-cqrs from inside a Node.js project` | No `package.json` in `cwd` or any parent directory. | Run the CLI from inside a Node.js project (or a subdirectory of one). |
| `Error: [ddd-cqrs] Entity name must be singular: "Products" looks plural - use "Product" (e.g. Product, not Products)` | Entity name rejected as plural. | Use the suggested singular. Endings `ss`/`us`/`is` are accepted (`Status`, `Class`, `Bus`, `Analysis`). |
| `Error: [ddd-cqrs] Entity name must be in PascalCase ... got "blog post"` | Name has spaces/accents or isn't PascalCase. | Use `BlogPost`, `MyContext` — no spaces or accents. |
| `Error: [ddd-cqrs] Field name "id" is reserved ...` | A reserved field (`id`, `createdAt`, `updatedAt`, or `ownerId` with `--owned`) was passed in `--fields`. | Remove it — it is generated automatically. |
| `Error: [ddd-cqrs] Duplicate field name "title" in --fields ...` | The same field name appears twice. | Each field must appear once. |
| `Error: [ddd-cqrs] Invalid type "foo" for field ...` | Unsupported field type. | Use one of `string`, `number`, `boolean`, `Date`, `string[]`. |
| `Error: Cannot find module '@/Contexts/Scaffolding/Domain/ScaffoldingError'` | Running `tsx` from outside the repo; `@/` resolved against the wrong tsconfig. | Add `--tsconfig <repo>/tsconfig.json` to the `tsx` invocation. |
| `npm run ddd-cqrs -- --version` prints npm's version (or help) instead of the CLI's | `npm run` intercepts/swallows flags on Windows. | Use `npx tsx src/Contexts/Scaffolding/Infrastructure/Cli/Index.ts --version` (see [Installation](#installation)). |
| Re-running a command prints `=` for every file | Idempotent write protection — files already exist. | Nothing to fix; pass `--force` only if you want to overwrite them. |
| `Error: [ddd-cqrs] Container file not found: <path> ...` | `--container`/`containerPath` points to a missing file. | Create the file or fix the path. Note the module files are written before this check. |
| `? no anchor for ...` during container wiring | The container file lacks the structure the updater anchors to (e.g. no existing repository imports, no bus arrays). | Align the container with the expected structure (repository import lines, `public readonly ...Repository` properties, `// Repositories - <Entity>` / handler sections, `InMemoryCommandBus([...])` / `InMemoryQueryBus([...])` arrays). |
| `[ddd-cqrs] Warning: "ddd-cqrs.config.json" is not valid JSON — using defaults.` | Config file has a syntax error. | Fix the JSON, or delete the file to use defaults. |

## License

MIT
