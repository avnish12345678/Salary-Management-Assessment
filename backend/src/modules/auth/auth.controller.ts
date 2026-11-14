import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import * as authService from './auth.service';
import { ChangePasswordInput, LoginInput } from './auth.validation';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body as LoginInput);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.getCurrentUser(req.user!.id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = authService.logout();
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.changePassword(
      req.user!.id,
      req.body as ChangePasswordInput,
    );
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}
