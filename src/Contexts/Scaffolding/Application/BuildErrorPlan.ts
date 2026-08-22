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
  build(spec: ErrorSpec, contextsRoot: string, importBase: string = '@/Contexts'): GenerationPlan {
    // Parse 'BC/Shared' → last segment for entity names, full path for output location
    const moduleParts = spec.moduleName.split('/');
    const entityName = moduleParts.length > 1 ? moduleParts[moduleParts.length - 1] : spec.moduleName;
    const names: EntityNames = deriveEntityNames(entityName, spec.context, importBase);

    // Determine output path:
    //  --module Shared              → kernel global:  ${contextsRoot}/Shared/Domain/Errors/
    //  --module AdLinksManager/Shared → BC-level shared: ${contextsRoot}/AdLinksManager/Shared/Domain/Errors/
    //  --module User                → module:          ${contextsRoot}/${context}/User/Domain/Errors/
    const modulePath = spec.moduleName;
    let relPath: string;
    if (modulePath === 'Shared') {
      relPath = `${contextsRoot}/Shared/Domain/Errors/${spec.errorName}.ts`;
    } else if (modulePath.endsWith('/Shared')) {
      const bcName = modulePath.split('/')[0];
      relPath = `${contextsRoot}/${bcName}/Shared/Domain/Errors/${spec.errorName}.ts`;
    } else {
      relPath = `${contextsRoot}/${names.context}/${names.entity}/Domain/Errors/${spec.errorName}.ts`;
    }

    return {
      files: [
        {
          relPath,
          content: renderErrorTemplate(names, spec.errorName, spec.message, spec.statusCode),
        },
      ],
      registrations: [],
    };
  }
}
