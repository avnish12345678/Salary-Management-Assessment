import { Response } from 'express';

export type ApiMeta = {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: ApiMeta,
) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
    meta: meta ?? null,
  });
}

export function sendError(
  res: Response,
  status: number,
  message: string,
  details?: unknown,
) {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      message,
      details: details ?? null,
    },
    meta: null,
  });
}
