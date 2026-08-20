import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { FieldSpec } from '@/Contexts/Scaffolding/Domain/FieldSpec';
import type { HttpFramework } from '@/Contexts/Scaffolding/Application/Plan';
import { renderExpressControllerTemplate } from './ExpressControllerTemplate';
import { renderElysiaControllerTemplate } from './ElysiaControllerTemplate';

export function renderControllerTemplate(
  names: EntityNames,
  fields: FieldSpec[],
  http: HttpFramework = 'express',
): string {
  switch (http) {
    case 'express':
      return renderExpressControllerTemplate(names, fields);
    case 'elysia':
      return renderElysiaControllerTemplate(names, fields);
    default:
      throw new Error(`HTTP framework '${http}' not supported`);
  }
}
