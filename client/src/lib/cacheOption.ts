import { generateCacheKey } from '@/utils/serialize';
import { buildStorage, type CacheInstance } from 'axios-cache-interceptor';
import ServerMemory from './serverCache';
import { logger } from '@/utils/logger';

/**
 * Configuration par défaut du cache axios-cache-interceptor pour le SSR
 * 
 * Fonctionnalités :
 * - Stockage en mémoire serveur avec LRU
 * - Génération de clés de cache basée sur l'URL et les paramètres
 * - Interprétation des headers de cache personnalisés
 * - Logging en mode développement
 */
export default function cacheDefaultConfig(): Partial<CacheInstance> {
  return {
    storage: buildStorage(ServerMemory),
    generateKey: req => generateCacheKey(req),
    debug: ({ id, msg, data }) => logger.debug(`[AXIOS-CACHE] ${id}: ${msg}`, data),
    headerInterpreter: headers => {
      // Header personnalisé: X-Cache-Option
      // Format: { "cache": <durée en secondes>, "stale": <durée stale optionnelle> }
      if (headers && headers['x-cache-option']) {
        try {
          const option = JSON.parse(headers['x-cache-option']) as { 
            cache: number; 
            stale?: number;
          };

          // Si cache < 1, ne pas mettre en cache
          if (option.cache < 1) {
            return 'dont cache';
          }

          // Retourner les options de cache
          return {
            cache: option.cache * 1000, // Convertir en millisecondes
            ...(option.stale ? { stale: option.stale * 1000 } : {}),
          };
        } catch (error) {
          console.warn('[AXIOS-CACHE] Erreur lors du parsing de x-cache-option:', error);
          return 'not enough headers';
        }
      }
      
      // Pas de header de cache personnalisé, utiliser la config par défaut
      return 'not enough headers';
    },
    
    // Map pour gérer les requêtes en attente (évite les doublons)
    waiting: new Map(),
  } satisfies Partial<CacheInstance>;
}
