import { deriveEntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';
import type { GenerationPlan } from '@/Contexts/Scaffolding/Application/Plan';
import { renderSubscriberTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/SubscriberTemplate';

export interface SubscriberSpec {
  moduleName: string;
  subscriberName: string;
  eventName: string;
  dependencies: FieldSpec[];
  context: string;
}

export class BuildSubscriberPlan {
  build(spec: SubscriberSpec, contextsRoot: string, importBase: string = '@/Contexts'): GenerationPlan {
    const names: EntityNames = deriveEntityNames(spec.moduleName, spec.context, importBase);

    return {
      files: [
        {
          relPath: `${contextsRoot}/${names.context}/${names.entity}/Application/Events/${spec.subscriberName}.ts`,
          content: renderSubscriberTemplate(names, spec.subscriberName, spec.eventName, spec.dependencies),
        },
      ],
      registrations: [],
    };
  }
}
