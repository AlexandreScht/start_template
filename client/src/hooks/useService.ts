'use client';

/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-redeclare */
import type { Services } from '@/interfaces/services';
import AxiosInstance from '@/libs/axiosInstance';
import PrepareServices from '@/services';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { CacheRequestConfig } from 'axios-cache-interceptor';
import { useMemo } from 'react';

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
  pathname?: string; // Route actuelle pour générer la clé de cache
};

// Paramètres d'entrée de useService
type UseServiceParams<TFetcher extends ServiceSelector = ServiceSelector> = {
  serviceKey?: string;
  fetcher?: TFetcher;
  options?: UseServiceOptions<ExtractReturnType<TFetcher>>;
};

// Détecte si on est côté client
function isClient() {
  return typeof window !== 'undefined';
}

function getRouteKey(pathname?: string): string {
  if (pathname) {
    return pathname.replace(/^\//g, '').replace(/\//g, '_') || 'root';
  }

  if (isClient()) {
    try {
      const currentPath = window.location.pathname;
      return currentPath.replace(/^\//g, '').replace(/\//g, '_') || 'root';
    } catch {
      return 'client_unknown';
    }
  }

  // Fallback si exécuté sans fenêtre (ne devrait pas arriver avec 'use client')
  return 'client_unknown';
}

// Implémentation
export function useService<TFetcher extends ServiceSelector = ServiceSelector>(
  params: UseServiceParams<TFetcher>,
):
  | ReturnType<typeof useQuery<ExtractReturnType<TFetcher>, Error, ExtractReturnType<TFetcher>, [string]>> {
  const { serviceKey, fetcher, options = {} } = params;

  if (!serviceKey && !fetcher) {
    throw new Error('useService: Au moins serviceKey ou fetcher doit être défini');
  }

  const cacheKey = serviceKey || getRouteKey(options.pathname);

  // Côté client : utiliser useQuery de React Query
  const axiosInstance = useMemo(() => AxiosInstance({ side: 'client' }), []);

  // Extraire les options personnalisées
  const { initialState, ...reactQueryOptions } = options;

  const enabled = typeof window !== 'undefined' && !!fetcher;

  const queryResult = useQuery<ExtractReturnType<TFetcher>, Error, ExtractReturnType<TFetcher>, [string]>({
    queryKey: [cacheKey],
    queryFn: async () => {
      if (!fetcher) {
        // Ne sera pas appelé si enabled === false
        return initialState as ExtractReturnType<TFetcher>;
      }
      const serviceFn = fetcher(PrepareServices);
      return await serviceFn(axiosInstance);
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled,
    retry: false,
    ...reactQueryOptions,
    initialData: initialState === undefined ? undefined : (initialState as ExtractReturnType<TFetcher>),
  });

  return queryResult as any;
}
