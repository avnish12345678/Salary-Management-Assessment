import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import * as departmentsController from './departments.controller';

const router = Router();

router.get('/', authenticate, requirePermission('employees:read'), departmentsController.list);

export default router;
