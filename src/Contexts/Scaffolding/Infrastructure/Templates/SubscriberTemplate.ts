import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';
import { tsType } from './TypeMappings';

export function renderSubscriberTemplate(
  names: EntityNames,
  subscriberName: string,
  eventName: string,
  dependencies: FieldSpec[],
): string {
  const { context, entity } = names;

  const constructorParams = dependencies
    .map((d) => `    private readonly ${d.name}: ${tsType(d.type)},`)
    .join('\n');

  const lines: string[] = [];

  lines.push(`import { DomainEventSubscriber } from '@/Contexts/Shared/Domain/Events/DomainEventSubscriber';`);
  lines.push(`import { ${eventName} } from '@/Contexts/${context}/${entity}/Domain/Events/${eventName}';`);
  lines.push('');
  lines.push(`export class ${subscriberName}`);
  lines.push(`  implements DomainEventSubscriber<${eventName}>`);
  lines.push(`{`);
  if (dependencies.length > 0) {
    lines.push(`  constructor(`);
    lines.push(constructorParams);
    lines.push(`  ) {}`);
  } else {
    lines.push(`  constructor() {}`);
  }
  lines.push('');
  lines.push(`  async handle(event: ${eventName}): Promise<void> {`);
  lines.push(`    // TODO: implement ${subscriberName} logic`);
  lines.push(`    console.log('Event received:', event.toPrimitives());`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  subscribedTo(): new (...args: any[]) => ${eventName} {`);
  lines.push(`    return ${eventName};`);
  lines.push(`  }`);
  lines.push(`}`);
  lines.push('');

  return lines.join('\n');
}
