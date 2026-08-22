#!/usr/bin/env node
import { Command } from 'commander';
import * as path from 'path';
import { ScaffoldingError } from '@/Contexts/Scaffolding/Domain/ScaffoldingError';
import { ModuleSpec } from '@/Contexts/Scaffolding/Domain/ModuleSpec';
import { PieceSpec } from '@/Contexts/Scaffolding/Domain/PieceSpec';
import { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';
import { BuildModulePlan } from '@/Contexts/Scaffolding/Application/BuildModulePlan';
import { BuildCommandPlan } from '@/Contexts/Scaffolding/Application/BuildCommandPlan';
import { BuildQueryPlan } from '@/Contexts/Scaffolding/Application/BuildQueryPlan';
import { BuildControllerPlan } from '@/Contexts/Scaffolding/Application/BuildControllerPlan';
import type { HttpFramework } from '@/Contexts/Scaffolding/Application/Plan';
import { BuildRouterPlan } from '@/Contexts/Scaffolding/Application/BuildRouterPlan';
import { BuildSchemaPlan } from '@/Contexts/Scaffolding/Application/BuildSchemaPlan';
import { BuildValueObjectPlan } from '@/Contexts/Scaffolding/Application/BuildValueObjectPlan';
import { BuildErrorPlan, type ErrorSpec } from '@/Contexts/Scaffolding/Application/BuildErrorPlan';
import { BuildEntityPlan } from '@/Contexts/Scaffolding/Application/BuildEntityPlan';
import { BuildEventPlan } from '@/Contexts/Scaffolding/Application/BuildEventPlan';
import { BuildSubscriberPlan, type SubscriberSpec } from '@/Contexts/Scaffolding/Application/BuildSubscriberPlan';
import { BuildServicePlan, type ServiceSpec } from '@/Contexts/Scaffolding/Application/BuildServicePlan';
import { BuildRepositoryPlan, type DbType } from '@/Contexts/Scaffolding/Application/BuildRepositoryPlan';
import { BuildInitPlan, type InitOptions } from '@/Contexts/Scaffolding/Application/BuildInitPlan';
import type { GenerationPlan } from '@/Contexts/Scaffolding/Application/Plan';
import { resolveLayout, loadConfig, resolveProjectRoot } from '@/Contexts/Scaffolding/Infrastructure/ProjectLayout';
import type { DddCqrsConfig, ProjectLayout } from '@/Contexts/Scaffolding/Infrastructure/ProjectLayout';
import { FileWriter } from '@/Contexts/Scaffolding/Infrastructure/FileWriter';
import { ContainerUpdater } from '@/Contexts/Scaffolding/Infrastructure/ContainerUpdater';
import { registerHelpCommand } from '@/Contexts/Scaffolding/Infrastructure/Cli/HelpCommand';

interface CommonOptions {
  fields?: string;
  context?: string;
  contextsRoot?: string;
  container?: string;
  dryRun: boolean;
  force: boolean;
}

interface ModuleCmdOptions extends CommonOptions {
  name: string;
}

interface PieceCmdOptions extends CommonOptions {
  module: string;
  name?: string;
}

interface ControllerCmdOptions extends CommonOptions {
  module: string;
  http?: string;
}

interface RouterCmdOptions extends CommonOptions {
  module: string;
  http?: string;
}

interface SchemaCmdOptions extends CommonOptions {
  module: string;
}

interface ValueObjectCmdOptions extends CommonOptions {
  module: string;
  name: string;
  type: string;
}

interface ErrorCmdOptions extends CommonOptions {
  module: string;
  name: string;
  message: string;
  status: number;
}

interface EntityCmdOptions extends CommonOptions {
  module: string;
  name: string;
}

interface EventCmdOptions extends CommonOptions {
  module: string;
  name: string;
}

interface SubscriberCmdOptions extends CommonOptions {
  module: string;
  name: string;
  event: string;
}

interface ServiceCmdOptions extends CommonOptions {
  module: string;
  name: string;
  methods?: string;
  implName?: string;
}

interface RepositoryCmdOptions extends CommonOptions {
  module: string;
  name: string;
  db?: string;
}

interface InitCmdOptions {
  name: string;
  target?: string;
  context?: string;
  contextsRoot?: string;
  noServices?: boolean;
  dryRun: boolean;
  force: boolean;
}

const NEUTRAL_DEFAULT_CONTEXT = 'MyContext';
const DEFAULT_CONTEXTS_ROOT = 'src/Contexts';
const FIELDS_EXAMPLE = 'title:string,views:number,featured:boolean,publishedAt:Date,tags:string[]';

function addCommonOptions(cmd: Command): void {
  cmd
    .option('--context <context>', `Bounded context name (default: ${NEUTRAL_DEFAULT_CONTEXT} or defaultContext from ddd-cqrs.config.json)`)
    .option('--contexts-root <dir>', `Contexts root directory (default: ${DEFAULT_CONTEXTS_ROOT} or contextRoot from ddd-cqrs.config.json)`)
    .option('--container <file>', 'Container file to wire (optional; falls back to containerPath from ddd-cqrs.config.json)')
    .option('--dry-run', 'Show the generation plan without writing files', false)
    .option('--force', 'Overwrite existing files', false);
}

function addFieldsOption(cmd: Command): void {
  cmd.option(
    '--fields <fields>',
    `Comma-separated fields as name:type (e.g. ${FIELDS_EXAMPLE}). Valid types: string, number, boolean, Date, string[]`,
    '',
  );
}

function addExamples(cmd: Command, examples: string[]): void {
  cmd.addHelpText('afterAll', `\nExamples:\n${examples.map((e) => `  $ ddd-cqrs ${e}`).join('\n')}\n`);
}

function addHelpHint(cmd: Command): Command {
  return cmd.showHelpAfterError('(add --help for usage)');
}

export function run(): void {
  const program = new Command();
  program
    .name('ddd-cqrs')
    .description('Portable DDD-CQRS scaffolding generator')
    .version('0.2.0');

  const gen = addHelpHint(program
    .command('gen')
    .description('Generate DDD-CQRS artifacts'));

  const moduleCmd = addHelpHint(gen
    .command('module')
    .description('Generate a full DDD-CQRS module (Domain, Commands, Queries, Schemas, Persistence, Controller, Router) and wire the Container')
    .requiredOption('--name <entity>', 'Entity name in PascalCase (e.g. BlogPost)'));
  addFieldsOption(moduleCmd);
  addCommonOptions(moduleCmd);
  addExamples(moduleCmd, ['gen module --name BlogPost --fields "title:string,views:number"', 'gen module --name BlogPost --dry-run']);
  moduleCmd.action(handleModule);

  const commandCmd = addHelpHint(gen
    .command('command')
    .description('Generate a custom Command and CommandHandler into an existing module')
    .requiredOption('--module <entity>', 'Entity/module name in PascalCase')
    .requiredOption('--name <action>', 'Action name in PascalCase (e.g. Archive)'));
  addFieldsOption(commandCmd);
  addCommonOptions(commandCmd);
  addExamples(commandCmd, ['gen command --module BlogPost --name Publish', 'gen command --module BlogPost --name Archive --fields "reason:string"']);
  commandCmd.action(handleCommand);

  const queryCmd = addHelpHint(gen
    .command('query')
    .description('Generate a custom Query and QueryHandler into an existing module')
    .requiredOption('--module <entity>', 'Entity/module name in PascalCase')
    .requiredOption('--name <action>', 'Action name in PascalCase (e.g. SearchByTitle)'));
  addFieldsOption(queryCmd);
  addCommonOptions(queryCmd);
  addExamples(queryCmd, ['gen query --module BlogPost --name SearchByTitle --fields "title:string"']);
  queryCmd.action(handleQuery);

  const controllerCmd = addHelpHint(gen
    .command('controller')
    .description('Generate Controller for an existing module')
    .requiredOption('--module <entity>', 'Entity/module name in PascalCase')
    .option('--http <framework>', 'HTTP framework: express (default), elysia', 'express'));
  addFieldsOption(controllerCmd);
  addCommonOptions(controllerCmd);
  addExamples(controllerCmd, ['gen controller --module BlogPost', 'gen controller --module BlogPost --http express']);
  controllerCmd.action(handleController);

  const routerCmd = addHelpHint(gen
    .command('router')
    .description('Generate Router for an existing module')
    .requiredOption('--module <entity>', 'Entity/module name in PascalCase')
    .option('--http <framework>', 'HTTP framework: express (default), elysia', 'express'));
  addCommonOptions(routerCmd);
  addExamples(routerCmd, ['gen router --module BlogPost', 'gen router --module BlogPost --http express']);
  routerCmd.action(handleRouter);

  const schemaCmd = addHelpHint(gen
    .command('schema')
    .description('Generate Zod schemas (Create/Update) for an existing module')
    .requiredOption('--module <entity>', 'Entity/module name in PascalCase'));
  addFieldsOption(schemaCmd);
  addCommonOptions(schemaCmd);
  addExamples(schemaCmd, ['gen schema --module BlogPost --fields "title:string,views:number"']);
  schemaCmd.action(handleSchema);

  const valueObjectCmd = addHelpHint(gen
    .command('value-object')
    .description('Generate a Value Object class into an existing module')
    .requiredOption('--module <entity>', 'Entity/module name in PascalCase. Use "Shared" for global kernel or "BC/Shared" for BC-level shared')
    .requiredOption('--name <voName>', 'Value Object name in PascalCase (e.g. Email, Slug)')
    .requiredOption('--type <type>', 'Value type: string, number, boolean, Date, string[], object'));
  addFieldsOption(valueObjectCmd);
  addCommonOptions(valueObjectCmd);
  addExamples(valueObjectCmd, [
    'gen value-object --module User --name Email --type string',
    'gen value-object --module Shared --name Email --type string',
    'gen value-object --module BlogPost --name PublishedAt --type Date',
    'gen value-object --module User --name Address --type object --fields "street:string,city:string,country:string"',
  ]);
  valueObjectCmd.action(handleValueObject);

  const errorCmd = addHelpHint(gen
    .command('error')
    .description('Generate a Domain Error class into an existing module')
    .requiredOption('--module <entity>', 'Entity/module name in PascalCase. Use "Shared" for global kernel or "BC/Shared" for BC-level shared')
    .requiredOption('--name <errorName>', 'Error class name in PascalCase (e.g. InvalidCredentialsError)')
    .option('--message <message>', 'Error message', '${name} error')
    .option('--status <code>', 'HTTP status code', '400'));
  addCommonOptions(errorCmd);
  addExamples(errorCmd, ['gen error --module User --name InvalidCredentialsError --message "Invalid credentials" --status 401', 'gen error --module Shared --name NotFoundError --message "Not found" --status 404', 'gen error --module AdLinksManager/Shared --name LinkNotFoundError --message "Link not found" --status 404']);
  errorCmd.action(handleError);

  const entityCmd = addHelpHint(gen
    .command('entity')
    .description('Generate Entity class into an existing module')
    .requiredOption('--module <entity>', 'Entity/module name in PascalCase')
    .requiredOption('--name <entityName>', 'Entity name in PascalCase (e.g. BlogPost)'));
  addFieldsOption(entityCmd);
  addCommonOptions(entityCmd);
  addExamples(entityCmd, ['gen entity --module BlogPost --name BlogPost --fields "title:string,views:number"', 'gen entity --module User --name User --fields "email:string,name:string"']);
  entityCmd.action(handleEntity);

  const eventCmd = addHelpHint(gen
    .command('event')
    .description('Generate a Domain Event class into an existing module')
    .requiredOption('--module <entity>', 'Entity/module name in PascalCase. Use "Shared" for global kernel or "BC/Shared" for BC-level shared')
    .requiredOption('--name <eventName>', 'Event name in PascalCase (e.g. LinkCreatedDomainEvent)'));
  addFieldsOption(eventCmd);
  addCommonOptions(eventCmd);
  addExamples(eventCmd, ['gen event --module Link --name LinkCreatedDomainEvent --fields "title:string,destination:string"', 'gen event --module Shared --name SystemStartedEvent --fields "timestamp:string"', 'gen event --module AdLinksManager/Shared --name PaymentProcessedEvent --fields "amount:number"']);
  eventCmd.action(handleEvent);

  const subscriberCmd = addHelpHint(gen
    .command('subscriber')
    .description('Generate a Domain Event Subscriber class into an existing module')
    .requiredOption('--module <entity>', 'Entity/module name in PascalCase')
    .requiredOption('--name <subscriberName>', 'Subscriber name in PascalCase (e.g. SendWelcomeEmailOnUserRegistered)')
    .requiredOption('--event <eventName>', 'Event class name to subscribe to (e.g. UserRegisteredDomainEvent)'));
  addFieldsOption(subscriberCmd);
  addCommonOptions(subscriberCmd);
  addExamples(subscriberCmd, ['gen subscriber --module User --name SendWelcomeEmailOnUserRegistered --event UserRegisteredDomainEvent', 'gen subscriber --module Link --name LogLinkCreated --event LinkCreatedDomainEvent --fields "logger:Console"']);
  subscriberCmd.action(handleSubscriber);

  const serviceCmd = addHelpHint(gen
    .command('service')
    .description('Generate a Domain Service interface and Infrastructure implementation')
    .requiredOption('--module <entity>', 'Entity/module name in PascalCase. Use "Shared" for global kernel or "BC/Shared" for BC-level shared')
    .requiredOption('--name <serviceName>', 'Service interface name in PascalCase (e.g. PasswordService)')
    .option('--methods <methods>', 'Comma-separated method names (e.g. hash,compare,validate)')
    .option('--impl-name <implName>', 'Implementation class name (default: {Name}Impl, e.g. BcryptPasswordService)'));
  addCommonOptions(serviceCmd);
  addExamples(serviceCmd, ['gen service --module User --name PasswordService --methods "hash,compare"', 'gen service --module Shared --name PasswordService --methods "hash,compare" --impl-name BcryptPasswordService', 'gen service --module AdLinksManager/Shared --name AuthMiddleware --methods "handle,validateToken" --impl-name JwtAuthMiddleware']);
  serviceCmd.action(handleService);

  const repositoryCmd = addHelpHint(gen
    .command('repository')
    .description('Generate Repository interface and persistence implementations')
    .requiredOption('--module <entity>', 'Entity/module name in PascalCase')
    .requiredOption('--name <entityName>', 'Entity name in PascalCase (e.g. BlogPost)')
    .option('--db <databases>', 'Database implementations: mongo,mysql,inmemory (comma-separated, default: all)'));
  addCommonOptions(repositoryCmd);
  addExamples(repositoryCmd, ['gen repository --module BlogPost --name BlogPost --db "mongo,mysql"', 'gen repository --module User --name User --db "inmemory"']);
  repositoryCmd.action(handleRepository);

  gen.action(() => {
    gen.help();
  });

  // ─── init command (top-level) ──────────────────────────────────────────
  const initCmd = addHelpHint(
    program
      .command('init')
      .description('Bootstrap a new project with Shared Kernel (~40 files)')
      .requiredOption('--name <project>', 'Project name in kebab-case (e.g. my-backend)')
      .option('--target <dir>', 'Target directory to write files (default: current directory)', '.')
      .option('--context <context>', `Bounded context name (default: ${NEUTRAL_DEFAULT_CONTEXT})`)
      .option('--contexts-root <dir>', `Contexts root directory (default: ${DEFAULT_CONTEXTS_ROOT})`)
      .option('--no-services', 'Skip optional services (PasswordService, TokenService, EmailService)')
      .option('--dry-run', 'Show the generation plan without writing files', false)
      .option('--force', 'Overwrite existing files', false),
  );
  addExamples(initCmd, [
    'init --name my-backend',
    'init --name my-backend --target /path/to/project',
    'init --name my-backend --context ECommerce',
    'init --name my-backend --dry-run',
  ]);
  initCmd.addHelpText('afterAll', '\nNOTE: Generates Express-specific files (types, cors, server.ts) by default.\n      If using Elysia/Fastify, delete those files and create your HTTP layer.');
  initCmd.action(handleInit);

  registerHelpCommand(program);

  program.parse(process.argv);
}

function loadAndResolve<T extends CommonOptions>(opts: T): T & { context: string; contextsRoot: string; container?: string } {
  const config: DddCqrsConfig = loadConfig(resolveProjectRoot(process.cwd()));
  return {
    ...opts,
    context: opts.context ?? config.defaultContext ?? NEUTRAL_DEFAULT_CONTEXT,
    contextsRoot: opts.contextsRoot ?? config.contextRoot ?? DEFAULT_CONTEXTS_ROOT,
    container: opts.container ?? config.containerPath,
  };
}

function resolveExecution<T extends CommonOptions>(opts: T): { resolved: ReturnType<typeof loadAndResolve<T>>; layout: ProjectLayout } {
  const resolved = loadAndResolve(opts);
  const layout = resolveLayout({ context: resolved.context, contextsRoot: resolved.contextsRoot, container: resolved.container });
  return { resolved, layout };
}

async function handleModule(opts: ModuleCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    const spec = ModuleSpec.create(opts.name, opts.fields, resolved.context);
    const plan = new BuildModulePlan().build(spec, layout.contextsRoot, layout.importBase);
    await execute(plan, resolved, layout.containerPath, layout.importBase);
  });
}

async function handleCommand(opts: PieceCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    const spec = PieceSpec.create('command', opts.module, opts.name as string, opts.fields, resolved.context);
    const plan = new BuildCommandPlan().build(spec, layout.contextsRoot, layout.importBase);
    await execute(plan, resolved, layout.containerPath, layout.importBase);
  });
}

async function handleQuery(opts: PieceCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    const spec = PieceSpec.create('query', opts.module, opts.name as string, opts.fields, resolved.context);
    const plan = new BuildQueryPlan().build(spec, layout.contextsRoot, layout.importBase);
    await execute(plan, resolved, layout.containerPath, layout.importBase);
  });
}

async function handleController(opts: ControllerCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    const spec = PieceSpec.create('controller', opts.module, '', opts.fields, resolved.context);
    const http = (opts.http ?? 'express') as HttpFramework;
    const plan = new BuildControllerPlan().build(spec, layout.contextsRoot, http, layout.importBase);
    await execute(plan, resolved, layout.containerPath, layout.importBase);
  });
}

async function handleRouter(opts: RouterCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    const spec = PieceSpec.create('controller', opts.module, '', undefined, resolved.context);
    const http = (opts.http ?? 'express') as HttpFramework;
    const plan = new BuildRouterPlan().build(spec, layout.contextsRoot, http, layout.importBase);
    await execute(plan, resolved, layout.containerPath, layout.importBase);
  });
}

async function handleSchema(opts: SchemaCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    const spec = PieceSpec.create('schema', opts.module, '', opts.fields, resolved.context);
    const plan = new BuildSchemaPlan().build(spec, layout.contextsRoot, layout.importBase);
    await execute(plan, resolved, layout.containerPath, layout.importBase);
  });
}

async function handleValueObject(opts: ValueObjectCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    const isObjectType = opts.type === 'object';
    
    if (isObjectType && !opts.fields) {
      throw new ScaffoldingError('Object type requires --fields option');
    }
    
    // Parse 'BC/Shared' → entityName for validation, full path kept in spec
    const moduleParts = opts.module.split('/');
    const entityName = moduleParts.length > 1 ? moduleParts[moduleParts.length - 1] : opts.module;

    let spec: PieceSpec;
    
    if (isObjectType) {
      // Object type: pass fields directly, BuildValueObjectPlan will handle it
      spec = PieceSpec.create('value-object', entityName, opts.name, opts.fields, resolved.context);
    } else {
      // Primitive type: create a single 'value' field with the specified type
      const fieldsRaw = `value:${opts.type}`;
      spec = PieceSpec.create('value-object', entityName, opts.name, fieldsRaw, resolved.context);
    }
    // Override entityName with full module path so BuildValueObjectPlan can resolve output location
    (spec as any).entityName = opts.module;
    
    const plan = new BuildValueObjectPlan().build(spec, layout.contextsRoot, isObjectType, layout.importBase);
    await execute(plan, resolved, layout.containerPath, layout.importBase);
  });
}

async function handleError(opts: ErrorCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    // Parse 'BC/Shared' → moduleName='Shared' for validation, full path kept in spec
    const moduleParts = opts.module.split('/');
    const moduleName = moduleParts.length > 1 ? moduleParts[moduleParts.length - 1] : opts.module;
    const errorSpec: ErrorSpec = {
      moduleName: opts.module, // full path for BuildErrorPlan output location
      errorName: opts.name,
      message: opts.message,
      statusCode: parseInt(opts.status as any, 10),
      context: resolved.context,
    };
    const plan = new BuildErrorPlan().build(errorSpec, layout.contextsRoot, layout.importBase);
    await execute(plan, resolved, layout.containerPath, layout.importBase);
  });
}

async function handleEntity(opts: EntityCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    const spec = PieceSpec.create('entity', opts.module, opts.name, opts.fields, resolved.context);
    const plan = new BuildEntityPlan().build(spec, layout.contextsRoot, layout.importBase);
    await execute(plan, resolved, layout.containerPath, layout.importBase);
  });
}

async function handleEvent(opts: EventCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    // Parse 'BC/Shared' → entityName='Shared' for validation, full path kept in spec
    const moduleParts = opts.module.split('/');
    const entityName = moduleParts.length > 1 ? moduleParts[moduleParts.length - 1] : opts.module;
    const spec = PieceSpec.create('event', entityName, opts.name, opts.fields, resolved.context);
    // Override entityName with full module path so BuildEventPlan can resolve output location
    (spec as any).entityName = opts.module;
    const plan = new BuildEventPlan().build(spec, layout.contextsRoot, layout.importBase);
    await execute(plan, resolved, layout.containerPath, layout.importBase);
  });
}

async function handleSubscriber(opts: SubscriberCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    const dependencies = FieldSpec.parseList(opts.fields);
    const subscriberSpec: SubscriberSpec = {
      moduleName: opts.module,
      subscriberName: opts.name,
      eventName: opts.event,
      dependencies,
      context: resolved.context,
    };
    const plan = new BuildSubscriberPlan().build(subscriberSpec, layout.contextsRoot, layout.importBase);
    await execute(plan, resolved, layout.containerPath, layout.importBase);
  });
}

async function handleService(opts: ServiceCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    const methods = opts.methods
      ? opts.methods.split(',').map((m) => m.trim()).filter(Boolean)
      : [];
    const serviceSpec: ServiceSpec = {
      moduleName: opts.module, // full path: 'Shared', 'BC/Shared', or module name
      serviceName: opts.name,
      methods,
      context: resolved.context,
    };
    const plan = new BuildServicePlan().build(serviceSpec, layout.contextsRoot, opts.implName, layout.importBase);
    await execute(plan, resolved, layout.containerPath, layout.importBase);
  });
}

async function handleRepository(opts: RepositoryCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    // Repository doesn't need fields - they come from the Entity
    const spec = PieceSpec.create('repository', opts.module, opts.name, undefined, resolved.context);
    // Parse --db flag, default to all
    const dbs: DbType[] = opts.db
      ? opts.db.split(',').map((d) => d.trim() as DbType).filter(Boolean)
      : ['mongo', 'mysql', 'inmemory'];
    const plan = new BuildRepositoryPlan().build(spec, layout.contextsRoot, dbs, layout.importBase);
    await execute(plan, resolved, layout.containerPath, layout.importBase);
  });
}

async function handleInit(opts: InitCmdOptions): Promise<void> {
  await withErrors(async () => {
    const config: DddCqrsConfig = loadConfig(resolveProjectRoot(process.cwd()));
    const context = opts.context ?? config.defaultContext ?? NEUTRAL_DEFAULT_CONTEXT;
    const target = opts.target ?? '.';
    const contextsRoot = opts.contextsRoot ?? `${target}/${DEFAULT_CONTEXTS_ROOT}`;

    const initOptions: InitOptions = {
      contextName: context,
      projectName: opts.name,
      contextsRoot,
      includeServices: opts.noServices !== true,
    };

    const plan = new BuildInitPlan().build(initOptions);
    await executeInit(plan, opts, target);
  });
}

async function execute(plan: GenerationPlan, opts: CommonOptions, containerPath: string | undefined, importBase: string = '@/Contexts'): Promise<void> {
  const writer = new FileWriter({ force: opts.force, dryRun: opts.dryRun });
  const cwd = process.cwd();

  console.log('');
  console.log(`Files (${plan.files.length}):`);
  for (const file of plan.files) {
    const result = writer.write(file.relPath, file.content);
    const label = result.status === 'created' ? '  +' : result.status === 'overwritten' ? '  ~' : '  =';
    console.log(`${label} ${path.relative(cwd, result.filePath)}`);
  }

  console.log('');
  console.log('Container:');
  if (containerPath) {
    const updater = new ContainerUpdater();
    const containerResult = updater.update(containerPath, plan, { force: opts.force, dryRun: opts.dryRun }, importBase);

    for (const edit of containerResult.edits) {
      console.log(`  ${edit}`);
    }
    for (const skipped of containerResult.skipped) {
      console.log(`  ${skipped}`);
    }
    if (containerResult.edits.length === 0 && containerResult.skipped.length === 0) {
      console.log('  (nothing to do)');
    }
  } else {
    console.log('  (no container file specified — pass --container or set containerPath in ddd-cqrs.config.json)');
  }

  console.log('');
  if (opts.dryRun) {
    console.log('Dry run — no files were written.');
  }
}

async function executeInit(plan: GenerationPlan, opts: InitCmdOptions, target: string): Promise<void> {
  const writer = new FileWriter({ force: opts.force, dryRun: opts.dryRun, baseDir: target });
  const cwd = process.cwd();

  console.log('');
  console.log(`Files (${plan.files.length}):`);
  for (const file of plan.files) {
    const result = writer.write(file.relPath, file.content);
    const label = result.status === 'created' ? '  +' : result.status === 'overwritten' ? '  ~' : '  =';
    console.log(`${label} ${path.relative(cwd, result.filePath)}`);
  }

  console.log('');
  if (opts.dryRun) {
    console.log('Dry run — no files were written.');
  } else {
    console.log('Next steps:');
    console.log(`  1. cd ${target}`);
    console.log('  2. npm install');
    console.log('  3. npm run build');
    console.log('  4. ddd-cqrs gen module --name MyEntity --fields "field:type"');
  }
}

async function withErrors(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (error instanceof ScaffoldingError) {
      console.error(`Error: ${error.message}`);
    } else if (error instanceof Error) {
      console.error(`Unexpected error: ${error.message}`);
    } else {
      console.error(`Unexpected error: ${String(error)}`);
    }
    process.exitCode = 1;
  }
}

if (require.main === module) {
  run();
}
