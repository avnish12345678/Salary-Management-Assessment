import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import * as auditController from './audit.controller';
import { auditListQuerySchema } from './audit.validation';

const router = Router();

router.get(
  '/',
  authenticate,
  requirePermission('audit:read'),
  validate({ query: auditListQuerySchema }),
  auditController.list,
);

export default router;
