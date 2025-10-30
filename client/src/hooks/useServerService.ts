import { ClientException } from '@/exceptions/errors';
import type { Services } from '@/interfaces/services';
import AxiosInstance from '@/lib/axiosInstance';
import { getCustomCacheValue, hasCustomCacheValue } from '@/lib/serverCache';
import { unstable_cache } from 'next/cache';

type BrandedServiceSelector<R = any> = {
  __brand: 'ServiceSelector';
  fn: (axios: Services.Axios.instance) => Promise<R>;
};

type ExtractReturnType<T> = T extends BrandedServiceSelector<infer R> ? R : never;

type UseServerServiceOptions = Services.Config.ServerServiceOption & {
  /**
   * Durée de revalidation du cache Next.js en secondes
   * @default 180 (3 minutes)
   */
  revalidate?: number | false;
  /**
   * Tags de cache Next.js pour la revalidation
   * Si non fourni, utilise serviceKey comme tag
   */
  tags?: string[];
};

type UseServerServiceParams<TData = any> = {
  /**
   * Clé unique pour identifier le service et le cache
   * Utilisée comme tag de cache Next.js si tags n'est pas fourni
   */
  serviceKey: string;
  fetcher?: BrandedServiceSelector<TData>;
  options?: UseServerServiceOptions;
};

type UseServerServiceResult<TData> = {
  data?: TData;
  error?: Error;
  success: boolean;
};

// Surcharge 1 : Avec fetcher (type inféré depuis le fetcher)
export async function useServerService<TFetcher extends BrandedServiceSelector>(params: {
  serviceKey: string;
  fetcher: TFetcher;
  options?: UseServerServiceOptions;
}): Promise<UseServerServiceResult<ExtractReturnType<TFetcher>>>;

// Surcharge 2 : Avec fetcher ET type générique explicite (override du type inféré)
export async function useServerService<TData = unknown>(params: {
  serviceKey: string;
  fetcher: BrandedServiceSelector<TData>;
  options?: UseServerServiceOptions;
}): Promise<UseServerServiceResult<TData>>;

// Implémentation
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
    const customCacheKey = `${serviceKey}-value`;
    
    if (hasCustomCacheValue(customCacheKey)) {
      const cachedData = getCustomCacheValue(customCacheKey);
      
      return {
        data: cachedData as TData,
        success: true,
      };
    }

    const { revalidate = 180, tags, ...axiosOptions } = options;
    const cacheTags = tags || [serviceKey];

    const cachedFn = unstable_cache(
      async () => {
        const axiosInstance = AxiosInstance({
          ssr: true,
          headers: axiosOptions?.headers,
          cache: axiosOptions?.cache,
          cacheKey: serviceKey,
        });

        // Exécuter la requête
        return await fetcher.fn(axiosInstance);
      },
      [serviceKey],
      {
        revalidate: revalidate === false ? false : revalidate,
        tags: cacheTags,
      },
    );

    const data = await cachedFn();

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
