import cacheDefaultConfig, { cacheConfig } from '@/config/cache';
import { ExpiredSessionError, InvalidRoleAccessError } from '@/exceptions/errors';
import { Services } from '@/interfaces/services';
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

const configureCache = (cacheOptions: Services.Cache.options = {}) => {
  const { key, storage, serverConfig, lifeTime: ttl, persist, enabled: cachePredicate, ...other } = cacheOptions;
  const { persistTimeLife, defaultTimeLife } = cacheConfig;
  return {
    ...cacheDefaultConfig({ key, storage }),
    ...(typeof serverConfig === 'function' ? { serverConfig } : { interpretHeader: serverConfig ?? true }),
    ttl: persist ? persistTimeLife : (ttl ?? defaultTimeLife),
    ...(typeof cachePredicate === 'function' ? { cachePredicate } : {}),
    ...other,
  } satisfies CacheOptions;
};

const AxiosInstance = ({ headers, cache }: Services.headerOption = {}) => {
  const serverRequest = typeof window === 'undefined';
  const { 'Set-Cookies': setCookies, ...otherHeaders } = headers ?? {};
  const instance = AxiosRequest(otherHeaders);
  if (serverRequest && !!cache?.enabled) setupCache(instance, configureCache(cache));
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
      const mappedCookies = setCookies ? [...cookies, ...serializeCookies(setCookies)] : cookies;
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
