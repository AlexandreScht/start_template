import cacheConfig from '@/config/cache';
import { type Services } from '@/interfaces/services';
import { generateCacheKey } from '@/utils/serialize';
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { setupCache, type AxiosStorage, type CacheOptions } from 'axios-cache-interceptor';
import cacheDefaultConfig from './cacheOption';
import CacheSingleton from './nodeCache';

const createRevalidateInstance = (revalidateArgs?: unknown) => {
  const instance = axios.create({
    baseURL: '/dummy',
  });

  setupCache(instance, {
    ...cacheDefaultConfig(cacheConfig.DEFAULT_TIME_LIFE),
  } satisfies CacheOptions);

  instance.interceptors.request.use(async (request: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const storage = CacheSingleton.getInstance();

    const { url } = request as { url: string };
    const cacheKey = generateCacheKey(request);

    const hasParams = url.split('/').length - 1 > 3;
    const hasQuery = url.includes('?');

    if (hasParams || hasQuery || request?.data) {
      if (revalidateArgs !== undefined) {
        const oldValues = await (storage as unknown as AxiosStorage).get(cacheKey);
        const newValue = {
          ...oldValues,
          createdAt: Date.now(),
          data: {
            ...oldValues.data,
            data: typeof revalidateArgs === 'function' ? revalidateArgs(oldValues?.data?.data) : revalidateArgs,
          },
        };
        storage.set(cacheKey, newValue);
      } else {
        storage.del(cacheKey);
      }
    } else {
      // (request as any).cache = false;

      const nodeCacheKeys = storage.keys();

      console.log(nodeCacheKeys);
      console.log(cacheKey);

      nodeCacheKeys.forEach(key => {
        console.log(key);

        if (key.startsWith(cacheKey)) {
          console.log(key);

          storage.del(key);
        }
      });

      console.log(storage);
      console.log(storage.keys());
    }

    request.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      return {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: config.headers || {},
        config: config,
        request: {},
      };
    };

    return request;
  });

  return instance;
};

export default createRevalidateInstance;
