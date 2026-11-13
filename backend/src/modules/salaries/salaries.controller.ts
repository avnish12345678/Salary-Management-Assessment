import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import * as salariesService from './salaries.service';
import {
  CreateOrReviseSalaryInput,
  GlobalHistoryQuery,
  SalaryHistoryQuery,
} from './salaries.validation';

function clientIp(req: Request) {
  return req.ip ?? req.socket.remoteAddress ?? null;
}

export async function getCurrent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await salariesService.getCurrentSalary(req.params.employeeId);
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await salariesService.listSalaryHistory(
      req.params.employeeId,
      req.query as unknown as SalaryHistoryQuery,
    );
    return sendSuccess(res, result.items, 200, result.meta);
  } catch (error) {
    return next(error);
  }
}

export async function revisions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await salariesService.listRevisions(
      req.params.employeeId,
      req.query as unknown as SalaryHistoryQuery,
    );
    return sendSuccess(res, result.items, 200, result.meta);
  } catch (error) {
    return next(error);
  }
}

export async function compare(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await salariesService.compareCurrentAndPrevious(req.params.employeeId);
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function revise(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await salariesService.reviseSalary(
      req.params.employeeId,
      req.body as CreateOrReviseSalaryInput,
      req.user!.id,
      clientIp(req),
    );
    return sendSuccess(res, data, 201);
  } catch (error) {
    return next(error);
  }
}

export async function globalHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await salariesService.listGlobalRevisions(
      req.query as unknown as GlobalHistoryQuery,
    );
    return sendSuccess(res, result.items, 200, result.meta);
  } catch (error) {
    return next(error);
  }
}
