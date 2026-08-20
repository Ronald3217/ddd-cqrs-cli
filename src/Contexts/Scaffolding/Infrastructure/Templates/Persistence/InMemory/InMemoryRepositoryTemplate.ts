import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';

export function renderInMemoryRepositoryTemplate(names: EntityNames): string {
  const { entity, entityCamel, context } = names;
  const base = `@/Contexts/${context}/${entity}`;

  return `import { ${entity} } from '${base}/Domain/${entity}';
import { ${entity}Repository } from '${base}/Domain/${entity}Repository';

export class InMemory${entity}Repository implements ${entity}Repository {
  private entities: Map<string, ${entity}> = new Map();

  async save(${entityCamel}: ${entity}): Promise<void> {
    this.entities.set(${entityCamel}.id.value, ${entityCamel});
  }

  async update(id: string, ${entityCamel}: ${entity}): Promise<void> {
    this.entities.set(id, ${entityCamel});
  }

  async findById(id: string): Promise<${entity} | null> {
    return this.entities.get(id) ?? null;
  }

  async findOne(criteria: Record<string, unknown>): Promise<${entity} | null> {
    for (const ${entityCamel} of this.entities.values()) {
      let matches = true;
      for (const [key, value] of Object.entries(criteria)) {
        const candidate = (${entityCamel} as any)[key];
        if (candidate !== value) {
          matches = false;
          break;
        }
      }
      if (matches) return ${entityCamel};
    }
    return null;
  }

  async find(
    criteria: Record<string, unknown>,
    page: number,
    itemsPerPage: number,
  ): Promise<{ items: ${entity}[]; total: number }> {
    let filtered = [...this.entities.values()];

    for (const [key, value] of Object.entries(criteria)) {
      filtered = filtered.filter((${entityCamel}) => {
        const candidate = (${entityCamel} as any)[key];
        return candidate === value;
      });
    }

    const total = filtered.length;
    const start = (page - 1) * itemsPerPage;
    const items = filtered.slice(start, start + itemsPerPage);
    return { items, total };
  }

  async findAll(): Promise<${entity}[]> {
    return [...this.entities.values()];
  }

  async delete(id: string): Promise<void> {
    this.entities.delete(id);
  }

  load(entities: ${entity}[]): void {
    for (const e of entities) {
      this.entities.set(e.id.value, e);
    }
  }

  clear(): void {
    this.entities.clear();
  }
}
`;
}
