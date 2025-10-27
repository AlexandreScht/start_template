import type { Services } from '@/interfaces/services';
import AxiosInstance from '@/libs/axiosInstance';
import PrepareServices from '@/services';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { CacheRequestConfig } from 'axios-cache-interceptor';
import { cache, useMemo } from 'react';

// Type pour le ServiceSelector (fonction qui retourne une fonction)
type ServiceSelector<R = any> = (services: typeof PrepareServices) => (axios: Services.Axios.instance) => Promise<R>;

// Extraire le type de retour d'un ServiceSelector
type ExtractReturnType<T> = T extends ServiceSelector<infer R> ? R : unknown;

// Options combinées React Query + axios-cache avec initialState
type UseServiceOptions<TData = unknown> = Omit<
  UseQueryOptions<TData, Error, TData, [string]>,
  'queryKey' | 'queryFn'
> & {
  initialState?: TData;
  cache?: Partial<CacheRequestConfig>;
};

// Paramètres d'entrée de useService
type UseServiceParams<TFetcher extends ServiceSelector = ServiceSelector> = {
  serviceKey?: string;
  fetcher?: TFetcher;
  options?: UseServiceOptions<ExtractReturnType<TFetcher>>;
};

// Détecte si on est côté serveur (SSR) ou client
function isServer() {
  return typeof window === 'undefined';
}

// Extraire le nom de la fonction/clé depuis un ServiceSelector
function extractKeyFromFetcher(fetcher: ServiceSelector): string {
  // Essayer d'extraire le nom en exécutant le fetcher avec un proxy
  try {
    let capturedKey = 'unknown';
    const proxyServices = new Proxy(PrepareServices, {
      get(target, prop) {
        capturedKey = String(prop);
        return target[prop as keyof typeof PrepareServices];
      }
    });
    fetcher(proxyServices);
    return capturedKey;
  } catch {
    return 'unknown';
  }
}

// Version serveur : fetch avec React.cache() pour déduplication
const fetchServerService = cache(async <TData = any>(
  fetcher: ServiceSelector<TData>,
  cacheOptions?: Partial<CacheRequestConfig>
): Promise<TData> => {
  const axiosInstance = AxiosInstance({ 
    side: 'server',
    cache: cacheOptions as any
  });
  const serviceFn = fetcher(PrepareServices);
  return await serviceFn(axiosInstance);
});

// Hook unifié qui s'adapte à l'environnement
// Overload pour le client (retourne useQuery)
export function useService<TFetcher extends ServiceSelector = ServiceSelector>(
  params: UseServiceParams<TFetcher>
): ReturnType<typeof useQuery<ExtractReturnType<TFetcher>, Error, ExtractReturnType<TFetcher>, [string]>>;

// Overload pour le serveur (retourne Promise)
export function useService<TFetcher extends ServiceSelector = ServiceSelector>(
  params: UseServiceParams<TFetcher> & { fetcher: TFetcher }
): Promise<ExtractReturnType<TFetcher>>;

// Implémentation
export function useService<TFetcher extends ServiceSelector = ServiceSelector>(
  params: UseServiceParams<TFetcher>
): any {
  const { serviceKey, fetcher, options = {} } = params;

  // Validation : au moins serviceKey ou fetcher doit être défini
  if (!serviceKey && !fetcher) {
    throw new Error('useService: Au moins serviceKey ou fetcher doit être défini');
  }

  // Déterminer la clé de cache
  const cacheKey = serviceKey || (fetcher ? extractKeyFromFetcher(fetcher) : 'unknown');

  // Côté serveur : utiliser React cache et retourner directement la Promise
  if (isServer()) {
    // Si seul serviceKey est défini, erreur côté serveur (pas de cache à lire)
    if (!fetcher) {
      throw new Error(
        `useService: Impossible de lire le cache avec serviceKey "${serviceKey}" côté serveur. ` +
        'Vous devez fournir un fetcher côté serveur.'
      );
    }

    return fetchServerService(fetcher, options.cache) as any;
  }

  // Côté client : utiliser useQuery de React Query
  const axiosInstance = useMemo(() => AxiosInstance({ side: 'client' }), []);
  
  // Extraire les options personnalisées
  const { initialState, cache: cacheOpts, ...reactQueryOptions } = options;

  // Si seul serviceKey est défini : lecture du cache uniquement
  if (!fetcher) {
    const queryResult = useQuery<ExtractReturnType<TFetcher>, Error, ExtractReturnType<TFetcher>, [string]>({
      queryKey: [cacheKey],
      queryFn: () => {
        throw new Error(
          `useService: Aucune donnée en cache pour la clé "${cacheKey}". ` +
          'Assurez-vous que les données ont été prefetchées avec FetchServerSide.'
        );
      },
      // Désactiver les refetch automatiques pour lecture de cache seule
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
      ...reactQueryOptions,
      // initialState utilisé comme placeholderData
      placeholderData: initialState,
    });

    return queryResult as any;
  }

  // Si fetcher est défini : requête normale
  const queryResult = useQuery<ExtractReturnType<TFetcher>, Error, ExtractReturnType<TFetcher>, [string]>({
    queryKey: [cacheKey],
    queryFn: async () => {
      const serviceFn = fetcher(PrepareServices);
      return await serviceFn(axiosInstance);
    },
    // Optimisations React Query
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...reactQueryOptions,
    // initialState utilisé comme initialData
    initialData: initialState,
  });

  return queryResult as any;
}
