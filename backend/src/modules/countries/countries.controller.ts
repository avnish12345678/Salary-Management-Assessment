import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import * as countriesService from './countries.service';

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await countriesService.listCountries();
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}
