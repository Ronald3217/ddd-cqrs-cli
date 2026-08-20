import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';

export function renderMongoDBRepositoryTemplate(names: EntityNames): string {
  const { entity, entityCamel, context } = names;
  const base = `@/Contexts/${context}/${entity}`;

  return `import { ${entity}Model } from './Mongoose${entity}Model';
import { ${entity} } from '${base}/Domain/${entity}';
import { ${entity}Repository } from '${base}/Domain/${entity}Repository';
import { DatabaseError } from '@/Contexts/Shared/Domain/Errors/DatabaseError';

export class MongoDB${entity}Repository implements ${entity}Repository {
  async save(${entityCamel}: ${entity}): Promise<void> {
    try {
      const data = ${entityCamel}.toPrimitives();
      const doc = new ${entity}Model({ _id: data.id, ...data });
      await doc.save();
    } catch (error) {
      throw new DatabaseError("Couldn't save ${entityCamel} on database");
    }
  }

  async update(id: string, ${entityCamel}: ${entity}): Promise<void> {
    try {
      const { id: _, ...data } = ${entityCamel}.toPrimitives();
      await ${entity}Model.findByIdAndUpdate(id, data, { new: true }).exec();
    } catch (error) {
      throw new DatabaseError('Failed to update ${entityCamel} data');
    }
  }

  async findById(id: string): Promise<${entity} | null> {
    try {
      const doc = await ${entity}Model.findById(id).exec();
      return doc ? this.mapToEntity(doc.toJSON()) : null;
    } catch (error) {
      throw new DatabaseError("Couldn't get ${entityCamel} from database");
    }
  }

  async findOne(criteria: Record<string, unknown>): Promise<${entity} | null> {
    try {
      const doc = await ${entity}Model.findOne(criteria).exec();
      return doc ? this.mapToEntity(doc.toJSON()) : null;
    } catch (error) {
      throw new DatabaseError('Failed to find ${entityCamel} by criteria');
    }
  }

  async find(
    criteria: Record<string, unknown>,
    page: number,
    itemsPerPage: number,
  ): Promise<{ items: ${entity}[]; total: number }> {
    try {
      const total = await ${entity}Model.countDocuments(criteria).exec();
      const docs = await ${entity}Model.find(criteria)
        .sort('-updatedAt')
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .exec();
      return {
        items: docs.map((d) => this.mapToEntity(d.toJSON())),
        total,
      };
    } catch (error) {
      throw new DatabaseError('Failed to find ${entityCamel}s');
    }
  }

  async findAll(): Promise<${entity}[]> {
    try {
      const docs = await ${entity}Model.find().sort('-updatedAt').exec();
      return docs.map((d) => this.mapToEntity(d.toJSON()));
    } catch (error) {
      throw new DatabaseError('Failed to find all ${entityCamel}s');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await ${entity}Model.findByIdAndDelete(id).exec();
    } catch (error) {
      throw new DatabaseError('Failed to delete ${entityCamel} data');
    }
  }

  private mapToEntity(data: any): ${entity} {
    return ${entity}.fromPrimitives({
      id: data._id,
      ...data,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
`;
}
