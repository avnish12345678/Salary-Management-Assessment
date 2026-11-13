import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import * as countriesController from './countries.controller';

const router = Router();

router.get('/', authenticate, requirePermission('employees:read'), countriesController.list);

export default router;
