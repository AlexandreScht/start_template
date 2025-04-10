import { default as cacheConfig } from '@/config/cache';
import { ExpiredSessionError, InvalidArgumentError, InvalidRoleAccessError } from '@/exceptions/errors';
import { type Services } from '@/interfaces/services';
import { setLifeTime } from '@/utils/serialize';
import axios, { type RawAxiosRequestHeaders } from 'axios';
import { type CacheOptions, type CacheRequestConfig, setupCache } from 'axios-cache-interceptor';
import { serialize } from 'cookie';
import { v4 as uuid } from 'uuid';
import { getRequestCookies, getServerUri, serializeCookies, setRequestCookies, verifySignature } from '../utils/cookies';
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

const AxiosInstance = ({ headers, cache, side, revalidate }: Services.Axios.axiosApi): Services.Axios.instance => {
  const serverRequest = side === 'server' ? true : side === 'client' ? false : typeof window === 'undefined';
  const { 'Set-Cookies': setCookies, ...otherHeaders } = headers ?? {};
  const instance: Services.Axios.instance = AxiosRequest(otherHeaders);
  if (serverRequest) {
    setupCache(instance, configureCache(cache as Services.Config.serverCache | undefined));
  }

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

    request.headers['Signature'] = uuid();
    request.baseURL = await getServerUri();

    return request;
  });

  instance.interceptors.response.use(
    async response => {
      const cookies = response.headers['set-cookie'];
      const signature = response.headers['signature'];
      const resSignature = response.headers['x-signature'];

      const checkSignature = await verifySignature(signature, resSignature);
      if (!checkSignature) throw new InvalidArgumentError('Invalid signature');

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

  instance.revalidate = revalidate;
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
