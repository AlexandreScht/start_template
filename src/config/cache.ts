import RedisInstance from '@/libs/redis';
import { buildMemoryStorage, buildStorage, canStale, type CacheOptions } from 'axios-cache-interceptor';
const cacheConfig = (key: string, storage: 'redis' | 'ram' = 'redis') =>
  ({
    storage:
      storage === 'ram'
        ? buildMemoryStorage(/* cloneData default=*/ false, /* cleanupInterval default=*/ false, /* maxEntries default=*/ false)
        : buildStorage({
            async find(key: string) {
              return await RedisInstance.get(`cache:${key}`);
            },
            async set(key: string, value: any, req?: any) {
              let expireTime: number | undefined;

              if (value.state === 'loading') {
                expireTime = Date.now() + (req?.cache?.ttl ?? 60000);
              } else if ((value.state === 'stale' && value.ttl) || (value.state === 'cached' && !canStale(value))) {
                expireTime = value.createdAt + value.ttl;
              }

              if (expireTime) {
                await RedisInstance.set(`cache:${key}`, JSON.stringify(value), 'PXAT', expireTime);
              } else {
                await RedisInstance.set(`cache:${key}`, JSON.stringify(value));
              }
            },
            async remove(key: string) {
              await RedisInstance.del(`cache:${key}`);
            },
          }),
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
  }) satisfies CacheOptions;

export default cacheConfig;
