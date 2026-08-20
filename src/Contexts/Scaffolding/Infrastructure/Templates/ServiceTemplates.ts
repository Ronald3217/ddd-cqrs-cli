import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';

export function renderServiceInterfaceTemplate(
  names: EntityNames,
  serviceName: string,
  methods: string[],
): string {
  const { context, entity } = names;

  const methodSignatures = methods
    .map((m) => `  // TODO: define method signature for ${m}\n  ${m}(): Promise<void>;`)
    .join('\n\n');

  const lines: string[] = [];

  lines.push(`export interface ${serviceName} {`);
  if (methods.length > 0) {
    lines.push(methodSignatures);
  } else {
    lines.push(`  // TODO: define service methods`);
  }
  lines.push(`}`);
  lines.push('');

  return lines.join('\n');
}

export function renderServiceImplementationTemplate(
  names: EntityNames,
  serviceName: string,
  implName: string,
  methods: string[],
): string {
  const { context, entity } = names;

  const methodImplementations = methods
    .map((m) => `  async ${m}(): Promise<void> {\n    // TODO: implement ${m}\n    throw new Error('Not implemented');\n  }`)
    .join('\n\n');

  const lines: string[] = [];

  lines.push(`import { ${serviceName} } from '@/Contexts/${context}/${entity}/Domain/Services/${serviceName}';`);
  lines.push('');
  lines.push(`export class ${implName} implements ${serviceName} {`);
  if (methods.length > 0) {
    lines.push(methodImplementations);
  } else {
    lines.push(`  // TODO: implement service methods`);
  }
  lines.push(`}`);
  lines.push('');

  return lines.join('\n');
}
