import { ExpiredSessionError, InvalidArgumentError, InvalidRoleAccessError } from '@/exceptions/errors';
import { type Services } from '@/interfaces/services';
import configureCache from '@/utils/configureCache';
import { generateSecretValues } from '@/utils/signature';
import axios, { type RawAxiosRequestHeaders } from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import { serialize } from 'cookie';
import { getRequestCookies, serializeCookies, setRequestCookies } from '../utils/cookies';

const AxiosRequest = (headersOption: RawAxiosRequestHeaders & { withCredentials?: boolean }) => {
  const { Authorization, 'Content-Type': ContentType, withCredentials, ...headers } = headersOption ?? {};
  return axios.create({
    headers: {
      ...(Authorization ? { Authorization: `Bearer ${Authorization}` } : {}),
      ...(ContentType ? { 'Content-Type': ContentType } : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    withCredentials: withCredentials ?? true,
    maxRedirects: 3,
    timeout: 30000,
    validateStatus: status => status >= 200 && status < 300,
  });
};

const AxiosInstance = ({ headers, cache, side, xTag }: Services.Axios.axiosApi): Services.Axios.instance => {
  const serverRequest = side === 'server' ? true : side === 'client' ? false : typeof window === 'undefined';
  const { 'Set-Cookies': setCookies, ...otherHeaders } = headers ?? {};
  const instance: Services.Axios.instance = AxiosRequest(otherHeaders);

  if (serverRequest) {
    setupCache(instance as any, configureCache(cache as Services.Config.serverCache | undefined));
  }

  instance.interceptors.request.use(
    async request => {
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

      // const { encryptedValue, encryptedAesKey, value, nonce } = await generateSecretValues();

      // request.headers['X-Sign-Value'] = value;
      // request.headers['X-Sign-Value-Cipher'] = encryptedValue;
      // request.headers['X-Sign-Key-Cipher'] = encryptedAesKey;
      // request.headers['X-Sign-Nonce'] = nonce;

      request.baseURL = process.env.NEXT_PUBLIC_SERVER_API;

      return request;
    },
    error => {
      prepareAxiosError(error);
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    async response => {
      const cookies = response.headers['set-cookie'];
      if (cookies?.length && serverRequest) {
        await getRequestCookies(cookies);
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
