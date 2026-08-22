import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';

export function renderErrorTemplate(
  names: EntityNames,
  errorName: string,
  message: string,
  statusCode: number,
): string {
  const lines: string[] = [];

  lines.push(`import { DomainError } from '${names.importBase}/Shared/Domain/DomainError';`);
  lines.push('');
  lines.push(`export class ${errorName} extends DomainError {`);
  lines.push(`  constructor() {`);
  lines.push(`    super('${message}', ${statusCode});`);
  lines.push(`  }`);
  lines.push(`}`);
  lines.push('');

  return lines.join('\n');
}
