import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { HttpFramework } from '@/Contexts/Scaffolding/Application/Plan';
import { renderExpressRouterTemplate } from './ExpressRouterTemplate';
import { renderElysiaRouterTemplate } from './ElysiaRouterTemplate';

export function renderRouterTemplate(
  names: EntityNames,
  http: HttpFramework = 'express',
): string {
  switch (http) {
    case 'express':
      return renderExpressRouterTemplate(names);
    case 'elysia':
      return renderElysiaRouterTemplate(names);
    default:
      throw new Error(`HTTP framework '${http}' not supported`);
  }
}
