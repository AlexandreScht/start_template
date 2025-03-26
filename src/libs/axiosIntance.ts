import { default as cacheConfig } from '@/config/cache';
import { ExpiredSessionError, InvalidRoleAccessError } from '@/exceptions/errors';
import { type RequiredKey } from '@/interfaces/globa';
import { type Services } from '@/interfaces/services';
import { generateCacheKey } from '@/utils/serialize';
import axios, { type InternalAxiosRequestConfig, type RawAxiosRequestHeaders } from 'axios';
import { type AxiosStorage, type CacheOptions, setupCache } from 'axios-cache-interceptor';
import { serialize } from 'cookie';
import { getRequestCookies, getServerUri, serializeCookies, setRequestCookies } from '../utils/cookies';
import cacheDefaultConfig from './cacheOption';

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
  const { serverConfig, lifeTime: ttl, persist, enabled: cachePredicate, ...other } = cacheOptions;
  const { PERSIST_TIME_LIFE, DEFAULT_TIME_LIFE } = cacheConfig;
  const timeCache = persist ? PERSIST_TIME_LIFE : (ttl ?? DEFAULT_TIME_LIFE);

  return typeof window === 'undefined'
    ? ({
        ...cacheDefaultConfig(timeCache),
        ...(typeof serverConfig === 'function' ? { serverConfig } : { interpretHeader: serverConfig ?? true }),
        ttl: timeCache * 1000,
        ...(typeof cachePredicate === 'function' ? { cachePredicate } : {}),
        ...other,
      } satisfies CacheOptions)
    : {};
};

const AxiosInstance = ({ headers, cache, side, revalidate = false }: Partial<> = {}): Services.Axios.instance => {
  console.log(side);

  const serverRequest = side === 'server' ? true : side === 'client' ? false : typeof window === 'undefined';
  const { 'Set-Cookies': setCookies, ...otherHeaders } = headers ?? {};
  const instance: Services.Axios.instance = AxiosRequest(otherHeaders);
  if (serverRequest) {
    setupCache(instance, configureCache(cache as RequiredKey<Services.Cache.serverOption, 'key'>));
  }
  instance.interceptors.response.use(
    async response => {
      const cookies = response.headers['set-cookie'];

      if (cookies?.length && serverRequest) {
        getRequestCookies(cookies);
      }
      return response;
    },

    error => {
      console.log(error);

      prepareAxiosError(error);
      return Promise.reject(error);
    },
  );
  instance.interceptors.request.use(async request => {
    if (serverRequest) {
      if (revalidate) {
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

async function revalidateCache(request: InternalAxiosRequestConfig<any>, { storage: cacheStore }: Services.Axios.instanceStorage) {
  const cacheKey = generateCacheKey(request);
  if (request.params || request.data) {
    await (cacheStore as AxiosStorage).remove(cacheKey);
  } else {
    const { data, 'is-storage': storageLength } = cacheStore as Services.Axios.CacheStorage;
    if (storageLength) {
      Promise.all(
        Object.keys(data)
          .filter(key => key.startsWith(cacheKey))
          .map(key => (cacheStore as AxiosStorage).remove(key)),
      );
    }
  }
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
