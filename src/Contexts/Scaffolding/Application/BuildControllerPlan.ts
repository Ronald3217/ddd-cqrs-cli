import { PieceSpec } from '@/Contexts/Scaffolding/Domain/PieceSpec';
import { deriveEntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan, HttpFramework } from '@/Contexts/Scaffolding/Application/Plan';
import { renderControllerTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/Controller';

export class BuildControllerPlan {
  build(spec: PieceSpec, contextsRoot: string, http: HttpFramework = 'express', importBase: string = '@/Contexts'): GenerationPlan {
    const names: EntityNames = deriveEntityNames(spec.entityName, spec.context, importBase);
    const base = `${contextsRoot}/${names.context}/${names.entity}/Infrastructure`;

    return {
      files: [
        {
          relPath: `${base}/${names.entity}Controller.ts`,
          content: renderControllerTemplate(names, spec.fields, http),
        },
      ],
      registrations: [],
    };
  }
}
