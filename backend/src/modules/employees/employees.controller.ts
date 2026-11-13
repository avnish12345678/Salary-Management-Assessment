import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import * as employeesService from './employees.service';
import {
  EmployeeCreateInput,
  EmployeeListQuery,
  EmployeeUpdateInput,
} from './employees.validation';

function clientIp(req: Request) {
  return req.ip ?? req.socket.remoteAddress ?? null;
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await employeesService.listEmployees(req.query as unknown as EmployeeListQuery);
    return sendSuccess(res, result.items, 200, result.meta);
  } catch (error) {
    return next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await employeesService.getEmployeeById(req.params.id);
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await employeesService.createEmployee(
      req.body as EmployeeCreateInput,
      req.user!.id,
      clientIp(req),
    );
    return sendSuccess(res, data, 201);
  } catch (error) {
    return next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await employeesService.updateEmployee(
      req.params.id,
      req.body as EmployeeUpdateInput,
      req.user!.id,
      clientIp(req),
    );
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function setStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await employeesService.setEmployeeStatus(
      req.params.id,
      req.body.employmentStatus,
      req.user!.id,
      clientIp(req),
    );
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export async function designations(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await employeesService.listDesignations();
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}
