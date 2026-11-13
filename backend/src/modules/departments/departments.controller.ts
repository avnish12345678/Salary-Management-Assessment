import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import * as departmentsService from './departments.service';

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await departmentsService.listDepartments();
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}
