import { rateLimierConfig } from '@/config/limiter';
import { InvalidArgumentError } from '@/exceptions/errors';
import { type Middlewares } from '@/interfaces/middlewares';

const limiters = new Map<keyof typeof rateLimierConfig, RateLimiter>();

class RateLimiter {
  private readonly requests = new Map<string, number[]>();
  private config: Middlewares.RateLimitConfig;

  constructor(config: Middlewares.RateLimitConfig) {
    this.config = config;

    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(timestamp => now - timestamp < this.config.windowMs);

      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }

  public checkLimit(identifier: string): boolean {
    const now = Date.now();
    const key = identifier;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const timestamps = this.requests.get(key)!;

    const validTimestamps = timestamps.filter(timestamp => now - timestamp < this.config.windowMs);

    if (validTimestamps.length >= this.config.maxRequests) {
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return true;
  }
}

export function rateLimitMiddleware(key: keyof typeof rateLimierConfig, identifier: string): void {
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new RateLimiter(rateLimierConfig[key]);
    limiters.set(key, limiter);
  }

  if (!limiter.checkLimit(identifier)) {
    throw new InvalidArgumentError('Rate limit exceeded. Please try again later.');
  }
}
