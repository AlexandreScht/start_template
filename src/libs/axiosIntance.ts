import cacheConfig from '@/config/cache';
import { ExpiredSessionError, InvalidRoleAccessError } from '@/exceptions/errors';
import { Services } from '@/interfaces/services';
import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import { serialize } from 'cookie';
import { getRequestCookies, getServerUri, setRequestCookies } from '../utils/cookies';

const AxiosRequest = ({ token }: { token?: string } = {}) => {
  return axios.create({
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
};

const AxiosInstance = ({ token, cache }: { token?: string; cache?: Services.cacheServerOptions }) => {
  const serverRequest = typeof window === 'undefined';
  const instance = AxiosRequest({ token });
  if (serverRequest) setupCache(instance, cacheConfig(cache?.key as string));
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
      const formattedCookies = cookies
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
