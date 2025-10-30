import { type NotEmptyStorageValue } from 'axios-cache-interceptor';
import type { CacheHandler, CacheHandlerValue } from 'next/dist/server/lib/incremental-cache';
import ServerMemory from './serverCache';


const NEXTJS_CACHE_PREFIX = '__nextjs__';

export default class NextCacheHandler implements CacheHandler {
  constructor(_options: any) {
    console.log('[NextCacheHandler] Initialized with ServerMemory backend');
  }

  async get(key: string, _ctx?: any): Promise<CacheHandlerValue | null> {
    try {
      const cacheKey = `${NEXTJS_CACHE_PREFIX}${key}`;
      const cached = await ServerMemory.find(cacheKey);

      if (!cached?.data?.data) {
        return null;
      }

      // Next.js attend un format spécifique
      return {
        value: cached.data.data,
        lastModified: cached.createdAt,
      } as CacheHandlerValue;
    } catch (error) {
      console.error('[NextCacheHandler] Error getting cache:', error);
      return null;
    }
  }

  async set(key: string, data: any, ctx?: any): Promise<void> {
    try {
      const cacheKey = `${NEXTJS_CACHE_PREFIX}${key}`;
      const ttl = ctx?.revalidate;
      const tags = ctx?.tags || [];
      
      const cacheValue: NotEmptyStorageValue = {
        state: 'cached',
        ttl: ttl ? ttl * 1000 : -1, // Convertir secondes en millisecondes
        createdAt: Date.now(),
        data: {
          data: { value: data, tags }, // Stocker les tags avec les données
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        } as any,
      };

      await ServerMemory.set(cacheKey, cacheValue);
      console.log(`[NextCacheHandler] Cache set for key: ${key} (TTL: ${ttl || 'infinite'}s, Tags: ${tags.join(', ')})`);
    } catch (error) {
      console.error('[NextCacheHandler] Error setting cache:', error);
    }
  }

  async delete(key: string) {
    try {
      const cacheKey = `${NEXTJS_CACHE_PREFIX}${key}`;
      ServerMemory.remove(cacheKey);
      console.log(`[NextCacheHandler] Cache deleted for key: ${key}`);
    } catch (error) {
      console.error('[NextCacheHandler] Error deleting cache:', error);
    }
  }

  async revalidateTag(tag: string): Promise<void> {
    try {
      // Supprimer toutes les entrées avec ce tag
      const entries = ServerMemory.getAll;
      let deletedCount = 0;

      for (const [key, value] of entries) {
        if (key.startsWith(NEXTJS_CACHE_PREFIX)) {
          // Vérifier si l'entrée a ce tag
          const storedData = value.data?.data as any;
          const tags = storedData?.tags || [];
          if (tags.includes(tag)) {
            ServerMemory.remove(key);
            deletedCount++;
          }
        }
      }

      console.log(`[NextCacheHandler] Revalidated tag '${tag}' - Deleted ${deletedCount} entries`);
    } catch (error) {
      console.error('[NextCacheHandler] Error revalidating tag:', error);
    }
  }

  resetRequestCache() {}
}
