import { ExpiredSessionError, InvalidArgumentError, InvalidRoleAccessError } from '@/exceptions/errors';
import type { Services } from '@/interfaces/services';
import configureCache from '@/utils/configureCache';
import { setSignature, verifySignature } from '@/utils/signature';
import axios, { type RawAxiosRequestHeaders, type AxiosError } from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import { serialize } from 'cookie';
import { getRequestCookies, getServerUri, serializeCookies, setRequestCookies } from '../utils/cookies';

// Cache des instances pour éviter les recréations
const instanceCache = new WeakMap();

const AxiosRequest = (headersOption: RawAxiosRequestHeaders & { withCredentials?: boolean }) => {
  const { Authorization, 'Content-Type': ContentType, withCredentials, ...headers } = headersOption ?? {};

  return axios.create({
    headers: {
      ...(Authorization ? { Authorization: `Bearer ${Authorization}` } : {}),
      ...(ContentType ? { 'Content-Type': ContentType } : { 'Content-Type': 'application/json' }),
      'x-TagTest': 'test',
      ...headers,
    },
    withCredentials: withCredentials ?? true,
    // Optimisations de performance
    timeout: 30000, // 30 secondes
    maxRedirects: 3,
    // Sécurité
    validateStatus: status => status >= 200 && status < 300,
  });
};

const AxiosInstance = ({ headers, cache, side, xTag }: Services.Axios.axiosApi): Services.Axios.instance => {
  // Vérifier le cache d'instances
  const cacheKey = { headers, cache, side, xTag };
  if (instanceCache.has(cacheKey)) {
    return instanceCache.get(cacheKey);
  }

  const serverRequest = side === 'server' ? true : side === 'client' ? false : typeof window === 'undefined';
  const { 'Set-Cookies': setCookies, ...otherHeaders } = headers ?? {};
  const instance: Services.Axios.instance = AxiosRequest(otherHeaders);

  if (serverRequest) {
    setupCache(instance, configureCache(cache as Services.Config.serverCache | undefined));
  }

  // Intercepteur de requête optimisé
  instance.interceptors.request.use(
    async request => {
      try {
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

        if (xTag) request.headers['x-Tag'] = xTag;

        // Signature sécurisée
        request.headers['Signature'] = await setSignature();
        request.headers['X-Timestamp'] = Date.now().toString();
        request.baseURL = await getServerUri();

        return request;
      } catch (error) {
        console.error('Request interceptor error:', error);
        throw error;
      }
    },
    error => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    },
  );

  // Intercepteur de réponse avec gestion d'erreurs améliorée
  instance.interceptors.response.use(
    async response => {
      try {
        const cookies = response.headers['set-cookie'];
        const signature = response.headers['signature'];
        const resSignature = response.headers['x-signature'];

        // Vérification de signature renforcée
        if (signature && resSignature) {
          const checkSignature = await verifySignature(signature, resSignature);
          if (!checkSignature) {
            throw new InvalidArgumentError('Invalid signature');
          }
        }

        if (cookies?.length && serverRequest) {
          await getRequestCookies(cookies);
        }

        return response;
      } catch (error) {
        console.error('Response interceptor error:', error);
        throw error;
      }
    },
    (error: AxiosError) => {
      prepareAxiosError(error);
      return Promise.reject(error);
    },
  );

  instance.revalidate = false;

  // Mettre en cache l'instance
  instanceCache.set(cacheKey, instance);

  return instance;
};

function prepareAxiosError(err: AxiosError) {
  const status = err?.response?.status;
  const error = (err?.response?.data as any)?.error;

  // Gestion d'erreurs plus robuste
  switch (status) {
    case 605:
      throw new InvalidRoleAccessError(error || 'Access denied');
    case 999:
      if (error === 'Session expired') {
        throw new ExpiredSessionError();
      }
      break;
    case 401:
      throw new ExpiredSessionError();
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
