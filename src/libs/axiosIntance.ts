import cacheDefaultConfig, { cacheConfig } from '@/config/cache';
import { ExpiredSessionError, InvalidRoleAccessError } from '@/exceptions/errors';
import { type RequiredKey } from '@/interfaces/globa';
import { type Services } from '@/interfaces/services';
import { serializeCookies } from '@/utils/serialize';
import axios, { type InternalAxiosRequestConfig, type RawAxiosRequestHeaders } from 'axios';
import { AxiosStorage, type CacheOptions, setupCache } from 'axios-cache-interceptor';
import { serialize } from 'cookie';
import { getRequestCookies, getServerUri, setRequestCookies } from '../utils/cookies';

const AxiosRequest = (headersOption: RawAxiosRequestHeaders & { withCredentials?: boolean }) => {
  const { Authorization, 'Content-Type': ContentType, withCredentials, ...headers } = headersOption ?? {};
  return axios.create({
    headers: {
      ...(Authorization ? { Authorization: `Bearer ${Authorization}` } : {}),
      ...(ContentType ? { 'Content-Type': ContentType } : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    withCredentials: withCredentials ?? true,
  });
};

const configureCache = (cacheOptions: RequiredKey<Services.Cache.serverOption, 'key'>) => {
  const { key, serverConfig, lifeTime: ttl, persist, enabled: cachePredicate, ...other } = cacheOptions;
  const { persistTimeLife, defaultTimeLife } = cacheConfig;
  return typeof window === 'undefined'
    ? ({
        ...cacheDefaultConfig(key),
        ...(typeof serverConfig === 'function' ? { serverConfig } : { interpretHeader: serverConfig ?? true }),
        ttl: persist ? persistTimeLife : (ttl ?? defaultTimeLife),
        ...(typeof cachePredicate === 'function' ? { cachePredicate } : {}),
        ...other,
      } satisfies CacheOptions)
    : {};
};

const AxiosInstance = ({ headers, cache, side, revalidate = false }: Partial<Services.axiosInstance> = {}) => {
  console.log(side);

  const serverRequest = side === 'server' ? true : side === 'client' ? false : typeof window === 'undefined';
  const { 'Set-Cookies': setCookies, ...otherHeaders } = headers ?? {};
  const instance = AxiosRequest(otherHeaders);
  if (serverRequest) {
    setupCache(instance, { generateKey: req => 'accountTest' });
    // setupCache(instance, configureCache(cache as RequiredKey<Services.Cache.serverOption, 'key'>));
  }
  instance.interceptors.response.use(
    async response => {
      const cookies = response.headers['set-cookie'];

      if (cookies?.length && serverRequest) {
        getRequestCookies(cookies);
      }

      console.log(instance.storage);
      // { 'is-storage': 1, data: { myKey: {}}}
      const v = await instance.storage.get('accountTest');
      console.log(v);
      return response;
    },

    error => {
      console.log(error);

      prepareAxiosError(error);
      return Promise.reject(error);
    },
  );
  instance.interceptors.request.use(async request => {
    console.log('here');
    if (serverRequest) {
      console.log('here');
      if (revalidate) {
        console.log('here');

        await revalidateCache(request, instance as Services.Axios.instanceStorage);
        return Promise.resolve({
          data: undefined,
          status: 200,
          statusText: 'OK',
          headers: headers,
          config: request,
          request: {},
        });
      }
      const cookies = await setRequestCookies();
      const mappedCookies = setCookies ? [...cookies, ...(await serializeCookies(setCookies))] : cookies;
      const formattedCookies = mappedCookies
        ?.map(cookie => {
          const { name, value, ...options } = cookie;
          return serialize(name, value, options);
        })
        .join('; ');

      if (formattedCookies?.length) {
        request.headers['Cookie'] = formattedCookies;
      }
    }
    request.baseURL = await getServerUri();

    return request;
  });
  instance.revalidate = revalidate;
  return instance;
};

function generateCacheKey(request: InternalAxiosRequestConfig<any>) {
  const { method, url, params, data } = request;
  let key = method.toUpperCase() + url;
  if (params) {
    key += JSON.stringify(params);
  }
  if (data) {
    key += JSON.stringify(data);
  }
  return key;
}

async function revalidateCache(request: InternalAxiosRequestConfig<any>, { storage: cacheStore }: Services.Axios.instanceStorage) {
  const cacheKey = generateCacheKey(request);
  console.log(cacheKey);

  console.log(cacheStore);
  // const keys = await cacheStore?.keys();
  cacheStore?.forEach((entry, key) => {
    // if (key.startsWith(prefix)) {
    //   axios.storage.remove(key);
    // }
    console.log(key);
  });
  // if (request.params || request.data) {
  //   await cacheStore.remove(cacheKey);
  // } else {
  //   const keys = await cacheStore.keys();
  //   const prefix = request.method.toUpperCase() + request.url;
  //   for (const key of keys) {
  //     if (key.startsWith(prefix)) {
  //       await cacheStore.delete(key);
  //     }
  //   }
  // }
}

function prepareAxiosError(err: any) {
  const {
    status,
    data: { error },
  } = err?.response || { data: {} };

  if (status === 605) {
    throw new InvalidRoleAccessError(error);
  }
  if (status === 999 && error === 'Session expired') {
    throw new ExpiredSessionError();
  }
}

export default AxiosInstance;
