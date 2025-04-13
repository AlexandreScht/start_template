import { ExpiredSessionError, InvalidArgumentError, InvalidRoleAccessError } from '@/exceptions/errors';
import { type Services } from '@/interfaces/services';
import configureCache from '@/utils/configureCache';
import { setSignature, verifySignature } from '@/utils/signature';
import axios, { type RawAxiosRequestHeaders } from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import { serialize } from 'cookie';
import { getRequestCookies, getServerUri, serializeCookies, setRequestCookies } from '../utils/cookies';

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

const AxiosInstance = ({ headers, cache, side, xTag }: Services.Axios.axiosApi): Services.Axios.instance => {
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

    if (xTag) request.headers['x-Tag'] = xTag;

    request.headers['Signature'] = await setSignature();
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

  instance.revalidate = false;
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
