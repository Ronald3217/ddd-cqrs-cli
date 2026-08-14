import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';
import type { ControllerTemplateOptions } from './ControllerTemplate';

export function renderRouterTemplate(
  names: EntityNames,
  options: ControllerTemplateOptions,
): string {
  const { entity, entityPlural } = names;

  const lines: string[] = [];
  lines.push(`import { Request, Router } from 'express';`);
  lines.push(`import auth from '@/Contexts/Shared/Infrastructure/middlewares/auth';`);
  lines.push(`import { ${entity}Controller } from './${entity}Controller';`);
  lines.push('');
  lines.push(`export default function ${entity}Router(controller: ${entity}Controller): Router {`);
  lines.push(`  const router = Router();`);
  lines.push('');

  if (options.owned) {
    lines.push(`  router.get('/', auth, (req: Request, res, next) => controller.getOwned${entityPlural}(req as any, res, next));`);
  }
  lines.push(`  router.get('/:id', (req: Request, res, next) => controller.getById(req, res, next));`);
  lines.push(`  router.post('/', auth, (req: Request, res, next) => controller.create(req as any, res, next));`);
  lines.push(`  router.patch('/:id', auth, (req: Request, res, next) => controller.update(req as any, res, next));`);
  lines.push(`  router.delete('/:id', auth, (req: Request, res, next) => controller.delete(req as any, res, next));`);
  if (options.admin) {
    lines.push(`  router.patch('/admin/:id', auth, (req: Request, res, next) => controller.adminUpdate(req as any, res, next));`);
    lines.push(`  router.delete('/admin/:id', auth, (req: Request, res, next) => controller.adminDelete(req as any, res, next));`);
  }
  lines.push('');
  lines.push(`  return router;`);
  lines.push(`}`);
  lines.push('');
  return lines.join('\n');
}
