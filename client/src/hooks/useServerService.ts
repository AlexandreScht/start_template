import { ClientException } from '@/exceptions/errors';
import AxiosInstance from '@/lib/axiosInstance';
import type { ConfigureCacheOptions } from '@/utils/configureCache';
import type { RawAxiosRequestHeaders } from 'axios';
import type { AxiosCacheInstance } from 'axios-cache-interceptor';

export const SSR_SERVICE_PREFIX = '__ssr_service__';

export type AxiosInstanceOptions = {
  headers?: RawAxiosRequestHeaders & {
    'Set-Cookies'?: Array<{ name: string; value: string; [key: string]: any }>;
  };
  cache?: ConfigureCacheOptions;
  ssr?: boolean;
  cacheKey: string;
};

// ===== Types pour useServerService =====
export type BrandedServiceSelector<R = any> = {
  __brand: 'ServiceSelector';
  fn: (axios: AxiosCacheInstance | import('axios').AxiosInstance) => Promise<R>;
};

export type ExtractReturnType<T> = T extends BrandedServiceSelector<infer R> ? R : never;

export type UseServerServiceOptions = Omit<AxiosInstanceOptions, 'ssr' | 'cacheKey'> & {
  /**
   * Durée de revalidation du cache Next.js en secondes
   * @default ssrCacheConfig.DEFAULT_TTL (3 minutes)
   */
  revalidate?: number | false;
  /**
   * Tags de cache Next.js pour la revalidation
   * Si non fourni, utilise serviceKey comme tag
   */
  tags?: string[];
};

export type UseServerServiceParams<TData = any> = {
  /**
   * Clé unique pour identifier le service et le cache
   * Utilisée comme tag de cache Next.js si tags n'est pas fourni
   */
  serviceKey: string;
  fetcher?: BrandedServiceSelector<TData>;
  options?: UseServerServiceOptions;
};

export type UseServerServiceResult<TData> = {
  data?: TData;
  error?: Error;
  success: boolean;
};

export async function useServerService<TFetcher extends BrandedServiceSelector>(params: {
  serviceKey: string;
  fetcher: TFetcher;
  options?: UseServerServiceOptions;
}): Promise<UseServerServiceResult<ExtractReturnType<TFetcher>>>;

export async function useServerService<TData = unknown>(params: {
  serviceKey: string;
  fetcher: BrandedServiceSelector<TData>;
  options?: UseServerServiceOptions;
}): Promise<UseServerServiceResult<TData>>;

export async function useServerService<TData = any>(
  params: UseServerServiceParams<TData>,
): Promise<UseServerServiceResult<TData>> {
  const { serviceKey, fetcher, options = {} } = params;

  if (!fetcher) {
    throw new ClientException('useServerService: Le fetcher est obligatoire');
  }

  if (!serviceKey) {
    throw new ClientException('useServerService: serviceKey est obligatoire pour le cache Next.js');
  }

  try {
    // Préparer les tags avec préfixe
    const tags = options?.tags || [];
    const prefixedTags = tags.map(tag => `${SSR_SERVICE_PREFIX}${tag}`);

    // Créer l'instance Axios avec cache intégré (axios-cache-interceptor)
    const axiosInstance = AxiosInstance({
      ssr: true,
      headers: options?.headers,
      cache: {
        ...options?.cache,
        // Injecter les tags dans les métadonnées de cache
        tags: prefixedTags,
      } as any,
      cacheKey: `${SSR_SERVICE_PREFIX}${serviceKey}`,
    });

    // Exécuter la requête (axios-cache-interceptor gère le cache automatiquement)
    const data = await fetcher.fn(axiosInstance);

    return {
      data,
      success: true,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
      success: false,
    };
  }
}
