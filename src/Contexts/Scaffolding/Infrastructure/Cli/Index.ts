#!/usr/bin/env node
import { Command } from 'commander';
import * as path from 'path';
import { ScaffoldingError } from '@/Contexts/Scaffolding/Domain/ScaffoldingError';
import { ModuleSpec } from '@/Contexts/Scaffolding/Domain/ModuleSpec';
import { PieceSpec } from '@/Contexts/Scaffolding/Domain/PieceSpec';
import { BuildModulePlan } from '@/Contexts/Scaffolding/Application/BuildModulePlan';
import { BuildCommandPlan } from '@/Contexts/Scaffolding/Application/BuildCommandPlan';
import { BuildQueryPlan } from '@/Contexts/Scaffolding/Application/BuildQueryPlan';
import { BuildControllerPlan } from '@/Contexts/Scaffolding/Application/BuildControllerPlan';
import { BuildSchemaPlan } from '@/Contexts/Scaffolding/Application/BuildSchemaPlan';
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
}

interface SchemaCmdOptions extends CommonOptions {
  module: string;
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
    .version('0.1.0');

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
    .description('Generate Controller and Router for an existing module')
    .requiredOption('--module <entity>', 'Entity/module name in PascalCase'));
  addFieldsOption(controllerCmd);
  addCommonOptions(controllerCmd);
  addExamples(controllerCmd, ['gen controller --module BlogPost']);
  controllerCmd.action(handleController);

  const schemaCmd = addHelpHint(gen
    .command('schema')
    .description('Generate Zod schemas (Create/Update) for an existing module')
    .requiredOption('--module <entity>', 'Entity/module name in PascalCase'));
  addFieldsOption(schemaCmd);
  addCommonOptions(schemaCmd);
  addExamples(schemaCmd, ['gen schema --module BlogPost --fields "title:string,views:number"']);
  schemaCmd.action(handleSchema);

  gen.action(() => {
    gen.help();
  });

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
    const plan = new BuildModulePlan().build(spec, layout.contextsRoot);
    await execute(plan, resolved, layout.containerPath);
  });
}

async function handleCommand(opts: PieceCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    const spec = PieceSpec.create('command', opts.module, opts.name as string, opts.fields, resolved.context);
    const plan = new BuildCommandPlan().build(spec, layout.contextsRoot);
    await execute(plan, resolved, layout.containerPath);
  });
}

async function handleQuery(opts: PieceCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    const spec = PieceSpec.create('query', opts.module, opts.name as string, opts.fields, resolved.context);
    const plan = new BuildQueryPlan().build(spec, layout.contextsRoot);
    await execute(plan, resolved, layout.containerPath);
  });
}

async function handleController(opts: ControllerCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    const spec = PieceSpec.create('controller', opts.module, '', opts.fields, resolved.context);
    const plan = new BuildControllerPlan().build(spec, layout.contextsRoot);
    await execute(plan, resolved, layout.containerPath);
  });
}

async function handleSchema(opts: SchemaCmdOptions): Promise<void> {
  await withErrors(async () => {
    const { resolved, layout } = resolveExecution(opts);
    const spec = PieceSpec.create('schema', opts.module, '', opts.fields, resolved.context);
    const plan = new BuildSchemaPlan().build(spec, layout.contextsRoot);
    await execute(plan, resolved, layout.containerPath);
  });
}

async function execute(plan: GenerationPlan, opts: CommonOptions, containerPath: string | undefined): Promise<void> {
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
    const containerResult = updater.update(containerPath, plan, { force: opts.force, dryRun: opts.dryRun });

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
