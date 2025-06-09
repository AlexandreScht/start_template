import { logger } from '@/utils/logger';
import Bottleneck from 'bottleneck';
import { type NextFunction, type Request, type Response } from 'express';
import os from 'os';

const cpuCount = os.cpus().length;

const limiter = new Bottleneck({
  maxConcurrent: Math.max(cpuCount - 1, 1),
  minTime: 100,
  reservoir: 600,
  reservoirRefreshInterval: 60 * 1000,
  reservoirRefreshAmount: 600,
  highWater: 1000,
  strategy: Bottleneck.strategy.LEAK,
});

limiter.on('error', err => logger.error('Limiter error:', err));

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  limiter
    .schedule(() => Promise.resolve())
    .then(() => next())
    .catch(() => res.status(429).send('Serveur occupé'));
}
