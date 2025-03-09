'use client';
import { InvalidArgumentError, SideError } from '@/exceptions/errors';
import useSWR, { BareFetcher, SWRConfiguration } from 'swr';

type NotFunction<T> = T extends (arg: unknown) => unknown ? never : T;

/**
 *
 * @param serviceFunction Service Function from useAppService() with data arguments (no Function arguments)
 * @param allowedService Boolean => Condition to call the service [default => true]
 * @param swrOptions SWRConfiguration
 * @returns Object => { data, error, isLoading, isValidating, mutate }
 */
export default function useClientSWR<K extends string, R extends (arg: A) => any, A>(
  { key, service, arg }: { key: K; service: R; arg: NotFunction<A> },
  allowedService: boolean = true,
  swrOptions?: SWRConfiguration<R, unknown, BareFetcher<R>>,
) {
  if (typeof window !== 'undefined') throw new SideError();
  const safeFetcher = (arg: NotFunction<A>) => {
    if (typeof arg === 'function') {
      throw new InvalidArgumentError('Erreur : le paramètre passé au service ne doit pas être une fonction');
    }
    return () => service(arg);
  };

  const serviceKey = allowedService ? key : null;
  return useSWR(serviceKey, safeFetcher(arg), swrOptions);
}
