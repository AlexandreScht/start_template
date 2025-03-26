import { type CacheRequestConfig } from 'axios-cache-interceptor';

export function generateCacheKey(request: CacheRequestConfig<unknown, unknown>) {
  const { method = 'req', url, params, data } = request;
  let key = `${method.toUpperCase()}:${url}_`;
  if (params) {
    key += JSON.stringify(params);
  }
  if (data) {
    key += JSON.stringify(data);
  }
  return key;
}
