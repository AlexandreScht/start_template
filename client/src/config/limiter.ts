import { type Middlewares } from '@/interfaces/middlewares';

export const rateLimierConfig = {
  default: {
    windowMs: 60000, // 1 minute
    maxRequests: 100, // 100 requêtes par minute
  },
  auth: {
    windowMs: 900000, // 15 minutes
    maxRequests: 5, // 5 tentatives de connexion par 15 minutes
  },
} as const satisfies Record<string, Middlewares.RateLimitConfig>;
