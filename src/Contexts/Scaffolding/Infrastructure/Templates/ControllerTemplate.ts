import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';

export interface ControllerTemplateOptions {
  admin: boolean;
  owned: boolean;
}

export function renderControllerTemplate(
  names: EntityNames,
  fields: FieldSpec[],
  options: ControllerTemplateOptions,
): string {
  const { entity, entityCamel, entityPlural, entityPluralLower, context } = names;
  const base = `@/Contexts/${context}/${entity}`;
  const fieldNames = fields.map((f) => f.name);
  const createArgs = options.owned
    ? [...fieldNames, 'req.id'].join(', ')
    : fieldNames.join(', ');
  const updateArgs = options.owned
    ? ['req.params.id as string', 'req.id', ...fieldNames].join(', ')
    : ['req.params.id as string', ...fieldNames].join(', ');
  const adminUpdateArgs = ['req.params.id as string', 'req.id', ...fieldNames].join(', ');
  const deleteArgs = options.owned
    ? `req.params.id as string, req.id`
    : `req.params.id as string`;
  const adminDeleteArgs = `req.params.id as string, req.id`;

  const lines: string[] = [];
  lines.push(`import { NextFunction, Request, Response } from 'express';`);
  lines.push(`import { CustomRequest } from '@/Contexts/Shared/Infrastructure/types';`);
  lines.push(`import { CommandBus } from '@/Contexts/Shared/Domain/Bus/CommandBus';`);
  lines.push(`import { QueryBus } from '@/Contexts/Shared/Domain/Bus/QueryBus';`);
  lines.push(`import { Create${entity}Command } from '${base}/Application/Commands/Create${entity}/Create${entity}Command';`);
  lines.push(`import { Update${entity}Command } from '${base}/Application/Commands/Update${entity}/Update${entity}Command';`);
  lines.push(`import { Delete${entity}Command } from '${base}/Application/Commands/Delete${entity}/Delete${entity}Command';`);
  if (options.admin) {
    lines.push(`import { AdminUpdate${entity}Command } from '${base}/Application/Commands/AdminUpdate${entity}/AdminUpdate${entity}Command';`);
    lines.push(`import { AdminDelete${entity}Command } from '${base}/Application/Commands/AdminDelete${entity}/AdminDelete${entity}Command';`);
  }
  lines.push(`import { Get${entity}ByIdQuery, Get${entity}ByIdResponse } from '${base}/Application/Queries/Get${entity}ById/Get${entity}ByIdQuery';`);
  if (options.owned) {
    lines.push(`import { GetOwned${entityPlural}Query, GetOwned${entityPlural}Response } from '${base}/Application/Queries/GetOwned${entityPlural}/GetOwned${entityPlural}Query';`);
  }
  lines.push(`import { Create${entity}Schema, Update${entity}Schema } from './Schemas/${entity}Schemas';`);
  lines.push('');

  lines.push(`export class ${entity}Controller {`);
  lines.push(`  constructor(`);
  lines.push(`    private readonly commandBus: CommandBus,`);
  lines.push(`    private readonly queryBus: QueryBus,`);
  lines.push(`  ) {}`);
  lines.push('');

  const createBody = fieldNames.length > 0
    ? `      const { ${fieldNames.join(', ')} } = Create${entity}Schema.parse(req.body);`
    : `      Create${entity}Schema.parse(req.body);`;
  lines.push(`  async create(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {`);
  lines.push(`    try {`);
  lines.push(createBody);
  lines.push(`      await this.commandBus.dispatch(`);
  lines.push(`        new Create${entity}Command(${createArgs}),`);
  lines.push(`      );`);
  lines.push(`      res.status(200).json({`);
  lines.push(`        statusCode: 200,`);
  lines.push(`        message: '${entity} created successfully',`);
  lines.push(`      });`);
  lines.push(`    } catch (error) {`);
  lines.push(`      next(error);`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push('');

  const updateBody = fieldNames.length > 0
    ? `      const { ${fieldNames.join(', ')} } = Update${entity}Schema.parse(req.body);`
    : `      Update${entity}Schema.parse(req.body);`;
  lines.push(`  async update(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {`);
  lines.push(`    try {`);
  lines.push(updateBody);
  lines.push(`      await this.commandBus.dispatch(`);
  lines.push(`        new Update${entity}Command(${updateArgs}),`);
  lines.push(`      );`);
  lines.push(`      res.status(200).json({`);
  lines.push(`        statusCode: 200,`);
  lines.push(`        message: '${entity} updated successfully',`);
  lines.push(`      });`);
  lines.push(`    } catch (error) {`);
  lines.push(`      next(error);`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push('');

  lines.push(`  async delete(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {`);
  lines.push(`    try {`);
  lines.push(`      await this.commandBus.dispatch(new Delete${entity}Command(${deleteArgs}));`);
  lines.push(`      res.status(200).json({`);
  lines.push(`        statusCode: 200,`);
  lines.push(`        message: '${entity} deleted successfully',`);
  lines.push(`      });`);
  lines.push(`    } catch (error) {`);
  lines.push(`      next(error);`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push('');

  if (options.admin) {
    lines.push(`  async adminUpdate(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {`);
    lines.push(`    try {`);
    lines.push(updateBody);
    lines.push(`      await this.commandBus.dispatch(`);
    lines.push(`        new AdminUpdate${entity}Command(${adminUpdateArgs}),`);
    lines.push(`      );`);
    lines.push(`      res.status(200).json({`);
    lines.push(`        statusCode: 200,`);
    lines.push(`        message: '${entity} updated successfully',`);
    lines.push(`      });`);
    lines.push(`    } catch (error) {`);
    lines.push(`      next(error);`);
    lines.push(`    }`);
    lines.push(`  }`);
    lines.push('');

    lines.push(`  async adminDelete(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {`);
    lines.push(`    try {`);
    lines.push(`      await this.commandBus.dispatch(new AdminDelete${entity}Command(${adminDeleteArgs}));`);
    lines.push(`      res.status(200).json({`);
    lines.push(`        statusCode: 200,`);
    lines.push(`        message: '${entity} deleted successfully',`);
    lines.push(`      });`);
    lines.push(`    } catch (error) {`);
    lines.push(`      next(error);`);
    lines.push(`    }`);
    lines.push(`  }`);
    lines.push('');
  }

  lines.push(`  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {`);
  lines.push(`    try {`);
  lines.push(`      const result = await this.queryBus.ask<Get${entity}ByIdResponse>(`);
  lines.push(`        new Get${entity}ByIdQuery(req.params.id as string),`);
  lines.push(`      );`);
  lines.push(`      res.status(200).json(result.data);`);
  lines.push(`    } catch (error) {`);
  lines.push(`      next(error);`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push('');

  if (options.owned) {
    lines.push(`  async getOwned${entityPlural}(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {`);
    lines.push(`    try {`);
    lines.push(`      const page = parseInt(req.query.page as string) || 1;`);
    lines.push(`      const itemsPerPage = parseInt(req.query.itemsPerPage as string) || 10;`);
    lines.push(`      const result = await this.queryBus.ask<GetOwned${entityPlural}Response>(`);
    lines.push(`        new GetOwned${entityPlural}Query(req.id, page, itemsPerPage),`);
    lines.push(`      );`);
    lines.push(`      res.status(200).json({`);
    lines.push(`        statusCode: 200,`);
    lines.push(`        data: result.${entityPluralLower},`);
    lines.push(`        total: result.total,`);
    lines.push(`      });`);
    lines.push(`    } catch (error) {`);
    lines.push(`      next(error);`);
    lines.push(`    }`);
    lines.push(`  }`);
    lines.push('');
  }

  lines.push('}');
  lines.push('');
  return lines.join('\n');
}
