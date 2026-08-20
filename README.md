# ddd-cqrs-cli

Portable DDD-CQRS scaffolding generator. Bootstrap a complete hexagonal-architecture project with `init`, then generate modules, entities, commands, queries, and more — inside any Node.js/TypeScript project.

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

- **Project bootstrap** — `init` generates a complete Shared Kernel (~43 files) with Domain buses, Command/Query/Event contracts, InMemory implementations, error classes, value objects, and services.
- **DDD + CQRS module scaffolding** — `gen module` generates a full module: Domain (AggregateRoot entity + repository interface), Application (Commands/Queries with handlers), and Infrastructure (Controller, Router, Zod schemas, MongoDB/MySQL/InMemory repositories).
- **Atomic generators** — generate individual pieces: `entity`, `value-object`, `error`, `event`, `subscriber`, `service`, `repository`, `command`, `query`, `controller`, `router`, `schema`.
- **HTTP framework support** — `--http express` (default) or `--http elysia` for controllers and routers.
- **Database selection** — `--db mongo,mysql,inmemory` for repository implementations.
- **Vercel compatible** — generated `Start.ts` supports both local and serverless deployment.
- **Portable** — runs from *any* Node.js project. Works in ANY project layout.
- **Container wiring** — optionally wires generated handlers into an existing DI `Container`.
- **Dry-run** (`--dry-run`) — preview generation without writing files.
- **Idempotent writes** — existing files untouched; `--force` overwrites.

## Requirements

- **Node.js 22+** for the CLI itself.
- The **target project** must:
  - Have a `package.json`. The CLI walks up from the current directory until it finds one.
  - For `gen module` and atomic generators: the Shared Kernel must exist (`src/Contexts/Shared/`). Use `init` to bootstrap it in new projects.
  - For `init`: no prior setup required — it generates everything from scratch.

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

### New project (from scratch)

```bash
mkdir my-project && cd my-project
npm init -y
npm i -D ddd-cqrs-cli

# Bootstrap Shared Kernel
npx tsx ../ddd-cqrs-cli/src/Contexts/Scaffolding/Infrastructure/Cli/Index.ts init --name my-project

# Install dependencies
npm install

# Generate a module
npx tsx ../ddd-cqrs-cli/src/Contexts/Scaffolding/Infrastructure/Cli/Index.ts gen module --name Product --fields "title:string,views:number"
```

### Existing project

If the Shared Kernel already exists:

```bash
ddd-cqrs gen module --name Product --fields "title:string,views:number" --context Shop
```

The CLI generates:

```
src/Contexts/Shop/Product/
├── Domain/
│   ├── Product.ts                          # AggregateRoot entity (id, title, views, createdAt, updatedAt)
│   └── ProductRepository.ts                # repository interface
├── Application/
│   ├── Commands/
│   │   ├── CreateProduct/                  # CreateProductCommand + CreateProductCommandHandler
│   │   ├── UpdateProduct/                  # UpdateProductCommand + UpdateProductCommandHandler
│   │   └── DeleteProduct/                  # DeleteProductCommand + DeleteProductCommandHandler
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

**17 files** with the default options.

Before the module works end-to-end, you must still:

1. **Wire the routes**: mount `ProductRouter(controller)` in your Express app.
2. **Register handlers** in the Container (or use `--container` flag).

Preview everything without writing anything:

```bash
ddd-cqrs gen module --name Product --fields "title:string" --context Shop --dry-run
```

## Usage — command reference

Run `ddd-cqrs --help`:

```
Usage: ddd-cqrs [options] [command]

Portable DDD-CQRS scaffolding generator v0.2.0

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  init            Bootstrap a new project with Shared Kernel (~43 files)
  gen             Generate DDD-CQRS artifacts
  help [command]  display help for command
```

Every command shares a set of common options (`--context`, `--contexts-root`, `--dry-run`, `--force`) plus command-specific ones.

### `ddd-cqrs init`

Bootstrap a new project with Shared Kernel (~43 files).

```
Usage: ddd-cqrs init [options]

Options:
  --name <project>       Project name in kebab-case (e.g. my-backend)    (required)
  --target <dir>         Target directory (default: current directory)
  --context <context>    Bounded context name (default: MyContext)
  --contexts-root <dir>  Contexts root directory (default: src/Contexts)
  --no-services          Skip optional services (Password, Token, Email)
  --dry-run              Show the generation plan without writing files
  --force                Overwrite existing files
```

Examples:
```bash
ddd-cqrs init --name my-backend
ddd-cqrs init --name my-backend --target /path/to/project
ddd-cqrs init --name my-backend --context ECommerce
ddd-cqrs init --name my-backend --dry-run
```

Generates:
- **Domain layer**: Bus interfaces (CommandBus, QueryBus, EventBus), Command/Query/Event contracts, AggregateRoot, DomainError, IdGenerator, Response, SlugGenerator, Error classes, Value Objects
- **Infrastructure layer**: InMemory bus implementations, UuidGenerator, SlugGenerator, config (env, cors), types (CustomRequest)
- **Services** (optional): PasswordService, TokenService, EmailService with implementations
- **Project root**: tsconfig.json, package.json, Container.ts, Server.ts, Start.ts (Vercel compatible)

> **Note**: Generates Express-specific files by default (types, cors, server.ts). If using Elysia/Fastify, delete those files and create your HTTP layer.

### Common options

| Option | Description | Default |
| --- | --- | --- |
| `--context <context>` | Bounded context name (PascalCase). | `MyContext`, or `defaultContext` from `ddd-cqrs.config.json` |
| `--contexts-root <dir>` | Directory that contains the contexts. | `src/Contexts`, or `contextRoot` from `ddd-cqrs.config.json` |
| `--container <file>` | Container file to wire. | none, or `containerPath` from `ddd-cqrs.config.json` |
| `--dry-run` | Show the generation plan without writing files. | `false` |
| `--force` | Overwrite existing files. | `false` |

### `ddd-cqrs gen module`

Generate a full module: Domain, Commands, Queries, Schemas, Persistence, Controller, Router.

```
Usage: ddd-cqrs gen module [options]

Options:
  --name <entity>        Entity name in PascalCase (e.g. BlogPost)       (required)
  --fields <fields>      Comma-separated fields as name:type             (default: "")
  --context <context>
  --contexts-root <dir>
  --container <file>
  --dry-run
  --force
```

Examples:
```bash
ddd-cqrs gen module --name BlogPost --fields "title:string,views:number"
ddd-cqrs gen module --name BlogPost --dry-run
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

Generate Controller for an existing module.

```
Usage: ddd-cqrs gen controller [options]

Options:
  --module <entity>      Entity/module name in PascalCase               (required)
  --http <framework>     HTTP framework: express (default), elysia
  --fields <fields>      Field list used to build command arguments    (default: "")
  --context <context>
  --dry-run
  --force
```

Example:
```bash
ddd-cqrs gen controller --module BlogPost
ddd-cqrs gen controller --module BlogPost --http elysia
```

### `ddd-cqrs gen router`

Generate Router for an existing module.

```
Usage: ddd-cqrs gen router [options]

Options:
  --module <entity>      Entity/module name in PascalCase               (required)
  --http <framework>     HTTP framework: express (default), elysia
  --context <context>
  --dry-run
  --force
```

Example:
```bash
ddd-cqrs gen router --module BlogPost
ddd-cqrs gen router --module BlogPost --http elysia
```

### Atomic generators

Generate individual DDD pieces:

```bash
# Entity
ddd-cqrs gen entity --module BlogPost --name BlogPost --fields "title:string,views:number"

# Value Object
ddd-cqrs gen value-object --module User --name Email --type string
ddd-cqrs gen value-object --module User --name Address --type object --fields "street:string,city:string"

# Error
ddd-cqrs gen error --module User --name InvalidCredentialsError --message "Invalid credentials" --status 401

# Domain Event
ddd-cqrs gen event --module Link --name LinkCreatedDomainEvent --fields "title:string,destination:string"

# Event Subscriber
ddd-cqrs gen subscriber --module User --name SendWelcomeEmail --event UserRegisteredDomainEvent

# Service (interface + implementation)
ddd-cqrs gen service --module User --name PasswordService --methods "hash,compare"
ddd-cqrs gen service --module User --name PasswordService --methods "hash,compare" --impl-name BcryptPasswordService

# Repository (interface + persistence implementations)
ddd-cqrs gen repository --module BlogPost --name BlogPost --db "mongo,mysql"

# Command + Handler
ddd-cqrs gen command --module BlogPost --name Archive --fields "reason:string"

# Query + Handler
ddd-cqrs gen query --module BlogPost --name SearchByTitle --fields "title:string"

# Schema (Zod)
ddd-cqrs gen schema --module BlogPost --fields "title:string,views:number"
```

### Global options

| Option | Description |
| --- | --- |
| `-h, --help` | Display help for the current command. |
| `-V, --version` | Print the CLI version (`0.2.0`). |

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
  "containerPath": "src/Contexts/Shop/Container.ts"
}
```

| Key | Type | Default | Used when |
| --- | --- | --- | --- |
| `contextRoot` | string | `src/Contexts` | `--contexts-root` not passed |
| `defaultContext` | string | `MyContext` | `--context` not passed |
| `containerPath` | string | none | `--container` not passed |

Precedence: **CLI flags > config file > built-in defaults**.

Notes:

- The legacy filename `.ddd-cqrs.json` is also read if `ddd-cqrs.config.json` is absent.
- If the file is not valid JSON, the CLI prints `[ddd-cqrs] Warning: "ddd-cqrs.config.json" is not valid JSON — using defaults.` and proceeds with defaults.
- Config discovery and path resolution are anchored to the project root found by walking up from the current directory.

## What gets generated

### `gen module` — default options: **17 files**

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
│   │   └── Delete<Entity>/Delete<Entity>CommandHandler.ts
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

### File count by command

| Command | Files | Notes |
| --- | --- | --- |
| `init` | 43 | Shared Kernel + project root |
| `gen module` | 17 | Full module |
| `gen entity` | 1 | Entity class |
| `gen value-object` | 1 | Value Object class |
| `gen error` | 1 | Domain Error class |
| `gen event` | 1 | Domain Event class |
| `gen subscriber` | 1 | Event Subscriber class |
| `gen service` | 2 | Interface + Implementation |
| `gen repository` | 4 | Interface + 3 persistence implementations |
| `gen command` | 2 | Command + CommandHandler |
| `gen query` | 2 | Query + QueryHandler |
| `gen controller` | 1 | Controller |
| `gen router` | 1 | Router |
| `gen schema` | 1 | Zod schemas |

### Generated routes (`<Entity>Router.ts`)

| Method | Path | Controller method |
| --- | --- | --- |
| GET | `/:id` | `getById` |
| POST | `/` | `create` |
| PATCH | `/:id` | `update` |
| DELETE | `/:id` | `delete` |

The controller dispatches `Command`/`Query` objects through the `CommandBus`/`QueryBus`. `create`/`update` parse the request body with the generated Zod schemas.



### What `init` generates

```
src/Contexts/Shared/
├── Domain/
│   ├── AggregateRoot.ts, DomainError.ts, IdGenerator.ts, Response.ts, SlugGenerator.ts
│   ├── Bus/          CommandBus, QueryBus, EventBus
│   ├── Commands/     Command, CommandHandler
│   ├── Queries/      Query, QueryHandler
│   ├── Events/       DomainEvent, DomainEventSubscriber
│   ├── Errors/       ApiError, BadRequest, Conflict, Database, NotFound, Unauthorized
│   ├── ValueObjects/ DateTime, DocumentId
│   └── Services/     PasswordService, TokenService, EmailService (optional)
├── Infrastructure/
│   ├── Bus/          InMemoryCommandBus, InMemoryQueryBus, InMemoryEventBus, EventEmitterEventBus
│   ├── UuidGenerator.ts, SlugGenerator.ts
│   ├── config/       env.ts, cors.ts
│   ├── types/        index.ts (CustomRequest)
│   └── Services/     Bcrypt, Jwt, NodeMailer (optional)
src/Apps/Backend/
├── DependencyInjection/Container.ts
├── Server.ts (Express class)
└── Start.ts (Vercel compatible)
tspackage.json
tsconfig.json
```

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

Published as **`ddd-cqrs-cli@0.2.0`** (npm) with GitHub Release **`v0.2.0`**
(<https://github.com/Ronald3217/ddd-cqrs-cli/releases/tag/v0.2.0>).

> **What's new in v0.2.0:** `init` command for greenfield projects, atomic generators
> (entity, value-object, error, event, subscriber, service, repository), HTTP framework
> support (Express/Elysia), database selection, and Vercel compatibility.

The package ships `dist/` only and rebuilds on every publish:

```json
{
  "files": ["dist"],
  "prepublishOnly": "npm run build",
  "main": "dist/Contexts/Scaffolding/Infrastructure/Cli/Index.js",
  "bin": { "ddd-cqrs": "./dist/Contexts/Scaffolding/Infrastructure/Cli/Index.js" }
}
```

Release workflow (the changelog is the source of truth):

```bash
# 1. Update CHANGELOG.md (Keep a Changelog 1.1.0)
# 2. npm run build && npm publish     # account ronald3217, 2FA → --otp=<code>
# 3. git tag -a vX.Y.Z -F <message> && git push origin vX.Y.Z
# 4. gh release create vX.Y.Z -F <message> --title "vX.Y.Z"
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
| `Error: [ddd-cqrs] Field name "id" is reserved ...` | A reserved field (`id`, `createdAt`, `updatedAt`) was passed in `--fields`. | Remove it — it is generated automatically. |
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
