import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';
import { mongooseType } from './TypeMappings';

export function renderMongoDBRepository(names: EntityNames, fields: FieldSpec[], owned: boolean): string {
  const { entity, entityCamel } = names;
  const mapFields = fields.map((f) => `      ${f.name}: data.${f.name},`).join('\n');
  const ownerIdMap = owned ? `      ownerId: data.ownerId,\n` : '';
  const findOwnedBlock = owned ? `
  async findAllByOwner(ownerId: string): Promise<${entity}[]> {
    try {
      const entities = await ${entity}Model.find({ ownerId }).sort('-updatedAt').exec();
      return entities.map((e) => this.mapToEntity(e.toJSON()));
    } catch (error) {
      throw new DatabaseError('Failed to find ${entityCamel}s by owner');
    }
  }
` : '';

  return `import { ${entity}Model } from './Mongoose${entity}Model';
import { ${entity} } from '../../Domain/${entity}';
import { ${entity}Repository } from '../../Domain/${entity}Repository';
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
      const ${entityCamel} = await ${entity}Model.findById(id).exec();
      return ${entityCamel} ? this.mapToEntity(${entityCamel}.toJSON()) : null;
    } catch (error) {
      throw new DatabaseError("Couldn't get ${entityCamel} from database");
    }
  }

  async findOne(criteria: Record<string, unknown>): Promise<${entity} | null> {
    try {
      const ${entityCamel} = await ${entity}Model.findOne(criteria).exec();
      return ${entityCamel} ? this.mapToEntity(${entityCamel}.toJSON()) : null;
    } catch (error) {
      throw new DatabaseError('Failed to find ${entityCamel} by criteria');
    }
  }
${findOwnedBlock}
  async findAll(): Promise<${entity}[]> {
    try {
      const entities = await ${entity}Model.find().sort('-updatedAt').exec();
      return entities.map((e) => this.mapToEntity(e.toJSON()));
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
${mapFields}
${ownerIdMap}      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
`;
}

export function renderMySQLRepository(names: EntityNames, fields: FieldSpec[], owned: boolean): string {
  const { entity, entityCamel } = names;
  const saveFields = fields.map((f) => `        ${f.name}: p.${f.name},`).join('\n');
  const updateFields = fields.map((f) => `          ${f.name}: p.${f.name},`).join('\n');
  const mapFields = fields.map((f) => `      ${f.name}: data.${f.name},`).join('\n');
  const ownerIdSave = owned ? `        ownerId: p.ownerId,\n` : '';
  const ownerIdUpdate = owned ? `          ownerId: p.ownerId,\n` : '';
  const ownerIdMap = owned ? `      ownerId: data.ownerId,\n` : '';
  const findOwnedBlock = owned ? `
  async findAllByOwner(ownerId: string): Promise<${entity}Entity[]> {
    try {
      const entities = await ${entity}Model.findAll({
        where: { ownerId },
        order: [['updatedAt', 'DESC']],
      });
      return entities.map((e) => this.mapToEntity(e.toJSON()));
    } catch (error) {
      throw new DatabaseError('Failed to find ${entityCamel}s by owner');
    }
  }
` : '';

  return `import { ${entity} as ${entity}Model } from '@/Contexts/Shared/Infrastructure/Persistence/sequelize';
import { ${entity} as ${entity}Entity } from '../../Domain/${entity}';
import { ${entity}Repository } from '../../Domain/${entity}Repository';
import { DatabaseError } from '@/Contexts/Shared/Domain/Errors/DatabaseError';

export class MySQL${entity}Repository implements ${entity}Repository {
  async save(${entityCamel}: ${entity}Entity): Promise<void> {
    try {
      const p = ${entityCamel}.toPrimitives();
      await ${entity}Model.create({
        id: p.id,
${saveFields}
${ownerIdSave}        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      });
    } catch (error) {
      throw new DatabaseError("Couldn't save ${entityCamel} on database");
    }
  }

  async update(id: string, ${entityCamel}: ${entity}Entity): Promise<void> {
    try {
      const p = ${entityCamel}.toPrimitives();
      await ${entity}Model.update(
        {
          id: p.id,
${updateFields}
${ownerIdUpdate}          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        },
        { where: { id } },
      );
    } catch (error) {
      throw new DatabaseError('Failed to update ${entityCamel} data');
    }
  }

  async findById(id: string): Promise<${entity}Entity | null> {
    try {
      const ${entityCamel} = await ${entity}Model.findByPk(id);
      return ${entityCamel} ? this.mapToEntity(${entityCamel}.toJSON()) : null;
    } catch (error) {
      throw new DatabaseError("Couldn't get ${entityCamel} from database");
    }
  }

  async findOne(criteria: Record<string, unknown>): Promise<${entity}Entity | null> {
    try {
      const ${entityCamel} = await ${entity}Model.findOne({ where: criteria });
      return ${entityCamel} ? this.mapToEntity(${entityCamel}.toJSON()) : null;
    } catch (error) {
      throw new DatabaseError('Failed to find ${entityCamel} by criteria');
    }
  }
${findOwnedBlock}
  async findAll(): Promise<${entity}Entity[]> {
    try {
      const entities = await ${entity}Model.findAll({ order: [['updatedAt', 'DESC']] });
      return entities.map((e) => this.mapToEntity(e.toJSON()));
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
    return ${entity}Entity.fromPrimitives({
      id: data.id,
${mapFields}
${ownerIdMap}      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
`;
}

export function renderInMemoryRepository(names: EntityNames, _fields: FieldSpec[], owned: boolean): string {
  const { entity, entityCamel } = names;
  const ownerAccessor = owned
    ? `const candidate = key === 'ownerId' ? ${entityCamel}.ownerId.value : (${entityCamel} as any)[key];`
    : `const candidate = (${entityCamel} as any)[key];`;
  const findOwnedBlock = owned ? `
  async findAllByOwner(ownerId: string): Promise<${entity}[]> {
    const result: ${entity}[] = [];
    for (const ${entityCamel} of this.entities.values()) {
      if (${entityCamel}.ownerId.value === ownerId) {
        result.push(${entityCamel});
      }
    }
    return result;
  }
` : '';

  return `import { ${entity} } from '../../Domain/${entity}';
import { ${entity}Repository } from '../../Domain/${entity}Repository';

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
        ${ownerAccessor}
        if (candidate !== value) {
          matches = false;
          break;
        }
      }
      if (matches) return ${entityCamel};
    }
    return null;
  }
${findOwnedBlock}
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

export function renderMongooseModel(names: EntityNames, fields: FieldSpec[], owned: boolean): string {
  const { entity, entityCamel, entityPluralLower } = names;
  const fieldsBlock = fields
    .map((f) => `    ${f.name}: { type: ${mongooseType(f.type)}, required: true },`)
    .join('\n');
  const ownerIdField = owned ? `    ownerId: { type: String, required: true },\n` : '';

  return `import mongoose, { Schema, model } from 'mongoose';

const ${entityCamel}Schema = new Schema(
  {
    _id: { type: String, required: true },
${fieldsBlock}
${ownerIdField}    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { timestamps: false, versionKey: false, _id: false },
);

export const ${entity}Model = model('${entityPluralLower}', ${entityCamel}Schema);
`;
}
