import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { HttpError } from '../errors/HttpError';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.errors
          .map((e) => (e.path.length > 0 ? `${e.path.join('.')}: ${e.message}` : e.message))
          .join('; ');
        return next(new HttpError(400, `Validation failed: ${issues}`, err.errors));
      }
      next(err);
    }
  };
}
