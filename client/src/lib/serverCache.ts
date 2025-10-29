/**
 * Cache en mémoire côté serveur pour simuler une base de données
 * Dans un vrai projet, cela serait remplacé par une vraie DB ou Redis
 */

// Map pour stocker les valeurs en cache
const serverMemoryCache = new Map<string, any>();

/**
 * Récupérer une valeur du cache serveur
 */
export function getServerCacheValue(key: string): any | undefined {
  return serverMemoryCache.get(key);
}

/**
 * Définir une valeur dans le cache serveur
 */
export function setServerCacheValue(key: string, value: any): void {
  serverMemoryCache.set(key, value);
  console.log(`[SERVER CACHE] Set ${key}:`, value);
}

/**
 * Supprimer une valeur du cache serveur
 */
export function deleteServerCacheValue(key: string): void {
  serverMemoryCache.delete(key);
  console.log(`[SERVER CACHE] Deleted ${key}`);
}

/**
 * Vérifier si une clé existe dans le cache
 */
export function hasServerCacheValue(key: string): boolean {
  return serverMemoryCache.has(key);
}

/**
 * Obtenir toutes les clés du cache
 */
export function getAllServerCacheKeys(): string[] {
  return Array.from(serverMemoryCache.keys());
}

/**
 * Vider tout le cache
 */
export function clearServerCache(): void {
  serverMemoryCache.clear();
  console.log('[SERVER CACHE] Cache cleared');
}
