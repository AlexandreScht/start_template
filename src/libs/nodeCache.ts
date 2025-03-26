import cacheConfig from '@/config/cache';
import NodeCache from 'node-cache';

class CacheSingleton {
  private static instance: NodeCache;
  private constructor() {}

  public static getInstance(): NodeCache {
    if (!CacheSingleton.instance) {
      CacheSingleton.instance = new NodeCache({ stdTTL: cacheConfig.DEFAULT_TIME_LIFE, checkperiod: cacheConfig.CHECK_PERIOD, deleteOnExpire: true });
    }
    return CacheSingleton.instance;
  }
}

export default CacheSingleton;
