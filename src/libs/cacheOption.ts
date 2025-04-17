// import { type Services } from '@/interfaces/services';
// import CacheSingleton from '@/libs/nodeCache';
import { generateCacheKey } from '@/utils/serialize';
import { buildStorage, type CacheInstance } from 'axios-cache-interceptor';
import ServerMemory from './serverCache';

// import { buildMemoryStorage } from 'axios-cache-interceptor/dist/storage/memory';
export default function cacheDefaultConfig(): Partial<CacheInstance> {
  return {
    storage: buildStorage(ServerMemory),
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
