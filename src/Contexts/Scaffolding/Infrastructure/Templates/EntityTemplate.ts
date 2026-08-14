import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';
import { tsType, fieldLabel } from './TypeMappings';

export function renderEntityTemplate(names: EntityNames, fields: FieldSpec[], owned: boolean): string {
  const { entity } = names;

  const primitivesProps = fields
    .map((f) => `  ${f.name}: ${tsType(f.type)};`)
    .join('\n');
  const updateProps = fields
    .map((f) => `  ${f.name}?: ${tsType(f.type)};`)
    .join('\n');
  const privateFields = fields
    .map((f) => `  private _${f.name}: ${tsType(f.type)};`)
    .join('\n');
  const getters = fields
    .map((f) => `  get ${f.name}(): ${tsType(f.type)} { return this._${f.name}; }`)
    .join('\n');
  const ctorParams = fields
    .map((f) => `    ${f.name}: ${tsType(f.type)},`)
    .join('\n');
  const ctorAssignments = fields
    .map((f) => `    this._${f.name} = ${f.name};`)
    .join('\n');
  const createProps = fields
    .map((f) => `    ${f.name}: ${tsType(f.type)};`)
    .join('\n');
  const createArgs = fields
    .map((f) => `      props.${f.name},`)
    .join('\n');
  const fromPrimitivesArgs = fields
    .map((f) => `      p.${f.name},`)
    .join('\n');
  const toPrimitivesEntries = fields
    .map((f) => `      ${f.name}: this._${f.name},`)
    .join('\n');
  const updateCalls = fields
    .map((f) => `    if (data.${f.name} !== undefined) this.change${fieldLabel(f.name)}(data.${f.name});`)
    .join('\n');
  const changeMethods = fields
    .map((f) => {
      return `  change${fieldLabel(f.name)}(v: ${tsType(f.type)}): void {
    if (this._${f.name} === v) return;
    this._${f.name} = v;
    this._markAsUpdated();
  }`;
    })
    .join('\n\n');

  const ownerIdPrimitive = owned ? `  ownerId: string;\n` : '';
  const ownerIdField = owned ? `  public readonly ownerId: DocumentId;\n` : '';
  const ownerIdCtorParam = owned ? `    ownerId: DocumentId,\n` : '';
  const ownerIdCtorAssign = owned ? `    this.ownerId = ownerId;\n` : '';
  const ownerIdCreateProp = owned ? `    ownerId: string;\n` : '';
  const ownerIdCreateArg = owned ? `      new DocumentId(props.ownerId),\n` : '';
  const ownerIdFromPrimArg = owned ? `      new DocumentId(p.ownerId),\n` : '';
  const ownerIdToPrimEntry = owned ? `      ownerId: this.ownerId.value,\n` : '';

  return `import { AggregateRoot } from '@/Contexts/Shared/Domain/AggregateRoot';
import { DocumentId } from '@/Contexts/Shared/Domain/ValueObjects/DocumentId';
import { DateTime } from '@/Contexts/Shared/Domain/ValueObjects/DateTime';
import { IdGenerator } from '@/Contexts/Shared/Domain/IdGenerator';

export interface ${entity}Primitives {
  id: string;
${primitivesProps}
${ownerIdPrimitive}  createdAt: Date;
  updatedAt: Date;
}

export interface ${entity}UpdateInput {
${updateProps}
}

export class ${entity} extends AggregateRoot {
  public readonly id: DocumentId;
${ownerIdField}  public readonly createdAt: DateTime;

${privateFields}
  private _updatedAt: DateTime;

${getters}
  get updatedAt(): DateTime { return this._updatedAt; }

  private constructor(
    id: DocumentId,
${ctorParams}
${ownerIdCtorParam}    createdAt: DateTime,
    updatedAt: DateTime,
  ) {
    super();
    this.id = id;
${ctorAssignments}
${ownerIdCtorAssign}    this.createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static create(props: {
${createProps}
${ownerIdCreateProp}  }, idGenerator: IdGenerator): ${entity} {
    const id = new DocumentId(idGenerator.generate());
    const now = new DateTime(new Date());
    return new ${entity}(
      id,
${createArgs}
${ownerIdCreateArg}      now,
      now,
    );
  }

  static fromPrimitives(p: ${entity}Primitives): ${entity} {
    return new ${entity}(
      new DocumentId(p.id),
${fromPrimitivesArgs}
${ownerIdFromPrimArg}      new DateTime(p.createdAt),
      new DateTime(p.updatedAt),
    );
  }

  toPrimitives(): ${entity}Primitives {
    return {
      id: this.id.value,
${toPrimitivesEntries}
${ownerIdToPrimEntry}      createdAt: this.createdAt.value,
      updatedAt: this._updatedAt.value,
    };
  }

  update(data: ${entity}UpdateInput): void {
${updateCalls}
  }

${changeMethods}

  private _markAsUpdated(): void {
    this._updatedAt = new DateTime(new Date());
  }
}
`;
}
