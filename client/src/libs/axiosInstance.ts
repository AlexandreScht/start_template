import { ExpiredSessionError, InvalidArgumentError, InvalidRoleAccessError } from '@/exceptions/errors';
import { type Services } from '@/interfaces/services';
import configureCache from '@/utils/configureCache';
import { serializeCookies } from '@/utils/serialize';
import axios, { type RawAxiosRequestHeaders } from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import { serialize } from 'cookie';

const AxiosRequest = (
  headersOption: RawAxiosRequestHeaders & { withCredentials?: boolean },
  serverRequest: boolean,
) => {
  const { Authorization, 'Content-Type': ContentType, withCredentials, ...headers } = headersOption ?? {};
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_SERVER_API,
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

const AxiosInstance = ({ headers, cache, ssr, xTag }: Services.Axios.axiosApi): Services.Axios.instance => {
  const serverRequest = ssr ?? typeof window === 'undefined';
  const { 'Set-Cookies': setCookies, ...otherHeaders } = headers ?? {};
  const instance: Services.Axios.instance = AxiosRequest(otherHeaders, serverRequest);

  // Configuration du cache
  if (serverRequest) {
    // Côté serveur UNIQUEMENT : cache avec axios-cache-interceptor + LRU
    // Utilisé pour : Réduire les appels répétés à l'API backend lors du SSR
    // Note: Côté client, React Query gère le cache (pas besoin de setupCache)
    setupCache(instance as any, configureCache(cache as Services.Config.serverCache | undefined));
  }
  // Côté client : PAS de cache axios car React Query le gère déjà via useQuery

  instance.interceptors.request.use(
    async request => {
      // Marquer les requêtes serveur pour le backend
      if (serverRequest) request.headers['X-Internal-Request'] = '1';

      if (setCookies?.length) {
        request.headers['Cookie'] = serializeCookies(setCookies)
          .map(cookie => {
            const { name, value, ...options } = cookie;
            return serialize(name, value, options);
          })
          .join('; ');
      }

      if (xTag) request.headers['X-Tag'] = xTag;
      return request;
    },
    error => {
      prepareAxiosError(error);
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    async response => {
      // Log pour debug en dev (optionnel)
      if (process.env.NODE_ENV === 'development' && serverRequest) {
        const cacheStatus = (response as any).cached ? '⚡ CACHE HIT' : '🌐 API CALL';
        console.log(`${cacheStatus} ${response.config.method?.toUpperCase()} ${response.config.url}`);
      }
      return response;
    },
    error => {
      prepareAxiosError(error);
      return Promise.reject(error);
    },
  );

  instance.revalidate = false;
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
