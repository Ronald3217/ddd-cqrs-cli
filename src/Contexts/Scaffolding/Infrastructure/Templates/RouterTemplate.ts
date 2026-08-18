import type { EntityNames } from '@/Contexts/Scaffolding/Domain/NamingRules';

export function renderRouterTemplate(
  names: EntityNames,
): string {
  const { entity } = names;

  const lines: string[] = [];
  lines.push(`import { Request, Router } from 'express';`);
  lines.push(`import auth from '@/Contexts/Shared/Infrastructure/middlewares/auth';`);
  lines.push(`import { ${entity}Controller } from './${entity}Controller';`);
  lines.push('');
  lines.push(`export default function ${entity}Router(controller: ${entity}Controller): Router {`);
  lines.push(`  const router = Router();`);
  lines.push('');
  lines.push(`  router.get('/:id', (req: Request, res, next) => controller.getById(req, res, next));`);
  lines.push(`  router.post('/', auth, (req: Request, res, next) => controller.create(req as any, res, next));`);
  lines.push(`  router.patch('/:id', auth, (req: Request, res, next) => controller.update(req as any, res, next));`);
  lines.push(`  router.delete('/:id', auth, (req: Request, res, next) => controller.delete(req as any, res, next));`);
  lines.push('');
  lines.push(`  return router;`);
  lines.push(`}`);
  lines.push('');
  return lines.join('\n');
}
