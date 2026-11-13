import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import * as auditListService from './audit.list.service';
import { AuditListQuery } from './audit.validation';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await auditListService.listAuditLogs(req.query as unknown as AuditListQuery);
    return sendSuccess(res, result.items, 200, result.meta);
  } catch (error) {
    return next(error);
  }
}
