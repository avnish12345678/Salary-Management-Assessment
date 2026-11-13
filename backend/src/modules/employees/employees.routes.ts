import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import * as employeesController from './employees.controller';
import {
  employeeCreateSchema,
  employeeIdParamsSchema,
  employeeListQuerySchema,
  employeeStatusSchema,
  employeeUpdateSchema,
} from './employees.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('employees:read'),
  validate({ query: employeeListQuerySchema }),
  employeesController.list,
);

router.get(
  '/meta/designations',
  requirePermission('employees:read'),
  employeesController.designations,
);

router.get(
  '/:id',
  requirePermission('employees:read'),
  validate({ params: employeeIdParamsSchema }),
  employeesController.getById,
);

router.post(
  '/',
  requirePermission('employees:write'),
  validate({ body: employeeCreateSchema }),
  employeesController.create,
);

router.patch(
  '/:id',
  requirePermission('employees:write'),
  validate({ params: employeeIdParamsSchema, body: employeeUpdateSchema }),
  employeesController.update,
);

router.patch(
  '/:id/status',
  requirePermission('employees:write'),
  validate({ params: employeeIdParamsSchema, body: employeeStatusSchema }),
  employeesController.setStatus,
);

export default router;
