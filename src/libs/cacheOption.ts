import { type Services } from '@/interfaces/services';
import CacheSingleton from '@/libs/nodeCache';
import { generateCacheKey, setLifeTime } from '@/utils/serialize';
import { buildStorage, type CacheInstance, type CacheRequestConfig } from 'axios-cache-interceptor';

export default function cacheDefaultConfig(timeLife: Services.Config.serverCache['lifeTime']): Partial<CacheInstance> {
  const cache = CacheSingleton.getInstance();
  return {
    storage: buildStorage({
      find(key) {
        return cache.get(key);
      },
      set(key, value, currentRequest) {
        cache.set(key, value, setLifeTime(currentRequest as CacheRequestConfig<any, any>, timeLife, true));
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
