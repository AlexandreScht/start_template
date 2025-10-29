import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import { revalidateTag } from 'next/cache';
import AxiosInstance from '../libs/axiosInstance';

/**
 * Fonction pour revalider le cache d'un service côté serveur
 * Utilise Next.js revalidateTag pour invalider le cache
 * 
 * @param cacheKey - La clé de cache à revalider (doit correspondre à celle utilisée dans useServerService)
 * @returns Promise<void>
 */
export async function revalidateServerCache(cacheKey: string): Promise<void> {
  try {
    revalidateTag(cacheKey);
  } catch (error) {
    console.error(`[REVALIDATE] Erreur lors de la revalidation de ${cacheKey}:`, error);
    throw error;
  }
}

/**
 * Fonction pour revalider plusieurs clés de cache en une fois
 * 
 * @param cacheKeys - Tableau de clés de cache à revalider
 * @returns Promise<void>
 */
export async function revalidateMultipleCaches(cacheKeys: string[]): Promise<void> {
  try {
    await Promise.all(cacheKeys.map(key => revalidateTag(key)));
  } catch (error) {
    console.error('[REVALIDATE] Erreur lors de la revalidation multiple:', error);
    throw error;
  }
}

/**
 * Fonction pour effectuer une mutation et revalider le cache automatiquement
 * Utile pour les actions serveur qui modifient des données
 * 
 * @param selector - Le service à appeler
 * @param cacheKeysToRevalidate - Les clés de cache à revalider après la mutation
 * @param options - Options pour la requête
 * @returns Promise avec les données ou l'erreur
 */
export async function mutateAndRevalidate<R = any>(
  selector: Services.serverService.ServerServiceSelector<R>,
  cacheKeysToRevalidate: string[],
  options?: Services.Config.ServerServiceOption,
): Promise<Services.serverService.response<R>> {
  try {
    const axios = AxiosInstance({ ...options, ssr: true });
    const data = await selector(PrepareServices)(axios);
    
    // Revalider les caches après la mutation
    await revalidateMultipleCaches(cacheKeysToRevalidate);
    
    return { data };
  } catch (error) {
    return { error: servicesErrors(error) };
  }
}