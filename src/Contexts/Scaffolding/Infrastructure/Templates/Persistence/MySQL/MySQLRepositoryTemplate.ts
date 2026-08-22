import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';

export function renderMySQLRepositoryTemplate(names: EntityNames): string {
  const { entity, entityCamel, context } = names;
  const base = `${names.importBase}/${context}/${entity}`;

  return `import { ${entity} as ${entity}Model } from '${names.importBase}/Shared/Infrastructure/Persistence/sequelize';
import { ${entity} as ${entity}Entity } from '${base}/Domain/${entity}';
import { ${entity}Repository } from '${base}/Domain/${entity}Repository';
import { DatabaseError } from '${names.importBase}/Shared/Domain/Errors/DatabaseError';

export class MySQL${entity}Repository implements ${entity}Repository {
  async save(${entityCamel}: ${entity}Entity): Promise<void> {
    try {
      const p = ${entityCamel}.toPrimitives();
      await ${entity}Model.create(p);
    } catch (error) {
      throw new DatabaseError("Couldn't save ${entityCamel} on database");
    }
  }

  async update(id: string, ${entityCamel}: ${entity}Entity): Promise<void> {
    try {
      const p = ${entityCamel}.toPrimitives();
      const { id: _, ...data } = p;
      await ${entity}Model.update(data, { where: { id } });
    } catch (error) {
      throw new DatabaseError('Failed to update ${entityCamel} data');
    }
  }

  async findById(id: string): Promise<${entity}Entity | null> {
    try {
      const doc = await ${entity}Model.findByPk(id);
      return doc ? this.mapToEntity(doc.toJSON()) : null;
    } catch (error) {
      throw new DatabaseError("Couldn't get ${entityCamel} from database");
    }
  }

  async findOne(criteria: Record<string, unknown>): Promise<${entity}Entity | null> {
    try {
      const doc = await ${entity}Model.findOne({ where: criteria });
      return doc ? this.mapToEntity(doc.toJSON()) : null;
    } catch (error) {
      throw new DatabaseError('Failed to find ${entityCamel} by criteria');
    }
  }

  async find(
    criteria: Record<string, unknown>,
    page: number,
    itemsPerPage: number,
  ): Promise<{ items: ${entity}Entity[]; total: number }> {
    try {
      const { count, rows } = await ${entity}Model.findAndCountAll({
        where: criteria,
        order: [['updatedAt', 'DESC']],
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
      });
      return {
        items: rows.map((e) => this.mapToEntity(e.toJSON())),
        total: count,
      };
    } catch (error) {
      throw new DatabaseError('Failed to find ${entityCamel}s');
    }
  }

  async findAll(): Promise<${entity}Entity[]> {
    try {
      const docs = await ${entity}Model.findAll({ order: [['updatedAt', 'DESC']] });
      return docs.map((e) => this.mapToEntity(e.toJSON()));
    } catch (error) {
      throw new DatabaseError('Failed to find all ${entityCamel}s');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await ${entity}Model.destroy({ where: { id } });
    } catch (error) {
      throw new DatabaseError('Failed to delete ${entityCamel} data');
    }
  }

  private mapToEntity(data: any): ${entity}Entity {
    return ${entity}Entity.fromPrimitives(data);
  }
}
`;
}
