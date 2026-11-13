import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import * as salariesController from './salaries.controller';
import {
  createOrReviseSalarySchema,
  employeeIdParamsSchema,
  globalHistoryQuerySchema,
  salaryHistoryQuerySchema,
} from './salaries.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/revisions',
  requirePermission('salaries:read'),
  validate({ query: globalHistoryQuerySchema }),
  salariesController.globalHistory,
);

router.get(
  '/employees/:employeeId/current',
  requirePermission('salaries:read'),
  validate({ params: employeeIdParamsSchema }),
  salariesController.getCurrent,
);

router.get(
  '/employees/:employeeId/history',
  requirePermission('salaries:read'),
  validate({ params: employeeIdParamsSchema, query: salaryHistoryQuerySchema }),
  salariesController.history,
);

router.get(
  '/employees/:employeeId/revisions',
  requirePermission('salaries:read'),
  validate({ params: employeeIdParamsSchema, query: salaryHistoryQuerySchema }),
  salariesController.revisions,
);

router.get(
  '/employees/:employeeId/compare',
  requirePermission('salaries:read'),
  validate({ params: employeeIdParamsSchema }),
  salariesController.compare,
);

router.post(
  '/employees/:employeeId/revisions',
  requirePermission('salaries:write'),
  validate({ params: employeeIdParamsSchema, body: createOrReviseSalarySchema }),
  salariesController.revise,
);

export default router;
