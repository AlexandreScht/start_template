import cacheDefaultConfig, { cacheConfig } from '@/config/cache';
import { ExpiredSessionError, InvalidRoleAccessError } from '@/exceptions/errors';
import { type RequiredKey } from '@/interfaces/globa';
import { type Services } from '@/interfaces/services';
import { serializeCookies } from '@/utils/serialize';
import axios, { type RawAxiosRequestHeaders } from 'axios';
import { type CacheOptions, setupCache } from 'axios-cache-interceptor';
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

const AxiosInstance = ({ headers, cache, side }: Partial<Services.headerOption> = {}) => {
  const serverRequest = side === 'server' ? true : side === 'client' ? false : typeof window === 'undefined';
  const { 'Set-Cookies': setCookies, ...otherHeaders } = headers ?? {};
  const instance = AxiosRequest(otherHeaders);
  // if (serverRequest) {
  //   setupCache(instance, configureCache(cache as RequiredKey<Services.Cache.serverOption, 'key'>));
  // }
  instance.interceptors.response.use(
    async response => {
      const cookies = response.headers['set-cookie'];

      if (cookies?.length && serverRequest) {
        getRequestCookies(cookies);
      }

      return response;
    },
    error => {
      prepareAxiosError(error);
      return Promise.reject(error);
    },
  );
  instance.interceptors.request.use(async request => {
    if (serverRequest) {
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
    const baseURI = await getServerUri();
    request.baseURL = `${baseURI}/api`;

    return request;
  });

  return instance;
};

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
