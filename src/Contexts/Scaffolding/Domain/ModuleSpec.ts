import { FieldSpec } from './FieldSpec';
import { assertPascalCase, assertSingularEntityName } from './NamingRules';
import { ScaffoldingError } from './ScaffoldingError';

const RESERVED_FIELD_NAMES = ['id', 'createdAt', 'updatedAt'] as const;

export class ModuleSpec {
  private constructor(
    public readonly entityName: string,
    public readonly fields: FieldSpec[],
    public readonly context: string,
  ) {}

  static create(
    entityName: string,
    fieldsRaw: string | undefined,
    context: string,
  ): ModuleSpec {
    const fields = FieldSpec.parseList(fieldsRaw);
    ModuleSpec.assertValidFields(fields);
    return new ModuleSpec(
      assertSingularEntityName(entityName, 'Entity name'),
      fields,
      assertPascalCase(context, 'Context name'),
    );
  }

  private static assertValidFields(fields: FieldSpec[]): void {
    for (const field of fields) {
      if ((RESERVED_FIELD_NAMES as readonly string[]).includes(field.name)) {
        throw new ScaffoldingError(
          `Field name "${field.name}" is reserved and cannot be used in --fields (the ${field.name} field is generated automatically)`,
        );
      }
    }
  }
}
