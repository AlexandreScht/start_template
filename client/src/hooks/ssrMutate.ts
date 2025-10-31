'use server';

import { SSR_SERVICE_PREFIX } from '@/hooks/useServerService';
import ServerMemory from '@/lib/serverCache';
import { logger } from '@/utils/logger';
import { revalidateTag } from 'next/cache';

export interface SSRMutateOptions {
  serviceKey?: string;
  tags?: string[];
}

export interface SSRMutateValueOptions<T> extends SSRMutateOptions {
  value: T;
}

/**
 * Mutate la valeur d'une entrée de cache sans l'invalider
 * La nouvelle valeur sera visible immédiatement lors du prochain rendu
 * 
 * @example
 * // Mutate par serviceKey
 * await ssrMutate({
 *   serviceKey: 'user-profile',
 *   value: { name: 'John Updated' },
 * });
 * 
 * @example
 * // Mutate par tags (met à jour toutes les entrées avec ces tags)
 * await ssrMutate({
 *   tags: ['user', 'profile'],
 *   value: { status: 'updated' },
 * });
 */
export async function ssrMutate<T>(options: SSRMutateValueOptions<T>): Promise<{
  success: boolean;
  updated: number;
  error?: string;
}> {
  const { serviceKey, tags, value } = options;
  
  if (!serviceKey && (!tags || tags.length === 0)) {
    return {
      success: false,
      updated: 0,
      error: 'serviceKey ou tags requis',
    };
  }

  try {
    let updatedCount = 0;

    if (serviceKey) {
      const prefixedKey = `${SSR_SERVICE_PREFIX}${serviceKey}`;
      
      // Vérifier si la clé existe dans le cache
      const exists = ServerMemory.has(prefixedKey);
      logger.info(`[ssrMutate] Checking cache key: ${prefixedKey}, exists: ${exists}`);
      
      if (!exists) {
        logger.warn(`[ssrMutate] Key not found in cache: ${prefixedKey}`);
        logger.info(`[ssrMutate] Available keys:`, ServerMemory.getAll.map(([key]) => key));
        return {
          success: false,
          updated: 0,
          error: `Clé de cache introuvable: ${serviceKey}. La page SSR doit être chargée au moins une fois avant de pouvoir muter le cache.`,
        };
      }
      
      const updated = await ServerMemory.update({ serviceKey: prefixedKey }, value);
      
      if (updated) {
        updatedCount = 1;
        logger.info(`[ssrMutate] Cache mutated successfully: ${prefixedKey}`);
      } else {
        logger.warn(`[ssrMutate] Update returned falsy value for: ${prefixedKey}`);
      }
    } else if (tags && tags.length > 0) {
      const prefixedTags = tags.map(tag => `${SSR_SERVICE_PREFIX}${tag}`);
      logger.info(`[ssrMutate] Mutating by tags:`, prefixedTags);
      
      const updated = await ServerMemory.update({ tags: prefixedTags }, value);
      
      if (Array.isArray(updated)) {
        updatedCount = updated.length;
        logger.info(`[ssrMutate] ${updatedCount} cache entries mutated by tags:`, prefixedTags);
      } else {
        logger.warn(`[ssrMutate] No entries found with tags:`, prefixedTags);
        return {
          success: false,
          updated: 0,
          error: `Aucune entrée trouvée avec les tags: ${tags.join(', ')}`,
        };
      }
    }
    return {
      success: updatedCount > 0,
      updated: updatedCount,
    };
  } catch (error) {
    logger.error('[ssrMutate] Erreur:', error);
    return {
      success: false,
      updated: 0,
      error: error instanceof Error ? error.message : 'Erreur lors de la mutation du cache',
    };
  }
}

/**
 * Invalide et supprime les entrées de cache
 * Force Next.js à refetch les données lors de la prochaine requête
 * 
 * @example
 * // Invalider par serviceKey
 * await ssrRevalidate({
 *   serviceKey: 'user-profile',
 * });
 * 
 * @example
 * // Invalider par tags
 * await ssrRevalidate({
 *   tags: ['user', 'posts'],
 * });
 * 
 * @example
 * // Invalider par serviceKey ET tags
 * await ssrRevalidate({
 *   serviceKey: 'user-profile',
 *   tags: ['user'],
 * });
 */
export async function ssrRevalidate(options: SSRMutateOptions): Promise<{
  success: boolean;
  deleted: number;
  error?: string;
}> {
  const { serviceKey, tags } = options;

  if (!serviceKey && (!tags || tags.length === 0)) {
    return {
      success: false,
      deleted: 0,
      error: 'serviceKey ou tags requis',
    };
  }

  try {
    let deletedCount = 0;
    const allTags = new Set<string>();

    // Supprimer par serviceKey
    if (serviceKey) {
      const prefixedKey = `${SSR_SERVICE_PREFIX}${serviceKey}`;
      ServerMemory.remove(prefixedKey);
      deletedCount++;
      allTags.add(`${SSR_SERVICE_PREFIX}${serviceKey}`);
      logger.info(`[ssrRevalidate] Cache deleted: ${prefixedKey}`);
    }

    // Supprimer par tags
    if (tags && tags.length > 0) {
      const prefixedTags = tags.map(tag => `${SSR_SERVICE_PREFIX}${tag}`);
      const removed = ServerMemory.removeByTags(prefixedTags);
      deletedCount += removed;
      prefixedTags.forEach(tag => allTags.add(tag));
      logger.info(`[ssrRevalidate] ${removed} cache entries deleted by tags:`, prefixedTags);
    }

    // Revalider les tags Next.js
    if (allTags.size > 0) {
      for (const tag of allTags) {
        revalidateTag(tag);
        logger.info(`[ssrRevalidate] Next.js tag revalidated: ${tag}`);
      }
    }

    return {
      success: true,
      deleted: deletedCount,
    };
  } catch (error) {
    logger.error('[ssrRevalidate] Erreur:', error);
    return {
      success: false,
      deleted: 0,
      error: error instanceof Error ? error.message : 'Erreur lors de la revalidation du cache',
    };
  }
}

/**
 * Mutate ET revalidate en une seule opération
 * Met à jour la valeur puis force une revalidation Next.js
 * Utile pour forcer un refetch immédiat avec la nouvelle valeur
 * 
 * @example
 * await ssrMutateAndRevalidate({
 *   serviceKey: 'user-profile',
 *   value: { name: 'John Updated' },
 *   tags: ['user'],
 * });
 */
export async function ssrMutateAndRevalidate<T>(
  options: SSRMutateValueOptions<T>,
): Promise<{
  success: boolean;
  updated: number;
  deleted: number;
  error?: string;
}> {
  const { serviceKey, tags, value } = options;

  try {
    // 1. Mutate la valeur
    const mutateResult = await ssrMutate({ serviceKey, tags, value });
    
    if (!mutateResult.success) {
      return {
        success: false,
        updated: 0,
        deleted: 0,
        error: mutateResult.error,
      };
    }

    // 2. Revalidate pour forcer le refetch
    const revalidateResult = await ssrRevalidate({ serviceKey, tags });

    return {
      success: true,
      updated: mutateResult.updated,
      deleted: revalidateResult.deleted,
    };
  } catch (error) {
    logger.error('[ssrMutateAndRevalidate] Erreur:', error);
    return {
      success: false,
      updated: 0,
      deleted: 0,
      error: error instanceof Error ? error.message : 'Erreur lors de la mutation et revalidation',
    };
  }
}
