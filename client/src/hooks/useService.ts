/* eslint-disable react-hooks/rules-of-hooks */

import { ClientException } from '@/exceptions/errors';
import type { Services } from '@/interfaces/services';
import AxiosInstance from '@/libs/axiosInstance';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';
type BrandedServiceSelector<R = any> = {
  __brand: 'ServiceSelector';
  fn: (axios: Services.Axios.instance) => Promise<R>;
};

type ExtractReturnType<T> = T extends BrandedServiceSelector<infer R> ? R : never;

type UseServiceOptions<TData = unknown> = Omit<
  UseQueryOptions<TData, Error, TData, [string]>,
  'queryKey' | 'queryFn'
>;

type UseServiceParams<TData = any> = {
  serviceKey?: string;
  fetcher?: BrandedServiceSelector<TData>;
  options?: UseServiceOptions<TData>;
};

function getRouteKey(): string {
  try {
    const currentPath = window.location.pathname;
    return currentPath.replace(/^\//g, '').replace(/\//g, '_') || 'root';
  } catch {
    throw new ClientException('useService: Impossible de récupérer le chemin actuel');
  }
}

export function useService<TFetcher extends BrandedServiceSelector>(params: {
  serviceKey?: string;
  fetcher: TFetcher;
  options?: UseServiceOptions<ExtractReturnType<TFetcher>>;
}): ReturnType<typeof useQuery<ExtractReturnType<TFetcher>, Error, ExtractReturnType<TFetcher>, [string]>>;

export function useService<TData = unknown>(params: {
  serviceKey?: string;
  fetcher?: never;
  options?: UseServiceOptions<TData>;
}): ReturnType<typeof useQuery<TData, Error, TData, [string]>>;

export function useService<TData = unknown>(params: {
  serviceKey?: string;
  fetcher: BrandedServiceSelector<TData>;
  options?: UseServiceOptions<TData>;
}): ReturnType<typeof useQuery<TData, Error, TData, [string]>>;

export function useService<TData = any>(params: UseServiceParams<TData>): any {
  const { serviceKey, fetcher, options = {} } = params;

  if (!serviceKey && !fetcher) {
    throw new ClientException('useService: Au moins serviceKey ou fetcher doit être défini');
  }

  const cacheKey = serviceKey || getRouteKey();
  const axiosInstance = useMemo(() => AxiosInstance({ ssr: false }), []);

  if (fetcher) {
    return useQuery({
      queryKey: [cacheKey],
      queryFn: async () => {
        return await fetcher.fn(axiosInstance);
      },
      ...options,
    } as any);
  }

  return useQuery({
    queryKey: [cacheKey],
    queryFn: async () => {
      throw new ClientException('useService: aucun cache disponible, le fetcher est obligatoire');
    },
    ...options,
  } as any);
}
