import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';
import { tsType } from './TypeMappings';

export function renderValueObjectTemplate(
  names: EntityNames,
  voName: string,
  valueType: string,
  fields?: FieldSpec[],
): string {
  const { context } = names;
  const tsValueType = tsType(valueType as any);

  // Handle object type
  const isObject = valueType === 'object' && fields && fields.length > 0;
  const objectType = isObject
    ? `{ ${fields!.map((f) => `${f.name}: ${tsType(f.type)}`).join('; ')} }`
    : tsValueType;

  const lines: string[] = [];

  // Validation logic based on type
  let validationBlock = '';
  switch (valueType) {
    case 'string':
      validationBlock = `    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error('${voName} must be a non-empty string');
    }`;
      break;
    case 'number':
      validationBlock = `    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('${voName} must be a valid number');
    }`;
      break;
    case 'boolean':
      validationBlock = `    if (typeof value !== 'boolean') {
      throw new Error('${voName} must be a boolean');
    }`;
      break;
    case 'Date':
      validationBlock = `    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('${voName} must be a valid Date');
    }`;
      break;
    case 'string[]':
      validationBlock = `    if (!Array.isArray(value) || !value.every(v => typeof v === 'string')) {
      throw new Error('${voName} must be an array of strings');
    }`;
      break;
  }

  // Constructor parameter type
  let constructorParamType = isObject ? objectType : tsValueType;
  if (valueType === 'Date') {
    constructorParamType = 'Date | string';
  }

  lines.push(`export class ${voName} {`);
  lines.push(`  readonly #value: ${objectType};`);
  lines.push('');
  lines.push(`  constructor(value: ${constructorParamType}) {`);

  if (valueType === 'Date') {
    lines.push(validationBlock);
    lines.push(`    this.#value = date;`);
  } else {
    lines.push(validationBlock);
    lines.push(`    this.#value = value;`);
  }

  lines.push(`  }`);
  lines.push('');
  lines.push(`  get value(): ${objectType} {`);
  lines.push(`    return this.#value;`);
  lines.push(`  }`);
  lines.push('');

  // Equals method — handles primitives, Date, arrays, objects, and nested VOs
  lines.push(`  equals(other: ${voName}): boolean {`);
  if (valueType === 'Date') {
    lines.push(`    return this.#value.getTime() === other.value.getTime();`);
  } else if (valueType === 'string[]' || isObject) {
    lines.push(`    return JSON.stringify(this.#value) === JSON.stringify(other.value);`);
  } else {
    // For primitives: check if value has equals() method
    lines.push(`    const a = this.#value;`);
    lines.push(`    const b = other.value;`);
    lines.push(`    if (typeof a === 'object' && a !== null && typeof (a as any).equals === 'function') {`);
    lines.push(`      return (a as any).equals(b);`);
    lines.push(`    }`);
    lines.push(`    return a === b;`);
  }
  lines.push(`  }`);
  lines.push('');
  lines.push(`  toString(): string {`);
  if (valueType === 'Date') {
    lines.push(`    return this.#value.toISOString();`);
  } else if (valueType === 'string[]' || isObject) {
    lines.push(`    return JSON.stringify(this.#value);`);
  } else {
    lines.push(`    return String(this.#value);`);
  }
  lines.push(`  }`);
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}
