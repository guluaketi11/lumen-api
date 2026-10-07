import { NextFunction, Request, Response } from 'express';
import { UniqueConstraintError } from 'sequelize';
import { HttpError } from '../errors';

export const notFoundHandler = (req: Request) => {
  throw new HttpError(404, 'not_found', `Route ${req.method} ${req.path} not found`);
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  if (err instanceof UniqueConstraintError) {
    res.status(409).json({ error: { code: 'conflict', message: 'A record with these values already exists' } });
    return;
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { code: 'invalid_json', message: 'Request body is not valid JSON' } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong on our side' } });
};
