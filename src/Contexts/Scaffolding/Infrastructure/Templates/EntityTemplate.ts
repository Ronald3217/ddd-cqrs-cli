import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';
import { tsType, fieldLabel } from './TypeMappings';

export function renderEntityTemplate(names: EntityNames, fields: FieldSpec[]): string {
  const { entity } = names;

  const primitivesProps = fields
    .map((f) => `  ${f.name}: ${tsType(f.type)};`)
    .join('\n');
  const updateProps = fields
    .map((f) => `  ${f.name}?: ${tsType(f.type)};`)
    .join('\n');
  const privateFields = fields
    .map((f) => `  #${f.name}: ${tsType(f.type)};`)
    .join('\n');
  const getters = fields
    .map((f) => `  get ${f.name}(): ${tsType(f.type)} { return this.#${f.name}; }`)
    .join('\n');
  const ctorParams = fields
    .map((f) => `    ${f.name}: ${tsType(f.type)},`)
    .join('\n');
  const ctorAssignments = fields
    .map((f) => `    this.#${f.name} = ${f.name};`)
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
    .map((f) => `      ${f.name}: this.#${f.name},`)
    .join('\n');
  const updateCalls = fields
    .map((f) => `    if (data.${f.name} !== undefined) this.change${fieldLabel(f.name)}(data.${f.name});`)
    .join('\n');
  const changeMethods = fields
    .map((f) => {
      return `  change${fieldLabel(f.name)}(v: ${tsType(f.type)}): void {
    if (this.#${f.name} === v) return;
    this.#${f.name} = v;
    this.#markAsUpdated();
  }`;
    })
    .join('\n\n');

  return `import { AggregateRoot } from '@/Contexts/Shared/Domain/AggregateRoot';
import { DocumentId } from '@/Contexts/Shared/Domain/ValueObjects/DocumentId';
import { DateTime } from '@/Contexts/Shared/Domain/ValueObjects/DateTime';
import { IdGenerator } from '@/Contexts/Shared/Domain/IdGenerator';

export interface ${entity}Primitives {
  id: string;
${primitivesProps}
  createdAt: Date;
  updatedAt: Date;
}

export interface ${entity}UpdateInput {
${updateProps}
}

export class ${entity} extends AggregateRoot {
  public readonly id: DocumentId;
  public readonly createdAt: DateTime;

${privateFields}
  #updatedAt: DateTime;

${getters}
  get updatedAt(): DateTime { return this.#updatedAt; }

  private constructor(
    id: DocumentId,
${ctorParams}
    createdAt: DateTime,
    updatedAt: DateTime,
  ) {
    super();
    this.id = id;
${ctorAssignments}
    this.createdAt = createdAt;
    this.#updatedAt = updatedAt;
  }

  static create(props: {
${createProps}
  }, idGenerator: IdGenerator): ${entity} {
    const id = new DocumentId(idGenerator.generate());
    const now = new DateTime(new Date());
    return new ${entity}(
      id,
${createArgs}
      now,
      now,
    );
  }

  static fromPrimitives(p: ${entity}Primitives): ${entity} {
    return new ${entity}(
      new DocumentId(p.id),
${fromPrimitivesArgs}
      new DateTime(p.createdAt),
      new DateTime(p.updatedAt),
    );
  }

  toPrimitives(): ${entity}Primitives {
    return {
      id: this.id.value,
${toPrimitivesEntries}
      createdAt: this.createdAt.value,
      updatedAt: this.#updatedAt.value,
    };
  }

  update(data: ${entity}UpdateInput): void {
${updateCalls}
  }

${changeMethods}

  #markAsUpdated(): void {
    this.#updatedAt = new DateTime(new Date());
  }
}
`;
}
