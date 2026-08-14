import { PieceSpec } from '@/Contexts/Scaffolding/Domain/PieceSpec';
import { deriveEntityNames, handlerVariableName } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan, HandlerRegistration } from '@/Contexts/Scaffolding/Application/Plan';
import {
  renderGenericQuery,
  renderGenericQueryHandler,
} from '@/Contexts/Scaffolding/Infrastructure/Templates/QueryTemplates';

export class BuildQueryPlan {
  build(spec: PieceSpec, contextsRoot: string): GenerationPlan {
    const names: EntityNames = deriveEntityNames(spec.entityName, spec.context);
    const className = `${spec.action}${names.entity}Query`;
    const handlerClassName = `${className}Handler`;
    const dir = `${contextsRoot}/${names.context}/${names.entity}/Application/Queries/${className}`;

    const files = [
      {
        relPath: `${dir}/${className}.ts`,
        content: renderGenericQuery(names, spec.action, spec.fields),
      },
      {
        relPath: `${dir}/${handlerClassName}.ts`,
        content: renderGenericQueryHandler(names, spec.action, spec.fields),
      },
    ];

    const registrations: HandlerRegistration[] = [
      {
        bus: 'query',
        entity: names.entity,
        handlerClassName,
        importPath: `@/Contexts/${names.context}/${names.entity}/Application/Queries/${className}/${handlerClassName}`,
        instantiation: `new ${handlerClassName}(${names.entityCamel}Repo)`,
        variableName: handlerVariableName(handlerClassName),
      },
    ];

    return { files, registrations };
  }
}
