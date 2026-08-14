import { FieldSpec } from './FieldSpec';
import { assertPascalCase, assertSingularEntityName } from './NamingRules';
import { ScaffoldingError } from './ScaffoldingError';

export interface ModuleOptions {
  admin: boolean;
  owned: boolean;
}

const RESERVED_FIELD_NAMES = ['id', 'createdAt', 'updatedAt'] as const;

export class ModuleSpec {
  private constructor(
    public readonly entityName: string,
    public readonly fields: FieldSpec[],
    public readonly context: string,
    public readonly options: ModuleOptions,
  ) {}

  static create(
    entityName: string,
    fieldsRaw: string | undefined,
    context: string,
    options: ModuleOptions,
  ): ModuleSpec {
    const fields = FieldSpec.parseList(fieldsRaw);
    ModuleSpec.assertValidFields(fields, options.owned);
    return new ModuleSpec(
      assertSingularEntityName(entityName, 'Entity name'),
      fields,
      assertPascalCase(context, 'Context name'),
      options,
    );
  }

  private static assertValidFields(fields: FieldSpec[], owned: boolean): void {
    for (const field of fields) {
      if ((RESERVED_FIELD_NAMES as readonly string[]).includes(field.name)) {
        throw new ScaffoldingError(
          `Field name "${field.name}" is reserved and cannot be used in --fields (the ${field.name} field is generated automatically)`,
        );
      }
      if (owned && field.name === 'ownerId') {
        throw new ScaffoldingError(
          'Field name "ownerId" is generated automatically by --owned and cannot be passed in --fields',
        );
      }
    }
  }
}
