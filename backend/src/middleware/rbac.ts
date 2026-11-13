import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { hasPermission, Permission } from '../utils/permissions';

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const allowed = permissions.every((permission) =>
      hasPermission(req.user!.role, permission),
    );

    if (!allowed) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    return next();
  };
}
