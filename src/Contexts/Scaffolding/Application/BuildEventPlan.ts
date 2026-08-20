import { PieceSpec } from '@/Contexts/Scaffolding/Domain/PieceSpec';
import { deriveEntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan } from '@/Contexts/Scaffolding/Application/Plan';
import { renderEventTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/EventTemplate';

export class BuildEventPlan {
  build(spec: PieceSpec, contextsRoot: string): GenerationPlan {
    const names: EntityNames = deriveEntityNames(spec.entityName, spec.context);
    const eventName = spec.action; // The event name comes from the --name option

    return {
      files: [
        {
          relPath: `${contextsRoot}/${names.context}/${names.entity}/Domain/Events/${eventName}.ts`,
          content: renderEventTemplate(names, eventName, spec.fields),
        },
      ],
      registrations: [],
    };
  }
}
