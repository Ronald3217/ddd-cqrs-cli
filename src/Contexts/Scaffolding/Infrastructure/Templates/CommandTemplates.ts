import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';
import { tsType } from './TypeMappings';

export function renderCreateCommand(names: EntityNames, fields: FieldSpec[], owned: boolean): string {
  const { entity } = names;
  const params = fields.map((f) => `    public readonly ${f.name}: ${tsType(f.type)},`).join('\n');
  const ownerIdParam = owned ? `    public readonly ownerId: string,\n` : '';

  return `import { Command } from '@/Contexts/Shared/Domain/Commands/Command';

export class Create${entity}Command extends Command {
  constructor(
${params}
${ownerIdParam}  ) {
    super();
  }
}
`;
}

export function renderCreateCommandHandler(names: EntityNames, fields: FieldSpec[], owned: boolean): string {
  const { entity, entityCamel, context } = names;
  const assign = fields.map((f) => `      ${f.name}: command.${f.name},`).join('\n');
  const ownerIdAssign = owned ? `      ownerId: command.ownerId,\n` : '';

  return `import { CommandHandler } from '@/Contexts/Shared/Domain/Commands/CommandHandler';
import { IdGenerator } from '@/Contexts/Shared/Domain/IdGenerator';
import { ${entity}Repository } from '@/Contexts/${context}/${entity}/Domain/${entity}Repository';
import { ${entity} } from '@/Contexts/${context}/${entity}/Domain/${entity}';
import { Create${entity}Command } from '@/Contexts/${context}/${entity}/Application/Commands/Create${entity}/Create${entity}Command';

export class Create${entity}CommandHandler implements CommandHandler<Create${entity}Command> {
  constructor(
    private readonly ${entityCamel}Repository: ${entity}Repository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async handle(command: Create${entity}Command): Promise<void> {
    const ${entityCamel} = ${entity}.create({
${assign}
${ownerIdAssign}    }, this.idGenerator);

    await this.${entityCamel}Repository.save(${entityCamel});
  }

  subscribedTo(): new (...args: any[]) => Create${entity}Command {
    return Create${entity}Command;
  }
}
`;
}

export function renderUpdateCommand(names: EntityNames, fields: FieldSpec[], owned: boolean): string {
  const { entity, entityCamel } = names;
  const params = fields.map((f) => `    public readonly ${f.name}?: ${tsType(f.type)},`).join('\n');
  const ownerIdParam = owned ? `    public readonly ownerId: string,\n` : '';

  return `import { Command } from '@/Contexts/Shared/Domain/Commands/Command';

export class Update${entity}Command extends Command {
  constructor(
    public readonly ${entityCamel}Id: string,
${ownerIdParam}${params}
  ) {
    super();
  }
}
`;
}

export function renderUpdateCommandHandler(names: EntityNames, fields: FieldSpec[], owned: boolean): string {
  const { entity, entityCamel, context } = names;
  const assign = fields.map((f) => `      ${f.name}: command.${f.name},`).join('\n');
  const ownershipCheck = owned ? `    if (${entityCamel}.ownerId.value !== command.ownerId) {
      throw new UnauthorizedError('You are not the owner of this ${entityCamel}');
    }

` : '';
  const unauthorizedImport = owned ? `import { UnauthorizedError } from '@/Contexts/Shared/Domain/Errors/UnauthorizedError';
` : '';

  return `import { CommandHandler } from '@/Contexts/Shared/Domain/Commands/CommandHandler';
import { ${entity}Repository } from '@/Contexts/${context}/${entity}/Domain/${entity}Repository';
import { Update${entity}Command } from '@/Contexts/${context}/${entity}/Application/Commands/Update${entity}/Update${entity}Command';
import { NotFoundError } from '@/Contexts/Shared/Domain/Errors/NotFoundError';
${unauthorizedImport}
export class Update${entity}CommandHandler implements CommandHandler<Update${entity}Command> {
  constructor(private readonly ${entityCamel}Repository: ${entity}Repository) {}

  async handle(command: Update${entity}Command): Promise<void> {
    const ${entityCamel} = await this.${entityCamel}Repository.findById(command.${entityCamel}Id);
    if (!${entityCamel}) throw new NotFoundError('${entity}');

${ownershipCheck}    ${entityCamel}.update({
${assign}
    });

    await this.${entityCamel}Repository.save(${entityCamel});
  }

  subscribedTo(): new (...args: any[]) => Update${entity}Command {
    return Update${entity}Command;
  }
}
`;
}

export function renderDeleteCommand(names: EntityNames, owned: boolean): string {
  const { entity, entityCamel } = names;
  const ownerIdParam = owned ? `    public readonly ownerId: string,\n` : '';

  return `import { Command } from '@/Contexts/Shared/Domain/Commands/Command';

export class Delete${entity}Command extends Command {
  constructor(
    public readonly ${entityCamel}Id: string,
${ownerIdParam}  ) {
    super();
  }
}
`;
}

export function renderDeleteCommandHandler(names: EntityNames, owned: boolean): string {
  const { entity, entityCamel, context } = names;
  const ownershipCheck = owned ? `    if (${entityCamel}.ownerId.value !== command.ownerId) {
      throw new UnauthorizedError('You are not the owner of this ${entityCamel}');
    }

` : '';
  const unauthorizedImport = owned ? `import { UnauthorizedError } from '@/Contexts/Shared/Domain/Errors/UnauthorizedError';
` : '';

  return `import { CommandHandler } from '@/Contexts/Shared/Domain/Commands/CommandHandler';
import { ${entity}Repository } from '@/Contexts/${context}/${entity}/Domain/${entity}Repository';
import { Delete${entity}Command } from '@/Contexts/${context}/${entity}/Application/Commands/Delete${entity}/Delete${entity}Command';
import { NotFoundError } from '@/Contexts/Shared/Domain/Errors/NotFoundError';
${unauthorizedImport}
export class Delete${entity}CommandHandler implements CommandHandler<Delete${entity}Command> {
  constructor(private readonly ${entityCamel}Repository: ${entity}Repository) {}

  async handle(command: Delete${entity}Command): Promise<void> {
    const ${entityCamel} = await this.${entityCamel}Repository.findById(command.${entityCamel}Id);
    if (!${entityCamel}) throw new NotFoundError('${entity}');

${ownershipCheck}    await this.${entityCamel}Repository.delete(command.${entityCamel}Id);
  }

  subscribedTo(): new (...args: any[]) => Delete${entity}Command {
    return Delete${entity}Command;
  }
}
`;
}

export function renderAdminUpdateCommand(names: EntityNames, fields: FieldSpec[]): string {
  const { entity, entityCamel } = names;
  const params = fields.map((f) => `    public readonly ${f.name}?: ${tsType(f.type)},`).join('\n');

  return `import { Command } from '@/Contexts/Shared/Domain/Commands/Command';

export class AdminUpdate${entity}Command extends Command {
  constructor(
    public readonly ${entityCamel}Id: string,
    public readonly requesterId: string,
${params}
  ) {
    super();
  }
}
`;
}

export function renderAdminUpdateCommandHandler(names: EntityNames, fields: FieldSpec[]): string {
  const { entity, entityCamel, context } = names;
  const assign = fields.map((f) => `      ${f.name}: command.${f.name},`).join('\n');

  return `import { CommandHandler } from '@/Contexts/Shared/Domain/Commands/CommandHandler';
import { ${entity}Repository } from '@/Contexts/${context}/${entity}/Domain/${entity}Repository';
import { AdminUpdate${entity}Command } from '@/Contexts/${context}/${entity}/Application/Commands/AdminUpdate${entity}/AdminUpdate${entity}Command';
import { NotFoundError } from '@/Contexts/Shared/Domain/Errors/NotFoundError';

export class AdminUpdate${entity}CommandHandler implements CommandHandler<AdminUpdate${entity}Command> {
  constructor(private readonly ${entityCamel}Repository: ${entity}Repository) {}

  async handle(command: AdminUpdate${entity}Command): Promise<void> {
    // TODO: authorize command.requesterId as an administrator
    // following your project's authentication and authorization model
    const ${entityCamel} = await this.${entityCamel}Repository.findById(command.${entityCamel}Id);
    if (!${entityCamel}) throw new NotFoundError('${entity}');

    ${entityCamel}.update({
${assign}
    });

    await this.${entityCamel}Repository.save(${entityCamel});
  }

  subscribedTo(): new (...args: any[]) => AdminUpdate${entity}Command {
    return AdminUpdate${entity}Command;
  }
}
`;
}

export function renderAdminDeleteCommand(names: EntityNames): string {
  const { entity, entityCamel } = names;

  return `import { Command } from '@/Contexts/Shared/Domain/Commands/Command';

export class AdminDelete${entity}Command extends Command {
  constructor(
    public readonly ${entityCamel}Id: string,
    public readonly requesterId: string,
  ) {
    super();
  }
}
`;
}

export function renderAdminDeleteCommandHandler(names: EntityNames): string {
  const { entity, entityCamel, context } = names;

  return `import { CommandHandler } from '@/Contexts/Shared/Domain/Commands/CommandHandler';
import { ${entity}Repository } from '@/Contexts/${context}/${entity}/Domain/${entity}Repository';
import { AdminDelete${entity}Command } from '@/Contexts/${context}/${entity}/Application/Commands/AdminDelete${entity}/AdminDelete${entity}Command';
import { NotFoundError } from '@/Contexts/Shared/Domain/Errors/NotFoundError';

export class AdminDelete${entity}CommandHandler implements CommandHandler<AdminDelete${entity}Command> {
  constructor(private readonly ${entityCamel}Repository: ${entity}Repository) {}

  async handle(command: AdminDelete${entity}Command): Promise<void> {
    // TODO: authorize command.requesterId as an administrator
    // following your project's authentication and authorization model
    const ${entityCamel} = await this.${entityCamel}Repository.findById(command.${entityCamel}Id);
    if (!${entityCamel}) throw new NotFoundError('${entity}');

    await this.${entityCamel}Repository.delete(command.${entityCamel}Id);
  }

  subscribedTo(): new (...args: any[]) => AdminDelete${entity}Command {
    return AdminDelete${entity}Command;
  }
}
`;
}

export function renderGenericCommand(names: EntityNames, action: string, fields: FieldSpec[]): string {
  const { entity, entityCamel } = names;
  const params = fields.map((f) => `    public readonly ${f.name}?: ${tsType(f.type)},`).join('\n');

  return `import { Command } from '@/Contexts/Shared/Domain/Commands/Command';

export class ${action}${entity}Command extends Command {
  constructor(
    public readonly ${entityCamel}Id: string,
${params}
  ) {
    super();
  }
}
`;
}

export function renderGenericCommandHandler(names: EntityNames, action: string, _fields: FieldSpec[]): string {
  const { entity, entityCamel, context } = names;
  const className = `${action}${entity}Command`;
  const handlerClassName = `${className}Handler`;

  return `import { CommandHandler } from '@/Contexts/Shared/Domain/Commands/CommandHandler';
import { ${entity}Repository } from '@/Contexts/${context}/${entity}/Domain/${entity}Repository';
import { ${className} } from '@/Contexts/${context}/${entity}/Application/Commands/${className}/${className}';
import { NotFoundError } from '@/Contexts/Shared/Domain/Errors/NotFoundError';

export class ${handlerClassName} implements CommandHandler<${className}> {
  constructor(
    private readonly ${entityCamel}Repository: ${entity}Repository,
  ) {}

  async handle(command: ${className}): Promise<void> {
    const ${entityCamel} = await this.${entityCamel}Repository.findById(command.${entityCamel}Id);
    if (!${entityCamel}) throw new NotFoundError('${entity}');

    void command;
    // TODO: apply ${action}${entity} business logic here
  }

  subscribedTo(): new (...args: any[]) => ${className} {
    return ${className};
  }
}
`;
}
