import { logger } from '@/utils/logger';
import { generateCacheKey } from '@/utils/serialize';
import { buildStorage, type CacheInstance } from 'axios-cache-interceptor';
import ServerMemory from './serverCache';

export default function cacheDefaultConfig(cacheKey?: string, tags?: string[]): Partial<CacheInstance> {
  return {
    storage: buildStorage(ServerMemory),
    generateKey: req => {
      if (cacheKey) {
        (req as any).__cacheTags = tags || [];
        return cacheKey;
      }
      return generateCacheKey(req);
    },
    debug: ({ id, msg, data }) => logger.debug(`[AXIOS-CACHE] ${id}: ${msg}`, data),
    headerInterpreter: headers => {
      if (headers && headers['x-cache-option']) {
        try {
          const option = JSON.parse(headers['x-cache-option']) as { 
            cache: number; 
            stale?: number;
          };

          if (option.cache < 1) {
            return 'dont cache';
          }
          return {
            cache: option.cache * 1000,
            ...(option.stale ? { stale: option.stale * 1000 } : {}),
          };
        } catch (error) {
          console.warn('[AXIOS-CACHE] Erreur lors du parsing de x-cache-option:', error);
          return 'not enough headers';
        }
      }
      
      return 'not enough headers';
    },
    
    waiting: new Map(),
  } satisfies Partial<CacheInstance>;
}
