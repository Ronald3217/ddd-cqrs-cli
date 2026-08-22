import { PieceSpec } from '@/Contexts/Scaffolding/Domain/PieceSpec';
import { deriveEntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan } from '@/Contexts/Scaffolding/Application/Plan';
import { renderEventTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/EventTemplate';

export class BuildEventPlan {
  build(spec: PieceSpec, contextsRoot: string, importBase: string = '@/Contexts'): GenerationPlan {
    // Parse 'BC/Shared' → last segment for entity names, full path for output location
    const moduleParts = spec.entityName.split('/');
    const entityName = moduleParts.length > 1 ? moduleParts[moduleParts.length - 1] : spec.entityName;
    const names: EntityNames = deriveEntityNames(entityName, spec.context, importBase);
    const eventName = spec.action; // The event name comes from the --name option

    // Determine output path:
    //  --module Shared              → kernel global:  ${contextsRoot}/Shared/Domain/Events/
    //  --module AdLinksManager/Shared → BC-level shared: ${contextsRoot}/AdLinksManager/Shared/Domain/Events/
    //  --module Link                → module:          ${contextsRoot}/${context}/Link/Domain/Events/
    const modulePath = spec.entityName;
    let relPath: string;
    if (modulePath === 'Shared') {
      relPath = `${contextsRoot}/Shared/Domain/Events/${eventName}.ts`;
    } else if (modulePath.endsWith('/Shared')) {
      const bcName = modulePath.split('/')[0];
      relPath = `${contextsRoot}/${bcName}/Shared/Domain/Events/${eventName}.ts`;
    } else {
      relPath = `${contextsRoot}/${names.context}/${names.entity}/Domain/Events/${eventName}.ts`;
    }

    return {
      files: [
        {
          relPath,
          content: renderEventTemplate(names, eventName, spec.fields),
        },
      ],
      registrations: [],
    };
  }
}
