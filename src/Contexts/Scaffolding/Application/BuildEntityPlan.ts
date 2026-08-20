import { PieceSpec } from '@/Contexts/Scaffolding/Domain/PieceSpec';
import { deriveEntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan } from '@/Contexts/Scaffolding/Application/Plan';
import { renderEntityTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/EntityTemplate';

export class BuildEntityPlan {
  build(spec: PieceSpec, contextsRoot: string): GenerationPlan {
    const names: EntityNames = deriveEntityNames(spec.entityName, spec.context);

    return {
      files: [
        {
          relPath: `${contextsRoot}/${names.context}/${names.entity}/Domain/${names.entity}.ts`,
          content: renderEntityTemplate(names, spec.fields),
        },
      ],
      registrations: [],
    };
  }
}
