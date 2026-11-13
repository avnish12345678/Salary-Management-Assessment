import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/api-response';

export function notFoundHandler(_req: Request, res: Response) {
  return sendError(res, 404, 'Route not found');
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return sendError(res, 400, 'Validation failed', err.flatten());
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, {
        requestId: req.requestId,
        details: err.details,
      });
    }
    return sendError(res, err.statusCode, err.message, err.details);
  }

  logger.error('Unhandled error', {
    requestId: req.requestId,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  return sendError(res, 500, 'Internal server error');
}
