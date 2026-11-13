import { NextFunction, Request, Response, Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import * as reportsController from './reports.controller';
import { reportFiltersSchema } from './reports.validation';

const router = Router();

function requireExportWhenNeeded(req: Request, res: Response, next: NextFunction) {
  const format = String(req.query.format ?? 'json');
  if (format === 'csv' || format === 'xlsx') {
    return requirePermission('reports:export')(req, res, next);
  }
  return next();
}

router.get(
  '/summary',
  authenticate,
  requirePermission('reports:read'),
  validate({ query: reportFiltersSchema }),
  requireExportWhenNeeded,
  reportsController.getSummary,
);

export default router;
