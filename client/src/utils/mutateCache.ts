'use server'

import ServerMemory from '@/lib/serverCache';
import { revalidateTag } from 'next/cache';
import { logger } from './logger';

export interface MutateCacheOptions {
  serviceKey: string;
  tags?: string[];
}

export interface SetCacheValueOptions<T> extends MutateCacheOptions {
  value: T;
}

/**
 * Muter le cache et revalider
 * 
 * @example
 * await mutateCache({
 *   serviceKey: 'user-profile',
 *   value: { name: 'John' },
 *   tags: ['user'],
 * });
 */
export async function mutateCache<T>(options: SetCacheValueOptions<T>): Promise<void> {
  const { serviceKey, value, tags } = options;

  try {
    // Stocker dans le custom cache
    const customKey = `${serviceKey}-value`;
    ServerMemory.update(customKey, value);
    logger.info(`[mutateCache] Custom cache set: ${customKey}`, value);
    const allTags = new Set([...(serviceKey ? [serviceKey] : []), ...(tags || [])]);
    // Revalidation
    if (allTags.size > 0) {
      for (const tag of allTags) {
        revalidateTag(tag);
        logger.info(`[mutateCache] Tag revalidated: ${tag}`);
      }
    }
  } catch (error) {
    logger.error('[mutateCache] Erreur:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Erreur lors de la mutation du cache'
    );
  }
}

/**
 * Revalider le cache
 * 
 * @example
 * // Invalider et revalider
 * await revalidateCache({
 *   serviceKey: 'user-profile',
 *   tags: ['user'],
 * });
 * 
 * @example
 * // Revalider uniquement (sans invalider)
 * await revalidateCache({
 *   tags: ['user', 'posts'],
 * });
 */
export async function revalidateCache(options: MutateCacheOptions): Promise<void> {
  const { serviceKey, tags } = options;

  try {
    // Suppression du custom cache si serviceKey est fourni
    if (serviceKey) {
      const customKey = `${serviceKey}-value`;
      ServerMemory.remove(customKey);
      logger.info(`[revalidateCache] Custom cache deleted: ${customKey}`);
    }

    // Revalidation par tags
    const allTags = new Set([...(serviceKey ? [serviceKey] : []), ...(tags || [])]);
    if (allTags.size > 0) {
      for (const tag of allTags) {
        revalidateTag(tag);
        logger.info(`[revalidateCache] Tag revalidated: ${tag}`);
      }
    }
  } catch (error) {
    logger.error('[revalidateCache] Erreur:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Erreur lors de la revalidation du cache'
    );
  }
}