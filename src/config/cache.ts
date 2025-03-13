import { buildMemoryStorage, type CacheInstance } from 'axios-cache-interceptor';

export const cacheConfig = {
  defaultTimeLife: 1000 * 60 * 3, // 3 min
  persistTimeLife: 1000 * 60 * 60 * 24 * 365, // 1 year,
};
export default function cacheDefaultConfig(key: string): Partial<CacheInstance> {
  return {
    storage: buildMemoryStorage(/* cloneData default=*/ false, /* cleanupInterval default=*/ false, /* maxEntries default=*/ false),
    generateKey: req => {
      const { params, data } = req;
      const paramsString = params ? JSON.stringify(params) : null;
      const dataString = data ? JSON.stringify(data) : null;
      return `${key}:values_${paramsString}_${dataString}`;
    },
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
