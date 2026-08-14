import { PieceSpec } from '@/Contexts/Scaffolding/Domain/PieceSpec';
import { deriveEntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan } from '@/Contexts/Scaffolding/Application/Plan';
import { renderSchemaTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/SchemaTemplate';

export class BuildSchemaPlan {
  build(spec: PieceSpec, contextsRoot: string): GenerationPlan {
    const names: EntityNames = deriveEntityNames(spec.entityName, spec.context);
    return {
      files: [
        {
          relPath: `${contextsRoot}/${names.context}/${names.entity}/Infrastructure/Schemas/${names.entity}Schemas.ts`,
          content: renderSchemaTemplate(names, spec.fields),
        },
      ],
      registrations: [],
    };
  }
}
