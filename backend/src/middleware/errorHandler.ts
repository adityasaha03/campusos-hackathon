import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/HttpError';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  console.error('Unhandled server error:', err);
  return res.status(500).json({
    error: err?.message || 'Internal server error',
  });
}
