import { ScaffoldingError } from './ScaffoldingError';
import { assertCamelCase } from './NamingRules';

export type FieldType = 'string' | 'number' | 'boolean' | 'Date' | 'string[]';

const VALID_TYPES: FieldType[] = ['string', 'number', 'boolean', 'Date', 'string[]'];

export class FieldSpec {
  constructor(
    public readonly name: string,
    public readonly type: FieldType,
  ) {}

  static parseList(raw: string | undefined): FieldSpec[] {
    if (!raw || raw.trim() === '') return [];
    const parts = raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const fields = parts.map((part, index) => FieldSpec.fromString(part, index));
    const names = new Set<string>();
    for (const field of fields) {
      if (names.has(field.name)) {
        throw new ScaffoldingError(
          `Duplicate field name "${field.name}" in --fields (each field must appear once)`,
        );
      }
      names.add(field.name);
    }
    return fields;
  }

  static fromString(raw: string, index: number): FieldSpec {
    const pieces = raw.split(':').map((piece) => piece.trim());
    const name = pieces[0];
    const type = pieces[1] as FieldType;

    if (!name || !type || pieces.length > 2) {
      throw new ScaffoldingError(
        `Invalid field at position ${index + 1}: "${raw}" (expected name:type, e.g. title:string)`,
      );
    }

    assertCamelCase(name, 'Field name');
    if (!VALID_TYPES.includes(type)) {
      throw new ScaffoldingError(
        `Invalid type "${type}" for field "${name}" (valid types: ${VALID_TYPES.join(', ')})`,
      );
    }

    return new FieldSpec(name, type);
  }
}
