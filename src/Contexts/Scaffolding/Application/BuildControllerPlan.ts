import { PieceSpec } from '@/Contexts/Scaffolding/Domain/PieceSpec';
import { deriveEntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan } from '@/Contexts/Scaffolding/Application/Plan';
import { renderControllerTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/ControllerTemplate';
import { renderRouterTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/RouterTemplate';

export class BuildControllerPlan {
  build(spec: PieceSpec, contextsRoot: string): GenerationPlan {
    const names: EntityNames = deriveEntityNames(spec.entityName, spec.context);
    const base = `${contextsRoot}/${names.context}/${names.entity}/Infrastructure`;

    return {
      files: [
        {
          relPath: `${base}/${names.entity}Controller.ts`,
          content: renderControllerTemplate(names, spec.fields),
        },
        {
          relPath: `${base}/${names.entity}Router.ts`,
          content: renderRouterTemplate(names),
        },
      ],
      registrations: [],
    };
  }
}
