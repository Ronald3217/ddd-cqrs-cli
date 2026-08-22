import { deriveEntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan } from '@/Contexts/Scaffolding/Application/Plan';
import { renderServiceInterfaceTemplate, renderServiceImplementationTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/ServiceTemplates';

export interface ServiceSpec {
  moduleName: string;
  serviceName: string;
  methods: string[];
  context: string;
}

export class BuildServicePlan {
  build(spec: ServiceSpec, contextsRoot: string, implNameOverride?: string, importBase: string = '@/Contexts'): GenerationPlan {
    // Parse 'BC/Shared' → last segment for entity names, full path for output location
    const moduleParts = spec.moduleName.split('/');
    const entityName = moduleParts.length > 1 ? moduleParts[moduleParts.length - 1] : spec.moduleName;
    const names: EntityNames = deriveEntityNames(entityName, spec.context, importBase);

    // Use override if provided, otherwise default to {ServiceName}Impl
    const implName = implNameOverride ?? `${spec.serviceName}Impl`;

    // Determine base path:
    //  --module Shared              → ${contextsRoot}/Shared/
    //  --module AdLinksManager/Shared → ${contextsRoot}/AdLinksManager/Shared/
    //  --module User                → ${contextsRoot}/${context}/User/
    const modulePath = spec.moduleName;
    let base: string;
    if (modulePath === 'Shared') {
      base = `${contextsRoot}/Shared`;
    } else if (modulePath.endsWith('/Shared')) {
      const bcName = modulePath.split('/')[0];
      base = `${contextsRoot}/${bcName}/Shared`;
    } else {
      base = `${contextsRoot}/${names.context}/${names.entity}`;
    }

    return {
      files: [
        {
          relPath: `${base}/Domain/Services/${spec.serviceName}.ts`,
          content: renderServiceInterfaceTemplate(names, spec.serviceName, spec.methods),
        },
        {
          relPath: `${base}/Infrastructure/Services/${implName}.ts`,
          content: renderServiceImplementationTemplate(names, spec.serviceName, implName, spec.methods),
        },
      ],
      registrations: [],
    };
  }
}
