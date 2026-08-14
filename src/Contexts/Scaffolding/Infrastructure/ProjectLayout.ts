import * as path from 'path';
import { existsSync, readFileSync } from 'fs';
import { ScaffoldingError } from '@/Contexts/Scaffolding/Domain/ScaffoldingError';

export interface ProjectLayout {
  projectRoot: string;
  contextsRoot: string;
  containerPath?: string;
}

export interface LayoutOptions {
  contextsRoot?: string;
  container?: string;
  context: string;
}

export interface DddCqrsConfig {
  contextRoot?: string;
  defaultContext?: string;
  containerPath?: string;
  ownership?: boolean;
}

const CONFIG_FILENAME = 'ddd-cqrs.config.json';
const LEGACY_CONFIG_FILENAME = '.ddd-cqrs.json';

export function resolveProjectRoot(startDir: string): string {
  let current = path.resolve(startDir);
  for (;;) {
    if (existsSync(path.join(current, 'package.json'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new ScaffoldingError(
        'Could not find a package.json while walking up from the current directory — run ddd-cqrs from inside a Node.js project',
      );
    }
    current = parent;
  }
}

export function resolveAbsolutePath(value: string, projectRoot: string): string {
  return path.isAbsolute(value) ? value : path.resolve(projectRoot, value);
}

export function loadConfig(projectRoot: string): DddCqrsConfig {
  const configPath = path.join(projectRoot, CONFIG_FILENAME);
  if (existsSync(configPath)) {
    return parseConfig(configPath, CONFIG_FILENAME);
  }
  const legacyPath = path.join(projectRoot, LEGACY_CONFIG_FILENAME);
  if (existsSync(legacyPath)) {
    return parseConfig(legacyPath, LEGACY_CONFIG_FILENAME);
  }
  return {};
}

function parseConfig(configPath: string, filename: string): DddCqrsConfig {
  try {
    const raw = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
    const pick = (key: string): string | undefined =>
      typeof raw[key] === 'string' && raw[key] !== '' ? (raw[key] as string) : undefined;
    return {
      contextRoot: pick('contextRoot'),
      defaultContext: pick('defaultContext'),
      containerPath: pick('containerPath'),
      ownership: raw.ownership === true ? true : undefined,
    };
  } catch {
    console.warn(`[ddd-cqrs] Warning: "${filename}" is not valid JSON — using defaults.`);
    return {};
  }
}

export function resolveLayout(options: LayoutOptions): ProjectLayout {
  const projectRoot = resolveProjectRoot(process.cwd());
  const contextsRoot = resolveAbsolutePath(options.contextsRoot ?? 'src/Contexts', projectRoot);
  const containerPath = options.container
    ? resolveAbsolutePath(options.container, projectRoot)
    : undefined;
  return {
    projectRoot,
    contextsRoot,
    containerPath,
  };
}
