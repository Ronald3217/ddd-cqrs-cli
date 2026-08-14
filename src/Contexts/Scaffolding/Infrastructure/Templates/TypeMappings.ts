import type { FieldType } from '@/Contexts/Scaffolding/Domain/FieldSpec';

export function tsType(type: FieldType): string {
  switch (type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'Date':
      return 'Date';
    case 'string[]':
      return 'string[]';
  }
}

export function zodType(type: FieldType, label: string, optional: boolean): string {
  let expr: string;
  switch (type) {
    case 'string':
      expr = `z.string().min(1, '${label} is required')`;
      break;
    case 'number':
      expr = 'z.number()';
      break;
    case 'boolean':
      expr = 'z.boolean()';
      break;
    case 'Date':
      expr = 'z.coerce.date()';
      break;
    case 'string[]':
      expr = 'z.array(z.string())';
      break;
  }
  return optional ? `${expr}.optional()` : expr;
}

export function mongooseType(type: FieldType): string {
  switch (type) {
    case 'string':
      return 'String';
    case 'number':
      return 'Number';
    case 'boolean':
      return 'Boolean';
    case 'Date':
      return 'Date';
    case 'string[]':
      return '[String]';
  }
}

export function fieldLabel(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
