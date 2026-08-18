import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';
import { tsType } from './TypeMappings';

export function renderGetByIdQuery(names: EntityNames): string {
  const { entity, entityCamel, context } = names;

  return `import { Query } from '@/Contexts/Shared/Domain/Queries/Query';
import { Response } from '@/Contexts/Shared/Domain/Response';
import { ${entity}Primitives } from '@/Contexts/${context}/${entity}/Domain/${entity}';

export class Get${entity}ByIdResponse implements Response {
  constructor(public readonly data: ${entity}Primitives) {}
}

export class Get${entity}ByIdQuery extends Query {
  constructor(public readonly ${entityCamel}Id: string) {
    super();
  }
}
`;
}

export function renderGetByIdQueryHandler(names: EntityNames): string {
  const { entity, entityCamel, context } = names;

  return `import { QueryHandler } from '@/Contexts/Shared/Domain/Queries/QueryHandler';
import { ${entity}Repository } from '@/Contexts/${context}/${entity}/Domain/${entity}Repository';
import { Get${entity}ByIdQuery, Get${entity}ByIdResponse } from '@/Contexts/${context}/${entity}/Application/Queries/Get${entity}ById/Get${entity}ByIdQuery';
import { NotFoundError } from '@/Contexts/Shared/Domain/Errors/NotFoundError';

export class Get${entity}ByIdQueryHandler implements QueryHandler<Get${entity}ByIdQuery, Get${entity}ByIdResponse> {
  constructor(private readonly ${entityCamel}Repository: ${entity}Repository) {}

  async handle(query: Get${entity}ByIdQuery): Promise<Get${entity}ByIdResponse> {
    const ${entityCamel} = await this.${entityCamel}Repository.findById(query.${entityCamel}Id);
    if (!${entityCamel}) throw new NotFoundError('${entity}');

    return new Get${entity}ByIdResponse(${entityCamel}.toPrimitives());
  }

  subscribedTo(): new (...args: any[]) => Get${entity}ByIdQuery {
    return Get${entity}ByIdQuery;
  }
}
`;
}

export function renderGenericQuery(names: EntityNames, action: string, fields: FieldSpec[]): string {
  const { entity, entityCamel, context } = names;
  const className = `${action}${entity}Query`;
  const responseName = `${className}Response`;
  const params = fields.map((f) => `    public readonly ${f.name}?: ${tsType(f.type)},`).join('\n');

  return `import { Query } from '@/Contexts/Shared/Domain/Queries/Query';
import { Response } from '@/Contexts/Shared/Domain/Response';
import { ${entity}Primitives } from '@/Contexts/${context}/${entity}/Domain/${entity}';

export class ${responseName} implements Response {
  constructor(public readonly data: ${entity}Primitives) {}
}

export class ${className} extends Query {
  constructor(
    public readonly ${entityCamel}Id: string,
${params}
  ) {
    super();
  }
}
`;
}

export function renderGenericQueryHandler(names: EntityNames, action: string, _fields: FieldSpec[]): string {
  const { entity, entityCamel, context } = names;
  const className = `${action}${entity}Query`;
  const responseName = `${className}Response`;
  const handlerClassName = `${className}Handler`;

  return `import { QueryHandler } from '@/Contexts/Shared/Domain/Queries/QueryHandler';
import { ${entity}Repository } from '@/Contexts/${context}/${entity}/Domain/${entity}Repository';
import { ${className}, ${responseName} } from '@/Contexts/${context}/${entity}/Application/Queries/${className}/${className}';
import { NotFoundError } from '@/Contexts/Shared/Domain/Errors/NotFoundError';

export class ${handlerClassName} implements QueryHandler<${className}, ${responseName}> {
  constructor(private readonly ${entityCamel}Repository: ${entity}Repository) {}

  async handle(query: ${className}): Promise<${responseName}> {
    const ${entityCamel} = await this.${entityCamel}Repository.findById(query.${entityCamel}Id);
    if (!${entityCamel}) throw new NotFoundError('${entity}');

    return new ${responseName}(${entityCamel}.toPrimitives());
  }

  subscribedTo(): new (...args: any[]) => ${className} {
    return ${className};
  }
}
`;
}
