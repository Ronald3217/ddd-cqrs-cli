import { ModuleSpec } from '@/Contexts/Scaffolding/Domain/ModuleSpec';
import { deriveEntityNames, handlerVariableName } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { GenerationPlan, PlanFile, HandlerRegistration, RepositoryWiring } from '@/Contexts/Scaffolding/Application/Plan';
import { renderEntityTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/EntityTemplate';
import { renderRepositoryTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/RepositoryTemplate';
import {
  renderCreateCommand,
  renderCreateCommandHandler,
  renderUpdateCommand,
  renderUpdateCommandHandler,
  renderDeleteCommand,
  renderDeleteCommandHandler,
} from '@/Contexts/Scaffolding/Infrastructure/Templates/CommandTemplates';
import {
  renderGetByIdQuery,
  renderGetByIdQueryHandler,
} from '@/Contexts/Scaffolding/Infrastructure/Templates/QueryTemplates';
import { renderSchemaTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/SchemaTemplate';
import {
  renderMongoDBRepository,
  renderMySQLRepository,
  renderInMemoryRepository,
  renderMongooseModel,
} from '@/Contexts/Scaffolding/Infrastructure/Templates/Persistence';
import { renderControllerTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/Controller';
import { renderRouterTemplate } from '@/Contexts/Scaffolding/Infrastructure/Templates/Router';

export class BuildModulePlan {
  build(spec: ModuleSpec, contextsRoot: string): GenerationPlan {
    const names: EntityNames = deriveEntityNames(spec.entityName, spec.context);
    const base = `${contextsRoot}/${names.context}/${names.entity}`;
    const files: PlanFile[] = [];
    const registrations: HandlerRegistration[] = [];

    const addFile = (relPath: string, content: string): void => {
      files.push({ relPath, content });
    };

    const addCommand = (action: string, instantiation: string): void => {
      const handlerClassName = `${action}${names.entity}CommandHandler`;
      const dir = `Application/Commands/${action}${names.entity}`;
      registrations.push({
        bus: 'command',
        entity: names.entity,
        handlerClassName,
        importPath: `@/Contexts/${names.context}/${names.entity}/${dir}/${handlerClassName}`,
        instantiation,
        variableName: handlerVariableName(handlerClassName),
      });
    };

    const addQuery = (action: string, instantiation: string): void => {
      const handlerClassName = `${action}QueryHandler`;
      const dir = `Application/Queries/${action}`;
      registrations.push({
        bus: 'query',
        entity: names.entity,
        handlerClassName,
        importPath: `@/Contexts/${names.context}/${names.entity}/${dir}/${handlerClassName}`,
        instantiation,
        variableName: handlerVariableName(handlerClassName),
      });
    };

    addFile(`${base}/Domain/${names.entity}.ts`, renderEntityTemplate(names, spec.fields));
    addFile(`${base}/Domain/${names.entity}Repository.ts`, renderRepositoryTemplate(names));

    addFile(`${base}/Application/Commands/Create${names.entity}/Create${names.entity}Command.ts`, renderCreateCommand(names, spec.fields));
    addFile(`${base}/Application/Commands/Create${names.entity}/Create${names.entity}CommandHandler.ts`, renderCreateCommandHandler(names, spec.fields));
    addCommand('Create', `new Create${names.entity}CommandHandler(${names.entityCamel}Repo, this.idGenerator)`);

    addFile(`${base}/Application/Commands/Update${names.entity}/Update${names.entity}Command.ts`, renderUpdateCommand(names, spec.fields));
    addFile(`${base}/Application/Commands/Update${names.entity}/Update${names.entity}CommandHandler.ts`, renderUpdateCommandHandler(names, spec.fields));
    addCommand('Update', `new Update${names.entity}CommandHandler(${names.entityCamel}Repo)`);

    addFile(`${base}/Application/Commands/Delete${names.entity}/Delete${names.entity}Command.ts`, renderDeleteCommand(names));
    addFile(`${base}/Application/Commands/Delete${names.entity}/Delete${names.entity}CommandHandler.ts`, renderDeleteCommandHandler(names));
    addCommand('Delete', `new Delete${names.entity}CommandHandler(${names.entityCamel}Repo)`);

    addFile(`${base}/Application/Queries/Get${names.entity}ById/Get${names.entity}ByIdQuery.ts`, renderGetByIdQuery(names));
    addFile(`${base}/Application/Queries/Get${names.entity}ById/Get${names.entity}ByIdQueryHandler.ts`, renderGetByIdQueryHandler(names));
    addQuery(`Get${names.entity}ById`, `new Get${names.entity}ByIdQueryHandler(${names.entityCamel}Repo)`);

    addFile(`${base}/Infrastructure/Schemas/${names.entity}Schemas.ts`, renderSchemaTemplate(names, spec.fields));

    addFile(`${base}/Infrastructure/Persistence/MongoDB${names.entity}Repository.ts`, renderMongoDBRepository(names));
    addFile(`${base}/Infrastructure/Persistence/MySQL${names.entity}Repository.ts`, renderMySQLRepository(names));
    addFile(`${base}/Infrastructure/Persistence/InMemory${names.entity}Repository.ts`, renderInMemoryRepository(names));
    addFile(`${base}/Infrastructure/Persistence/Mongoose${names.entity}Model.ts`, renderMongooseModel(names));

    addFile(`${base}/Infrastructure/${names.entity}Controller.ts`, renderControllerTemplate(names, spec.fields));
    addFile(`${base}/Infrastructure/${names.entity}Router.ts`, renderRouterTemplate(names));

    const repositoryWiring: RepositoryWiring = {
      context: names.context,
      entity: names.entity,
      entityCamel: names.entityCamel,
    };

    return { files, registrations, repositoryWiring };
  }
}
