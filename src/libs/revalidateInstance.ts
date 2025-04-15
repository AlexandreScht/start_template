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

  instance.interceptors.request.use(async (request): Promise<InternalAxiosRequestConfig> => {
    const storage = CacheSingleton.getInstance();
    const revalidateArgs = instance.revalidateArgs;

    const { url } = request as { url: string };
    const cacheKey = generateCacheKey(request);

    const hasParams = url.split('/').length - 1 > 3;
    const hasQuery = url.includes('?');

    if (hasParams || hasQuery || request?.data) {
      const cachedValues = await (storage as unknown as AxiosStorage).get(cacheKey);
      if (revalidateArgs !== undefined) {
        console.log(cachedValues?.data);
        if (cachedValues?.data?.data) {
          const newValue = {
            ...cachedValues,
            createdAt: Date.now(),
            data: {
              ...cachedValues?.data,
              data: (typeof revalidateArgs === 'function' ? revalidateArgs(cachedValues?.data?.data) : revalidateArgs) || cachedValues?.data?.data,
            },
          };

          console.log(newValue);

          storage.set(cacheKey, newValue);
        }
      } else {
        request.headers.set('x-tag', cachedValues.data?.headers?.['x-tag']);
        storage.del(cacheKey);
      }
    } else {
      const nodeCacheKeys = storage.keys();

      const xTags = await Promise.all(
        nodeCacheKeys.map(async key => {
          if (key.startsWith(cacheKey)) {
            const cachedValues = await (storage as unknown as AxiosStorage).get(key);
            const xTag: string | undefined = cachedValues?.data?.headers?.['x-tag'];
            storage.del(key);
            return xTag || null;
          }
          return null;
        }),
      );

      request.headers.set('x-tag', xTags.filter(tag => tag !== null) as string[]);
    }

    request.adapter = async (config): Promise<AxiosResponse> => {
      return {
        config,
        data: config.data || {},
        status: 200,
        statusText: 'OK',
        headers: config?.headers ?? {},
        request: {},
      };
    };
    return request;
  });

  instance.interceptors.response.use(async (res: Services.Axios.AxiosRevalidateResponse) => {
    res.xTags = res.headers?.['x-tag'];
    return res;
  });
  instance.revalidate = true;
  return instance;
};

export default createRevalidateInstance;
