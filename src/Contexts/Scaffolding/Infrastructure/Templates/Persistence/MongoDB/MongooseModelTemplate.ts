import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';

export function renderMongooseModelTemplate(names: EntityNames): string {
  const { entity, entityCamel, entityPluralLower } = names;

  return `import { Schema, model } from 'mongoose';

const ${entityCamel}Schema = new Schema(
  {
    _id: { type: String, required: true },
    // TODO: Add field types from Entity definition
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { timestamps: false, versionKey: false, _id: false },
);

export const ${entity}Model = model('${entityPluralLower}', ${entityCamel}Schema);
`;
}
