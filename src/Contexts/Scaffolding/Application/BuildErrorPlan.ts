import { deriveEntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan } from '@/Contexts/Scaffolding/Application/Plan';
import { renderErrorTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/ErrorTemplate';

export interface ErrorSpec {
  moduleName: string;
  errorName: string;
  message: string;
  statusCode: number;
  context: string;
}

export class BuildErrorPlan {
  build(spec: ErrorSpec, contextsRoot: string): GenerationPlan {
    const names: EntityNames = deriveEntityNames(spec.moduleName, spec.context);

    return {
      files: [
        {
          relPath: `${contextsRoot}/${names.context}/${names.entity}/Domain/Errors/${spec.errorName}.ts`,
          content: renderErrorTemplate(names, spec.errorName, spec.message, spec.statusCode),
        },
      ],
      registrations: [],
    };
  }
}
