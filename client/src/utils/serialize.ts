import cacheConfig from '@/config/cache';
import { type Services } from '@/interfaces/services';
import { type CacheRequestConfig } from 'axios-cache-interceptor';

export function generateCacheKey(request: CacheRequestConfig<unknown, unknown>) {
  const { method = 'req', url, data } = request;
  let key = `${method.toUpperCase()}:${url}`;
  if (data) {
    key += JSON.stringify(data);
  }
  return key;
}
export async function setLifeTime(
  request: CacheRequestConfig,
  timeLife: Services.Config.serverCache['lifeTime'],
  node: boolean = false,
): Promise<number> {
  const isNodeCache = node ? 1 : 1000;
  if (typeof timeLife === 'number') {
    return timeLife * isNodeCache;
  }
  if (!timeLife) {
    return cacheConfig.DEFAULT_TIME_LIFE * isNodeCache;
  }
  const result = timeLife(request);
  return result instanceof Promise ? (await result) * isNodeCache : result * isNodeCache;
}
