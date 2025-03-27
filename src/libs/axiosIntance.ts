import { default as cacheConfig } from '@/config/cache';
import { ExpiredSessionError, InvalidRoleAccessError } from '@/exceptions/errors';
import { type Services } from '@/interfaces/services';
import { generateCacheKey, setLifeTime } from '@/utils/serialize';
import axios, { type AxiosResponse, type InternalAxiosRequestConfig, type RawAxiosRequestHeaders } from 'axios';
import { type AxiosStorage, type CacheOptions, type CacheRequestConfig, setupCache } from 'axios-cache-interceptor';
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

const configureCache = (cacheOptions: Services.Config.serverCache | undefined) => {
  const { serverConfig, lifeTime: ttl, persist, enabled: cachePredicate, ...other } = cacheOptions || {};
  const { PERSIST_TIME_LIFE, DEFAULT_TIME_LIFE } = cacheConfig;
  const timeCache = persist ? PERSIST_TIME_LIFE : (ttl ?? DEFAULT_TIME_LIFE);

  return typeof window === 'undefined'
    ? ({
        ...cacheDefaultConfig(timeCache),
        ...(typeof serverConfig === 'function' ? { serverConfig } : { interpretHeader: serverConfig ?? true }),
        ttl: (req: CacheRequestConfig) => setLifeTime(req, timeCache),
        ...(typeof cachePredicate === 'function' ? { cachePredicate } : {}),
        ...other,
      } satisfies CacheOptions)
    : {};
};

const AxiosInstance = ({ headers, cache, side, revalidate, revalidateArgs }: Services.Axios.axiosApi): Services.Axios.instance => {
  const serverRequest = side === 'server' ? true : side === 'client' ? false : typeof window === 'undefined';
  const { 'Set-Cookies': setCookies, ...otherHeaders } = headers ?? {};
  const instance: Services.Axios.instance = AxiosRequest(otherHeaders);
  if (serverRequest) {
    setupCache(instance, configureCache(cache as Services.Config.serverCache | undefined));
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
        await revalidateCache(request, instance as Services.Axios.instanceStorage, revalidateArgs);
        request.adapter = async (config): Promise<AxiosResponse> => {
          return {
            data: undefined,
            status: 200,
            statusText: 'OK',
            headers: headers ?? ({} as any),
            config: config,
            request: {},
          };
        };
        return request;
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

async function revalidateCache(
  request: InternalAxiosRequestConfig<any>,
  { storage: cacheStore }: Services.Axios.instanceStorage,
  revalidateArgs?: unknown,
) {
  const cacheKey = generateCacheKey(request);
  if (request?.params || request?.data) {
    if (revalidateArgs !== undefined) {
      if (typeof revalidateArgs === 'function') {
        const oldValues = await (cacheStore as AxiosStorage).get(cacheKey);
        await (cacheStore as AxiosStorage).set(cacheKey, revalidateArgs(oldValues));
      } else {
        await (cacheStore as AxiosStorage).set(cacheKey, revalidateArgs as any);
      }
    } else {
      await (cacheStore as AxiosStorage).remove(cacheKey);
    }
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
