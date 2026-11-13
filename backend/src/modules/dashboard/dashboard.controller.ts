import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import * as dashboardService from './dashboard.service';
import { DashboardFilters } from './dashboard.validation';

export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getDashboardAnalytics(
      req.query as unknown as DashboardFilters,
    );
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}
