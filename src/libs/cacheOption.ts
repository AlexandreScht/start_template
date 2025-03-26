import CacheSingleton from '@/libs/nodeCache';
import { generateCacheKey } from '@/utils/serialize';
import { buildStorage, type CacheInstance } from 'axios-cache-interceptor';

export default function cacheDefaultConfig(timeLife: number): Partial<CacheInstance> {
  const cache = CacheSingleton.getInstance();
  return {
    storage: buildStorage({
      find(key) {
        return cache.get(key);
      },
      set(key, value) {
        cache.set(key, value, timeLife);
      },
      remove(key) {
        cache.del(key);
      },
      async clear() {
        return cache.flushAll();
      },
    }),
    generateKey: req => generateCacheKey(req),
    debug: ({ id, msg, data }) => console.log({ id, msg, data }),
    headerInterpreter: headers => {
      if (headers && headers['x-cache-option']) {
        try {
          const option = JSON.parse(headers['x-cache-option']) satisfies { cache: number; stale?: number };

          if (option.cache < 1) {
            return 'dont cache';
          }

          return option;
        } catch (error) {
          return 'not enough headers';
        }
      }
      return 'not enough headers';
    },
    waiting: new Map(),
    // requestInterceptor: defaultRequestInterceptor(AxiosInstance)
    // responseInterceptor: defaultResponseInterceptor(AxiosInstance)
  } satisfies Partial<CacheInstance>;
}
