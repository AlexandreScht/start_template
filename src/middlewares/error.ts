import config from '@/config';
import { ServerException } from '@exceptions';
import { logger } from '@utils/logger';
import { NextFunction, Request, Response } from 'express';

export const ErrorMiddleware = (error: ServerException, req: Request, res: Response, next: NextFunction) => {
  try {
    const status: number = error.status || 500;
    const message: string = error.message || 'Une erreur est survenue. Veuillez réessayer plus tard.';
    if (config.NODE_ENV !== 'test') logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`);
    res.status(status).send({ error: message });
  } catch (error) {
    next(error);
  }
};
