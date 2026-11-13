import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import * as dashboardController from './dashboard.controller';
import { dashboardFiltersSchema } from './dashboard.validation';

const router = Router();

router.get(
  '/analytics',
  authenticate,
  requirePermission('dashboard:read'),
  validate({ query: dashboardFiltersSchema }),
  dashboardController.getAnalytics,
);

export default router;
