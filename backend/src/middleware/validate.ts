import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

type ValidationTarget = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export function validate(schema: ValidationTarget) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query) as Request['query'];
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params) as Request['params'];
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
