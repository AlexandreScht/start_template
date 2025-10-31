import { ExpiredSessionError, InvalidArgumentError, InvalidRoleAccessError } from '@/exceptions/errors';
import type { AxiosInstanceOptions } from '@/hooks/useServerService';
import configureCache from '@/utils/configureCache';
import { logger } from '@/utils/logger';
import { serializeCookies } from '@/utils/serialize';
import axios, { AxiosResponse, type AxiosInstance as AxiosInstanceType, type RawAxiosRequestHeaders } from 'axios';
import { AxiosCacheInstance, CacheAxiosResponse, setupCache } from 'axios-cache-interceptor';
import { serialize } from 'cookie';

const AxiosRequest = (
  headersOption: RawAxiosRequestHeaders & { withCredentials?: boolean },
  serverRequest: boolean,
) => {
  const { Authorization, 'Content-Type': ContentType, withCredentials, ...headers } = headersOption ?? {};
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_SERVER_API || "http://localhost:3000",
    headers: {
      ...(Authorization ? { Authorization: `Bearer ${Authorization}` } : {}),
      ...(ContentType ? { 'Content-Type': ContentType } : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    withCredentials: withCredentials ?? true,
    ...(withCredentials !== false && !serverRequest
      ? { xsrfCookieName: 'XSRF-TOKEN', xsrfHeaderName: 'X-XSRF-TOKEN' }
      : {}),
    maxRedirects: 3,
    timeout: 30000,
    validateStatus: status => status >= 200 && status < 300,
  });
};

const AxiosInstance = ({ headers, cache, ssr, cacheKey }: AxiosInstanceOptions): AxiosInstanceType | AxiosCacheInstance => {
  const serverRequest = ssr ?? typeof window === 'undefined';
  const { 'Set-Cookies': setCookies, ...otherHeaders } = headers ?? {};
  let instance: AxiosInstanceType | AxiosCacheInstance = AxiosRequest(otherHeaders, serverRequest);

  if (serverRequest && (instance.defaults.method ?? 'GET').toUpperCase() === 'GET') {
    instance = setupCache(instance, configureCache(cacheKey, cache));
  }

  instance.interceptors.request.use(
    async request => {
      if (serverRequest) request.headers['X-Internal-Request'] = '1';

      if (setCookies?.length) {
        request.headers['Cookie'] = serializeCookies(setCookies)
          .map(cookie => {
            const { name, value, ...options } = cookie;
            return serialize(name, value, options);
          })
          .join('; ');
      }
      logger.info(`🚀 Request ${request.method?.toUpperCase()} ${request.url}`);
      return request;
    },
    error => {
      prepareAxiosError(error);
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    async (response: AxiosResponse | CacheAxiosResponse) => {
      if (serverRequest && 'cached' in response) {
        const cacheStatus = response.cached ? '⚡ CACHE HIT' : '🌐 API CALL';
        logger.info(`${cacheStatus} ${response.config.method?.toUpperCase()} ${response.config.url}`);
      }
      return response;
    },
    error => {
      prepareAxiosError(error);
      return Promise.reject(error);
    },
  );

  return instance;
};

function prepareAxiosError(err: any) {
  const {
    status,
    data: { error },
  } = err?.response || { data: {} };

  switch (status) {
    case 605:
      throw new InvalidRoleAccessError(error || 'Access denied');
    case 999:
      if (error === 'Session expired') {
        throw new ExpiredSessionError();
      }
      break;
    case 403:
      throw new InvalidRoleAccessError('Insufficient permissions');
    case 429:
      throw new InvalidArgumentError('Too many requests');
    default:
      if (status && status >= 500) {
        throw new InvalidArgumentError('Server error occurred');
      }
  }
}

export default AxiosInstance;
