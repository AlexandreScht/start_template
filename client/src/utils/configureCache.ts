import cacheConfig from '@/config/cache';
import { type Services } from '@/interfaces/services';
import cacheDefaultConfig from '@/libs/cacheOption';
import { type CacheOptions, type CacheRequestConfig } from 'axios-cache-interceptor';
import { setLifeTime } from './serialize';

/**
 * Configure le cache axios-cache-interceptor pour le SSR
 * 
 * Combine :
 * - Configuration par défaut (storage, generateKey, debug, etc.)
 * - Options personnalisées passées en paramètre
 * - Configuration globale du cache (durées de vie)
 * 
 * @param cacheOptions - Options de cache personnalisées
 * @returns Configuration complète du cache ou objet vide si côté client
 */
export default function configureCache(cacheOptions?: Services.Config.serverCache | undefined): CacheOptions | {} {
  // Côté client : pas de cache axios (React Query gère le cache)
  if (typeof window !== 'undefined') {
    return {};
  }

  // Extraction des options personnalisées
  const { 
    serverConfig, 
    lifeTime: customTTL, 
    persist, 
    enabled: cachePredicate, 
    ...otherOptions 
  } = cacheOptions || {};

  // Durées de vie du cache
  const { PERSIST_TIME_LIFE, DEFAULT_TIME_LIFE } = cacheConfig;
  const cacheLifeTime = persist ? PERSIST_TIME_LIFE : (customTTL ?? DEFAULT_TIME_LIFE);

  // Configuration complète du cache
  return {
    // Configuration par défaut (storage, generateKey, debug, headerInterpreter, waiting)
    ...cacheDefaultConfig(),
    
    // Interprétation des headers du serveur
    // Si serverConfig est une fonction, l'utiliser directement
    // Sinon, utiliser interpretHeader avec la valeur fournie (ou true par défaut)
    ...(typeof serverConfig === 'function' 
      ? { serverConfig } 
      : { interpretHeader: serverConfig ?? true }
    ),
    
    // TTL (Time To Live) du cache
    // Fonction qui détermine la durée de vie en fonction de la requête
    ttl: (req: CacheRequestConfig) => setLifeTime(req, cacheLifeTime),
    
    // Prédicat de cache : détermine si une requête doit être mise en cache
    ...(typeof cachePredicate === 'function' ? { cachePredicate } : {}),
    
    // Autres options personnalisées
    ...otherOptions,
  } satisfies CacheOptions;
}
