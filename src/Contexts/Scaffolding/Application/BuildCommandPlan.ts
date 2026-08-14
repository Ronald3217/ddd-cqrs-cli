import { PieceSpec } from '@/Contexts/Scaffolding/Domain/PieceSpec';
import { deriveEntityNames, handlerVariableName } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan, HandlerRegistration } from '@/Contexts/Scaffolding/Application/Plan';
import {
  renderGenericCommand,
  renderGenericCommandHandler,
} from '@/Contexts/Scaffolding/Infrastructure/Templates/CommandTemplates';

export class BuildCommandPlan {
  build(spec: PieceSpec, contextsRoot: string): GenerationPlan {
    const names: EntityNames = deriveEntityNames(spec.entityName, spec.context);
    const className = `${spec.action}${names.entity}Command`;
    const handlerClassName = `${className}Handler`;
    const dir = `${contextsRoot}/${names.context}/${names.entity}/Application/Commands/${className}`;

    const files = [
      {
        relPath: `${dir}/${className}.ts`,
        content: renderGenericCommand(names, spec.action, spec.fields),
      },
      {
        relPath: `${dir}/${handlerClassName}.ts`,
        content: renderGenericCommandHandler(names, spec.action, spec.fields),
      },
    ];

    const registrations: HandlerRegistration[] = [
      {
        bus: 'command',
        entity: names.entity,
        handlerClassName,
        importPath: `@/Contexts/${names.context}/${names.entity}/Application/Commands/${className}/${handlerClassName}`,
        instantiation: `new ${handlerClassName}(${names.entityCamel}Repo)`,
        variableName: handlerVariableName(handlerClassName),
      },
    ];

    return { files, registrations };
  }
}
