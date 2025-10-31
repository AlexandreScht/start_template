import cacheConfig from '@/config/cache';
import cacheDefaultConfig from '@/lib/cacheOption';
import ServerMemory from '@/lib/serverCache';
import type { CacheOptions, CachePredicateObject, CacheRequestConfig, HeaderInterpreter } from 'axios-cache-interceptor';
import { setLifeTime } from './serialize';

export type ConfigureCacheOptions = {
  serverConfig?: HeaderInterpreter | ((headers: any) => any);
  lifeTime?: number;
  persist?: boolean;
  enabled?: CachePredicateObject | ((config: CacheRequestConfig) => boolean);
  allowedHeaders?: string[];
  tags?: string[];
} & Partial<CacheOptions>;

export default function configureCache( cacheKey: string, cacheOptions?: ConfigureCacheOptions): CacheOptions | {} {
  if (typeof window !== 'undefined') {
    return {};
  }

  const { 
    serverConfig, 
    lifeTime: customTTL, 
    persist, 
    enabled: cachePredicate,
    allowedHeaders,
    tags,
    ...otherOptions 
  } = cacheOptions || {};

  if (allowedHeaders && allowedHeaders.length > 0) {
    ServerMemory.addAllowedHeaders(allowedHeaders);
  }

  const { PERSIST_TIME_LIFE, DEFAULT_TIME_LIFE } = cacheConfig;
  const cacheLifeTime = persist ? PERSIST_TIME_LIFE : (customTTL ?? DEFAULT_TIME_LIFE);

  return {
    ...cacheDefaultConfig(cacheKey, tags || []),
    ...(typeof serverConfig === 'function' 
      ? { serverConfig } 
      : { interpretHeader: serverConfig ?? true }
    ),
    ttl: (req: CacheRequestConfig) => setLifeTime(req, cacheLifeTime),
    ...(typeof cachePredicate === 'function' ? { cachePredicate } : {}),
    ...otherOptions,
    location: 'server',
  } satisfies CacheOptions;
}
