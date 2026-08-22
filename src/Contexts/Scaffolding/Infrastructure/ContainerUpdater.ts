import { existsSync, readFileSync, writeFileSync } from 'fs';
import type { GenerationPlan, HandlerRegistration, RepositoryWiring } from '@/Contexts/Scaffolding/Application/Plan';
import { ScaffoldingError } from '@/Contexts/Scaffolding/Domain/ScaffoldingError';

export interface ContainerEditOptions {
  force: boolean;
  dryRun: boolean;
}

export interface ContainerEditResult {
  containerPath: string;
  changed: boolean;
  edits: string[];
  skipped: string[];
}

const DOMAIN_REPO_IMPORT_RE = /^import \{ \w+Repository \} from '@\/[^']*\/Domain\/\w+Repository';$/;
const REPO_SECTION_HEADER_RE = /^\/\/ Repositories - /;
const COMMAND_HEADER_RE = /^\/\/ Command Handlers - /;
const QUERY_HEADER_RE = /^\/\/ Query Handlers - /;
const CLASS_OPEN_RE = /^export class Container \{$/;
const PUBLIC_REPO_PROP_RE = /^  public readonly \w+Repository: \w+Repository;$/;
const REPO_CONST_RE = /^    const \w+Repo = /;
const REPO_ASSIGNMENT_RE = /^    this\.\w+Repository = \w+Repo;$/;
const QUERY_HANDLERS_MARKER_RE = /^    \/\/ Query Handlers$/;
const BUILD_BUSES_MARKER_RE = /^    \/\/ Build Buses$/;
const COMMAND_BUS_OPEN_RE = /^    this\.commandBus = new InMemoryCommandBus\(\[$/;
const QUERY_BUS_OPEN_RE = /^    this\.queryBus = new InMemoryQueryBus\(\[$/;
const ARRAY_CLOSE_RE = /^    \]\);$/;

export class ContainerUpdater {
  update(containerPath: string, plan: GenerationPlan, options: ContainerEditOptions, importBase: string = '@/Contexts'): ContainerEditResult {
    const result: ContainerEditResult = { containerPath, changed: false, edits: [], skipped: [] };

    if (!existsSync(containerPath)) {
      throw new ScaffoldingError(
        `Container file not found: ${containerPath} (pass --container or set containerPath in ddd-cqrs.config.json)`,
      );
    }

    const original = readFileSync(containerPath, 'utf-8');
    const eol = original.includes('\r\n') ? '\r\n' : '\n';
    const lines = original.split(/\r?\n/);

    const note = (kind: 'edit' | 'skip', message: string): void => {
      (kind === 'edit' ? result.edits : result.skipped).push(message);
      result.changed = result.changed || kind === 'edit';
    };

    const addWiring = (wiring: RepositoryWiring): void => {
      const { context, entity, entityCamel } = wiring;
      const base = `${importBase}/${context}/${entity}`;

      const interfaceImport = `import { ${entity}Repository } from '${base}/Domain/${entity}Repository';`;
      if (lines.includes(interfaceImport)) {
        note('skip', `= Domain repository interface already imported: ${entity}Repository`);
      } else {
        const anchor = findLastIndex(lines, DOMAIN_REPO_IMPORT_RE);
        if (anchor >= 0) {
          lines.splice(anchor + 1, 0, interfaceImport);
          note('edit', `+ import domain repository interface ${entity}Repository`);
        } else {
          result.skipped.push(`? no anchor for ${entity}Repository interface import`);
        }
      }

      const sectionHeader = `// Repositories - ${entity}`;
      const mongoImport = `import { MongoDB${entity}Repository } from '${base}/Infrastructure/Persistence/MongoDB${entity}Repository';`;
      const mysqlImport = `import { MySQL${entity}Repository } from '${base}/Infrastructure/Persistence/MySQL${entity}Repository';`;

      if (lines.includes(sectionHeader)) {
        const headerIdx = lines.indexOf(sectionHeader);
        if (!lines.includes(mysqlImport)) {
          lines.splice(headerIdx + 1, 0, mysqlImport);
          note('edit', `+ import MySQL${entity}Repository`);
        } else {
          note('skip', `= MySQL${entity}Repository import already present`);
        }
        if (!lines.includes(mongoImport)) {
          lines.splice(headerIdx + 1, 0, mongoImport);
          note('edit', `+ import MongoDB${entity}Repository`);
        } else {
          note('skip', `= MongoDB${entity}Repository import already present`);
        }
      } else {
        const block = ['', sectionHeader, mongoImport, mysqlImport];
        const inserted = insertBeforeHeader(lines, COMMAND_HEADER_RE, CLASS_OPEN_RE, block);
        if (inserted) {
          note('edit', `+ repositories import section for ${entity}`);
        } else {
          result.skipped.push(`? no anchor for repositories import section of ${entity}`);
        }
      }

      const property = `  public readonly ${entityCamel}Repository: ${entity}Repository;`;
      if (lines.includes(property)) {
        note('skip', `= public property ${entityCamel}Repository already present`);
      } else {
        const anchor = findLastIndex(lines, PUBLIC_REPO_PROP_RE);
        if (anchor >= 0) {
          lines.splice(anchor + 1, 0, property);
          note('edit', `+ public property ${entityCamel}Repository`);
        } else {
          result.skipped.push(`? no anchor for ${entityCamel}Repository public property`);
        }
      }

      const repoConst = `    const ${entityCamel}Repo = env.DB_MODE`;
      const repoBlock = [
        '',
        repoConst,
        `      ? new MongoDB${entity}Repository()`,
        `      : new MySQL${entity}Repository();`,
      ];
      if (lines.includes(repoConst)) {
        note('skip', `= repository const ${entityCamel}Repo already present`);
      } else {
        const anchor = findLastIndex(lines, REPO_CONST_RE);
        if (anchor >= 0) {
          lines.splice(anchor + 1, 0, ...repoBlock);
          note('edit', `+ repository const ${entityCamel}Repo`);
        } else {
          result.skipped.push(`? no anchor for ${entityCamel}Repo const`);
        }
      }

      const assignment = `    this.${entityCamel}Repository = ${entityCamel}Repo;`;
      if (lines.includes(assignment)) {
        note('skip', `= repository assignment ${entityCamel}Repository already present`);
      } else {
        const anchor = findLastIndex(lines, REPO_ASSIGNMENT_RE);
        if (anchor >= 0) {
          lines.splice(anchor + 1, 0, assignment);
          note('edit', `+ repository assignment ${entityCamel}Repository`);
        } else {
          result.skipped.push(`? no anchor for ${entityCamel}Repository assignment`);
        }
      }
    };

    const addImports = (registrations: HandlerRegistration[], sectionLabel: string): void => {
      const unique = registrations.filter(
        (reg, i) => registrations.findIndex((r) => r.handlerClassName === reg.handlerClassName) === i,
      );
      const missing = unique.filter((reg) => {
        const importLine = `import { ${reg.handlerClassName} } from '${reg.importPath}';`;
        return !lines.includes(importLine);
      });
      if (missing.length === 0) {
        for (const reg of unique) {
          note('skip', `= handler import already present: ${reg.handlerClassName}`);
        }
        return;
      }

      const headerLine = `// ${sectionLabel} - ${unique[0].entity}`;
      if (lines.includes(headerLine)) {
        const idx = lines.indexOf(headerLine);
        let insertAt = idx + 1;
        for (const reg of missing) {
          lines.splice(insertAt, 0, `import { ${reg.handlerClassName} } from '${reg.importPath}';`);
          note('edit', `+ import handler ${reg.handlerClassName}`);
          insertAt += 1;
        }
      } else {
        const block = ['', headerLine];
        for (const reg of missing) {
          block.push(`import { ${reg.handlerClassName} } from '${reg.importPath}';`);
        }
        const anchorRe = sectionLabel === 'Command Handlers' ? QUERY_HEADER_RE : null;
        const inserted = insertBeforeHeader(lines, anchorRe, CLASS_OPEN_RE, block);
        if (inserted) {
          note('edit', `+ ${sectionLabel} import section for ${unique[0].entity}`);
        } else {
          result.skipped.push(`? no anchor for ${sectionLabel} import section of ${unique[0].entity}`);
        }
      }
    };

    const addInstantiations = (registrations: HandlerRegistration[], markerRe: RegExp | null): string[] => {
      const inserted: string[] = [];
      for (const reg of registrations) {
        const constLine = `    const ${reg.variableName} = ${reg.instantiation};`;
        if (lines.some((l) => l.startsWith(`    const ${reg.variableName} =`))) {
          note('skip', `= handler const already present: ${reg.variableName}`);
          continue;
        }
        const anchor = markerRe ? findIndex(lines, markerRe) : -1;
        if (anchor >= 0) {
          lines.splice(anchor, 0, constLine);
          inserted.push(reg.variableName);
          note('edit', `+ handler const ${reg.variableName}`);
        } else {
          result.skipped.push(`? no anchor for handler const ${reg.variableName}`);
        }
      }
      return inserted;
    };

    const addBusEntries = (registrations: HandlerRegistration[], bus: 'command' | 'query', insertedVars: string[]): void => {
      const busRegs = registrations.filter((r) => r.bus === bus && insertedVars.includes(r.variableName));
      if (busRegs.length === 0) return;

      const openRe = bus === 'command' ? COMMAND_BUS_OPEN_RE : QUERY_BUS_OPEN_RE;
      const openIdx = findIndex(lines, openRe);
      if (openIdx < 0) {
        result.skipped.push(`? no ${bus}Bus opening found`);
        return;
      }
      const closeIdx = lines.findIndex((l, i) => i > openIdx && ARRAY_CLOSE_RE.test(l));
      if (closeIdx < 0) {
        result.skipped.push(`? no ${bus}Bus array closing found`);
        return;
      }

      for (const reg of busRegs) {
        const entry = `      ${reg.variableName},`;
        if (lines.includes(entry)) {
          note('skip', `= ${bus}Bus entry already present: ${reg.variableName}`);
          continue;
        }
        lines.splice(closeIdx, 0, entry);
        note('edit', `+ ${bus}Bus entry ${reg.variableName}`);
      }
    };

    if (plan.repositoryWiring) {
      addWiring(plan.repositoryWiring);
    }

    const commandRegs = plan.registrations.filter((r) => r.bus === 'command');
    const queryRegs = plan.registrations.filter((r) => r.bus === 'query');

    let insertedCommandVars: string[] = [];
    let insertedQueryVars: string[] = [];

    if (commandRegs.length > 0) {
      addImports(commandRegs, 'Command Handlers');
    }
    if (queryRegs.length > 0) {
      addImports(queryRegs, 'Query Handlers');
    }
    if (commandRegs.length > 0) {
      insertedCommandVars = addInstantiations(commandRegs, QUERY_HANDLERS_MARKER_RE);
    }
    if (queryRegs.length > 0) {
      insertedQueryVars = addInstantiations(queryRegs, BUILD_BUSES_MARKER_RE);
    }
    if (commandRegs.length > 0) {
      addBusEntries(commandRegs, 'command', insertedCommandVars);
    }
    if (queryRegs.length > 0) {
      addBusEntries(queryRegs, 'query', insertedQueryVars);
    }

    if (result.changed) {
      if (!options.dryRun) {
        writeFileSync(containerPath, lines.join(eol), 'utf-8');
      }
    }

    return result;
  }
}

function findIndex(lines: string[], re: RegExp): number {
  return lines.findIndex((l) => re.test(l));
}

function findLastIndex(lines: string[], re: RegExp): number {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (re.test(lines[i])) return i;
  }
  return -1;
}

function insertBeforeHeader(
  lines: string[],
  markerRe: RegExp | null,
  fallbackRe: RegExp | null,
  block: string[],
): boolean {
  let idx = markerRe ? findIndex(lines, markerRe) : -1;
  if (idx < 0 && fallbackRe) idx = findIndex(lines, fallbackRe);
  if (idx < 0) return false;
  lines.splice(idx, 0, ...block);
  return true;
}
