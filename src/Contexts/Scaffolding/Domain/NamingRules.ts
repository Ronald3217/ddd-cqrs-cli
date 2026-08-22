import { ScaffoldingError } from './ScaffoldingError';

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;
const CAMEL_CASE = /^[a-z][A-Za-z0-9]*$/;

export function assertPascalCase(value: string, label: string): string {
  if (!PASCAL_CASE.test(value)) {
    const hint = /\s/.test(value)
      ? ' (no spaces or accents; e.g. "BlogPost")'
      : '';
    throw new ScaffoldingError(
      `${label} must be in PascalCase (e.g. BlogPost, MyContext) - got "${value}"${hint}`,
    );
  }
  return value;
}

// Endings that commonly end in "s" yet are singular (class, status, bus, analysis).
const SINGULAR_S_ENDINGS = /(ss|us|is)$/;

export function assertSingularEntityName(value: string, label: string): string {
  const pascal = assertPascalCase(value, label);
  if (pascal.endsWith('s') && !SINGULAR_S_ENDINGS.test(pascal)) {
    throw new ScaffoldingError(
      `${label} must be singular: "${value}" looks plural - use "${suggestSingular(pascal)}" (e.g. Product, not Products)`,
    );
  }
  return pascal;
}

function suggestSingular(pascal: string): string {
  if (pascal.endsWith('ies') && pascal.length > 3) return `${pascal.slice(0, -3)}y`; // categories -> category
  if (pascal.endsWith('es') && pascal.length > 2) return pascal.slice(0, -2); // boxes -> box, watches -> watch
  return pascal.slice(0, -1); // products -> product
}

export function assertCamelCase(value: string, label: string): string {
  if (!CAMEL_CASE.test(value)) {
    const hint = /\s/.test(value)
      ? ' (no spaces or accents; e.g. "title")'
      : '';
    throw new ScaffoldingError(
      `${label} must be in camelCase (e.g. title, itemsPerPage) - got "${value}"${hint}`,
    );
  }
  return value;
}

export function toCamelCase(pascalCase: string): string {
  if (pascalCase.length === 0) return pascalCase;
  return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
}

export function pluralize(value: string): string {
  if (/[^aeiouAEIOU]y$/.test(value)) return `${value.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/.test(value)) return `${value}es`;
  return `${value}s`;
}

export interface EntityNames {
  entity: string;
  entityCamel: string;
  entityPlural: string;
  entityPluralLower: string;
  context: string;
  contextCamel: string;
  importBase: string;
}

export function deriveEntityNames(entity: string, context: string, importBase: string = '@/Contexts'): EntityNames {
  const entityName = assertSingularEntityName(entity, 'Entity name');
  const contextName = assertPascalCase(context, 'Context name');
  return {
    entity: entityName,
    entityCamel: toCamelCase(entityName),
    entityPlural: pluralize(entityName),
    entityPluralLower: toCamelCase(pluralize(entityName)),
    context: contextName,
    contextCamel: toCamelCase(contextName),
    importBase,
  };
}

export function handlerVariableName(handlerClassName: string): string {
  const base = handlerClassName
    .replace(/CommandHandler$/, '')
    .replace(/QueryHandler$/, '');
  return `${toCamelCase(base)}Handler`;
}
