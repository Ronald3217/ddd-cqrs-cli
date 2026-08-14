import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';

export function renderRepositoryTemplate(names: EntityNames, _fields: FieldSpec[], owned: boolean): string {
  const { entity, context } = names;
  const findOwned = owned ? `  findAllByOwner(ownerId: string): Promise<${entity}[]>;\n` : '';

  return `import { ${entity} } from '@/Contexts/${context}/${entity}/Domain/${entity}';

export interface ${entity}Repository {
  save(entity: ${entity}): Promise<void>;
  update(id: string, entity: ${entity}): Promise<void>;
  findById(id: string): Promise<${entity} | null>;
  findOne(criteria: Record<string, unknown>): Promise<${entity} | null>;
${findOwned}  findAll(): Promise<${entity}[]>;
  delete(id: string): Promise<void>;
}
`;
}
