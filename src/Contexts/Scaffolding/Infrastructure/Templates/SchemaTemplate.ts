import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';
import { zodType } from './TypeMappings';

export function renderSchemaTemplate(names: EntityNames, fields: FieldSpec[]): string {
  const { entity } = names;
  const createEntries = fields
    .map((f) => `  ${f.name}: ${zodType(f.type, fieldLabel(f.name), false)},`)
    .join('\n');
  const updateEntries = fields
    .map((f) => `  ${f.name}: ${zodType(f.type, fieldLabel(f.name), true)},`)
    .join('\n');

  return `import { z } from 'zod';

export const Create${entity}Schema = z.object({
${createEntries}
});

export const Update${entity}Schema = z.object({
${updateEntries}
});
`;
}

function fieldLabel(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
