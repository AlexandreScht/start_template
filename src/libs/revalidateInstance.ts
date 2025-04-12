import { type Services } from '@/interfaces/services';
import configureCache from '@/utils/configureCache';
import { generateCacheKey } from '@/utils/serialize';
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { setupCache, type AxiosStorage } from 'axios-cache-interceptor';
import CacheSingleton from './nodeCache';

const createRevalidateInstance = (cache?: Services.Config.serverCache): Services.Axios.revalidateInstance => {
  const instance: Services.Axios.revalidateInstance = axios.create({
    baseURL: '/rev_cache',
  });

  setupCache(instance, configureCache(cache as Services.Config.serverCache | undefined));

  instance.interceptors.request.use(async (request: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    const storage = CacheSingleton.getInstance();
    const revalidateArgs = instance.revalidateArgs;

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
            ...oldValues?.data,
            data: typeof revalidateArgs === 'function' ? revalidateArgs(oldValues?.data?.data) : revalidateArgs,
          },
        };
        storage.set(cacheKey, newValue);
      } else {
        storage.del(cacheKey);
      }
    } else {
      const nodeCacheKeys = storage.keys();

      nodeCacheKeys.forEach(key => {
        if (key.startsWith(cacheKey)) {
          storage.del(key);
        }
      });
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
  instance.revalidate = true;
  return instance;
};

export default createRevalidateInstance;
