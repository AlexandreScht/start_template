import { type Services } from '@/interfaces/services';
import configureCache from '@/utils/configureCache';
import { generateCacheKey } from '@/utils/serialize';
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { type CacheRequestConfig, setupCache } from 'axios-cache-interceptor';
import ServerMemory from './serverCache';
// import CacheSingleton from './nodeCache';

const createRevalidateInstance = (cache?: Services.Config.serverCache): Services.Axios.revalidateInstance => {
  const instance = axios.create({
    baseURL: '/rev_cache',
  }) as Services.Axios.revalidateInstance;

  setupCache(instance as any, configureCache(cache as Services.Config.serverCache | undefined));

  instance.interceptors.request.use(async (request): Promise<InternalAxiosRequestConfig> => {
    const revalidateArgs = instance.revalidateArgs;

    const { url } = request as { url: string };
    const cacheKey = generateCacheKey(request as CacheRequestConfig<unknown, unknown>);

    const hasParams = url.split('/').length - 1 > 3;
    const hasQuery = url.includes('?');

    if (!hasParams && !hasQuery && !request?.data) {
      const { getAll: entries, remove } = ServerMemory;
      const xTags = entries.map(([key, data]) => {
        if (key.startsWith(cacheKey)) {
          const xTag: string | undefined = data?.data?.headers?.['x-tag'];
          remove(key);
          return xTag;
        }
      });

      instance.xTags = xTags.filter(tag => tag !== null) as string[];
    } else {
      const cacheValue = await ServerMemory.find(cacheKey);

      if (cacheValue?.data?.data) {
        instance.xTags = cacheValue.data.headers?.['x-tag'];
        if (revalidateArgs !== undefined) {
          ServerMemory.set(cacheKey, {
            ...cacheValue,
            createdAt: Date.now(),
            data: {
              ...cacheValue?.data,
              data: typeof revalidateArgs === 'function' ? revalidateArgs(cacheValue.data.data) : revalidateArgs,
            },
          });
        } else {
          ServerMemory.remove(cacheKey);
        }
      }
    }

    request.adapter = async (config): Promise<AxiosResponse> => {
      return {
        config,
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        request: {},
      };
    };
    return request;
  });

  instance.interceptors.response.use(
    async (res: Services.Axios.AxiosRevalidateResponse): Promise<Services.Axios.AxiosRevalidateResponse> => {
      res.xTags = instance?.xTags;
      return res;
    },
  );
  instance.revalidate = true;
  return instance;
};

export default createRevalidateInstance;
