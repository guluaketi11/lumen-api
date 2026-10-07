import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';
import { HttpError } from '../errors';

export const validate =
  (schema: ZodType, source: 'body' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
      throw new HttpError(400, 'validation_error', 'Request validation failed', details);
    }
    if (source === 'body') req.body = result.data;
    else res.locals.query = result.data;
    next();
  };
