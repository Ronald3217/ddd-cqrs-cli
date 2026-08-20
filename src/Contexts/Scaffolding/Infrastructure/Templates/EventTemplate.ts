import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';
import { tsType } from './TypeMappings';

export function renderEventTemplate(
  names: EntityNames,
  eventName: string,
  fields: FieldSpec[],
): string {
  const { entity, context } = names;

  const fieldParams = fields
    .map((f) => `    public readonly ${f.name}: ${tsType(f.type)},`)
    .join('\n');

  const toPrimitivesEntries = fields
    .map((f) => `      ${f.name}: this.${f.name},`)
    .join('\n');

  const lines: string[] = [];

  lines.push(`import { DomainEvent } from '@/Contexts/Shared/Domain/Events/DomainEvent';`);
  lines.push('');
  lines.push(`export class ${eventName} extends DomainEvent {`);
  lines.push(`  constructor(`);
  lines.push(`    aggregateId: string,`);
  if (fields.length > 0) {
    lines.push(fieldParams);
  }
  lines.push(`  ) {`);
  lines.push(`    super(aggregateId);`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  toPrimitives(): Record<string, unknown> {`);
  lines.push(`    return {`);
  lines.push(`      ${entity.toLowerCase()}Id: this.aggregateId,`);
  if (fields.length > 0) {
    lines.push(toPrimitivesEntries);
  }
  lines.push(`      occurredOn: this.occurredOn,`);
  lines.push(`    };`);
  lines.push(`  }`);
  lines.push(`}`);
  lines.push('');

  return lines.join('\n');
}
