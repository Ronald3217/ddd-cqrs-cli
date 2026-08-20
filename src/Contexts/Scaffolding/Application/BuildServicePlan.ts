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
  build(spec: ServiceSpec, contextsRoot: string, implNameOverride?: string): GenerationPlan {
    const names: EntityNames = deriveEntityNames(spec.moduleName, spec.context);

    // Use override if provided, otherwise default to {ServiceName}Impl
    const implName = implNameOverride ?? `${spec.serviceName}Impl`;

    return {
      files: [
        {
          relPath: `${contextsRoot}/${names.context}/${names.entity}/Domain/Services/${spec.serviceName}.ts`,
          content: renderServiceInterfaceTemplate(names, spec.serviceName, spec.methods),
        },
        {
          relPath: `${contextsRoot}/${names.context}/${names.entity}/Infrastructure/Services/${implName}.ts`,
          content: renderServiceImplementationTemplate(names, spec.serviceName, implName, spec.methods),
        },
      ],
      registrations: [],
    };
  }
}
