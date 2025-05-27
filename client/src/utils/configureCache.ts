import cacheConfig from '@/config/cache';
import { type Services } from '@/interfaces/services';
import cacheDefaultConfig from '@/libs/cacheOption';
import { type CacheOptions, type CacheRequestConfig } from 'axios-cache-interceptor';
import { setLifeTime } from './serialize';

export default function configureCache(cacheOptions?: Services.Config.serverCache | undefined) {
  const { serverConfig, lifeTime: ttl, persist, enabled: cachePredicate, ...other } = cacheOptions || {};
  const { PERSIST_TIME_LIFE, DEFAULT_TIME_LIFE } = cacheConfig;
  const timeCache = persist ? PERSIST_TIME_LIFE : (ttl ?? DEFAULT_TIME_LIFE);

  return typeof window === 'undefined'
    ? ({
        ...cacheDefaultConfig(),
        ...(typeof serverConfig === 'function' ? { serverConfig } : { interpretHeader: serverConfig ?? true }),
        ttl: (req: CacheRequestConfig) => setLifeTime(req, timeCache),
        ...(typeof cachePredicate === 'function' ? { cachePredicate } : {}),
        ...other,
      } satisfies CacheOptions)
    : {};
}
