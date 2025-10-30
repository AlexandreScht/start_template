import { type CacheRequestConfig, type NotEmptyStorageValue } from 'axios-cache-interceptor';
import QuickLRU from 'quick-lru';

class ServerMemoryClass {
  private static instance: ServerMemoryClass;
  private readonly lru: QuickLRU<string, NotEmptyStorageValue>;
  private allowedHeaders: Set<string> = new Set([
    'content-type',
    'content-length',
    'access-control-allow-credentials',
  ]);

  private constructor() {
    this.lru = new QuickLRU({ maxSize: 1000 });
  }

  public static getInstance(): ServerMemoryClass {
    if (!ServerMemoryClass.instance) {
      ServerMemoryClass.instance = new ServerMemoryClass();
    }
    return ServerMemoryClass.instance;
  }

  /**
   * Configure les headers autorisés à être conservés dans le cache
   */
  public setAllowedHeaders(headers: string[]): void {
    this.allowedHeaders = new Set(headers.map(h => h.toLowerCase()));
  }

  /**
   * Ajoute des headers supplémentaires à la liste des headers autorisés
   */
  public addAllowedHeaders(headers: string[]): void {
    headers.forEach(h => this.allowedHeaders.add(h.toLowerCase()));
  }

  public set = async (key: string, value: NotEmptyStorageValue) => {
    if (
      ((value?.data?.data && value.state === 'cached') || value.state === 'loading')
    ) {
      const originalHeaders = value?.data?.headers ?? {};
      const filteredHeaders = Object.entries(originalHeaders).reduce<Record<string, string>>(
        (acc, [headerName, headerValue]) => {
          if (this.allowedHeaders.has(headerName.toLowerCase())) {
            acc[headerName] = headerValue as any;
          }
          return acc;
        },
        {},
      );
      this.lru.set(key, {
        ...value,
        data: {
          ...(value?.data as any),
          headers: filteredHeaders,
        },
      });
    }
  };

  public find = async (key: string) => {
    const value = this.lru.get(key);
    
    // Vérifier si la valeur existe et si elle n'est pas expirée
    if (value && value.ttl !== undefined && value.ttl !== -1 && value.createdAt !== undefined) {
      const now = Date.now();
      const isExpired = now > value.createdAt + value.ttl;
      
      if (isExpired) {
        // Supprimer l'entrée expirée
        this.lru.delete(key);
        return undefined;
      }
    }
    
    return value;
  };

  get getAll() {
    return Array.from(this.lru.entries());
  }

  public remove = (key: string) => {
    this.lru.delete(key);
  };

  public has = (key: string) => {
    return this.lru.has(key);
  };

  public clear = () => {
    this.lru.clear();
  };

  /**
   * Met à jour la valeur d'une clé existante en préservant les options originales
   * Le TTL est préservé mais le createdAt est réinitialisé au moment du mutate
   */
  public update = async <T>(key: string, newData: T) => {
    const existingValue = await this.find(key);
    
    if (!existingValue) {
      return undefined;
    }

    // Créer une nouvelle valeur avec les mêmes options mais des données mises à jour
    const updatedValue = {
      ...existingValue,
      createdAt: Date.now(), // Réinitialiser le moment de création
      data: {
        ...(existingValue.data as any),
        data: newData,
      },
    } as NotEmptyStorageValue;

    this.lru.set(key, updatedValue);
    return updatedValue;
  };
}

const ServerMemory = ServerMemoryClass.getInstance();
export default ServerMemory;

/**
 * Cache séparé pour les valeurs mutées par l'utilisateur
 * Utilise le même LRU mais avec un préfixe pour éviter les collisions
 */
const CUSTOM_CACHE_PREFIX = '__custom_cache__';

/**
 * Récupérer une valeur personnalisée du cache
 */
export function getCustomCacheValue(key: string): any | undefined {
  const cacheKey = `${CUSTOM_CACHE_PREFIX}${key}`;
  const cached = ServerMemory.getAll.find(([k]) => k === cacheKey);
  return cached ? cached[1]?.data?.data : undefined;
}

/**
 * Supprimer une valeur personnalisée du cache
 */
export function deleteCustomCacheValue(key: string): void {
  const cacheKey = `${CUSTOM_CACHE_PREFIX}${key}`;
  ServerMemory.remove(cacheKey);
  console.log(`[CUSTOM CACHE] Deleted ${key}`);
}

/**
 * Vérifier si une valeur personnalisée existe dans le cache
 */
export function hasCustomCacheValue(key: string): boolean {
  const cacheKey = `${CUSTOM_CACHE_PREFIX}${key}`;
  return ServerMemory.getAll.some(([k]) => k === cacheKey);
}

/**
 * Mettre à jour une valeur personnalisée dans le cache
 * Préserve le TTL original mais réinitialise le createdAt
 */
export async function updateCustomCacheValue(key: string, value: any): Promise<boolean> {
  const cacheKey = `${CUSTOM_CACHE_PREFIX}${key}`;
  const updated = await ServerMemory.update(cacheKey, value);
  
  if (updated) {
    console.log(`[CUSTOM CACHE] Updated ${key}:`, value);
    return true;
  }
  
  console.warn(`[CUSTOM CACHE] Failed to update ${key}: entry not found`);
  return false;
}