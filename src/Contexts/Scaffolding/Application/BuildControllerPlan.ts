import { PieceSpec } from '@/Contexts/Scaffolding/Domain/PieceSpec';
import { deriveEntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import { ScaffoldingError } from '@/Contexts/Scaffolding/Domain/ScaffoldingError';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan } from '@/Contexts/Scaffolding/Application/Plan';
import { renderControllerTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/ControllerTemplate';
import { renderRouterTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/RouterTemplate';

export interface ControllerOptions {
  admin: boolean;
  owned: boolean;
}

export class BuildControllerPlan {
  build(spec: PieceSpec, contextsRoot: string, options: ControllerOptions): GenerationPlan {
    if (options.owned && spec.fields.some((f) => f.name === 'ownerId')) {
      throw new ScaffoldingError(
        'Field name "ownerId" is generated automatically by --owned and cannot be passed in --fields',
      );
    }
    const names: EntityNames = deriveEntityNames(spec.entityName, spec.context);
    const base = `${contextsRoot}/${names.context}/${names.entity}/Infrastructure`;

    return {
      files: [
        {
          relPath: `${base}/${names.entity}Controller.ts`,
          content: renderControllerTemplate(names, spec.fields, options),
        },
        {
          relPath: `${base}/${names.entity}Router.ts`,
          content: renderRouterTemplate(names, options),
        },
      ],
      registrations: [],
    };
  }
}
