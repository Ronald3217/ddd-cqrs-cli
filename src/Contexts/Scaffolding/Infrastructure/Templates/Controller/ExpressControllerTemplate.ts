import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';

export function renderExpressControllerTemplate(
  names: EntityNames,
  fields: FieldSpec[],
): string {
  const { entity, context } = names;
  const base = `@/Contexts/${context}/${entity}`;
  const fieldNames = fields.map((f) => f.name);
  const createArgs = fieldNames.join(', ');
  const updateArgs = ['req.params.id as string', ...fieldNames].join(', ');
  const deleteArgs = `req.params.id as string`;

  const lines: string[] = [];
  lines.push(`import { NextFunction, Request, Response } from 'express';`);
  lines.push(`import { CustomRequest } from '@/Contexts/Shared/Infrastructure/types';`);
  lines.push(`import { CommandBus } from '@/Contexts/Shared/Domain/Bus/CommandBus';`);
  lines.push(`import { QueryBus } from '@/Contexts/Shared/Domain/Bus/QueryBus';`);
  lines.push(`import { Create${entity}Command } from '${base}/Application/Commands/Create${entity}/Create${entity}Command';`);
  lines.push(`import { Update${entity}Command } from '${base}/Application/Commands/Update${entity}/Update${entity}Command';`);
  lines.push(`import { Delete${entity}Command } from '${base}/Application/Commands/Delete${entity}/Delete${entity}Command';`);
  lines.push(`import { Get${entity}ByIdQuery, Get${entity}ByIdResponse } from '${base}/Application/Queries/Get${entity}ById/Get${entity}ByIdQuery';`);
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

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}
