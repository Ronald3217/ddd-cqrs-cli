import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';

export function renderRepositoryTemplate(names: EntityNames): string {
  const { entity, context } = names;

  return `import { ${entity} } from '@/Contexts/${context}/${entity}/Domain/${entity}';

export interface ${entity}Repository {
  save(entity: ${entity}): Promise<void>;
  update(id: string, entity: ${entity}): Promise<void>;
  findById(id: string): Promise<${entity} | null>;
  findOne(criteria: Record<string, unknown>): Promise<${entity} | null>;
  find(criteria: Record<string, unknown>, page: number, itemsPerPage: number): Promise<{ items: ${entity}[]; total: number }>;
  findAll(): Promise<${entity}[]>;
  delete(id: string): Promise<void>;
}
`;
}
