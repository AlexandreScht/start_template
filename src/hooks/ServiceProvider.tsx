'use client';

import { InvalidArgumentError } from '@/exceptions/errors';
import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import useSWR, { mutate, preload } from 'swr';

const ServiceContext = createContext<Services.Providers.ServiceContextProvider | undefined>(undefined);
interface ExtendedServiceContext {
  callServices: Services.Providers.serviceWrapper;
  wrappedServices: Services.Index.WrappedServices<Services.Index.returnType>;
}

interface ExtendedWrappedOutput extends Services.Index.WrappedServiceOutput<any> {
  updater?: (currentCache: any) => [any, string?];
  cacheOptions?: any;
}
export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const preparedService = useCallback((arg: Services.headerOption = {}) => PrepareServices({ ...arg, side: 'client' }), []);

  // TODO: => useRef a la place de useMemo
  const wrappedServices = useMemo(() => {
    const svc = preparedService();
    return Object.entries(svc).reduce((acc, [key]) => {
      const typedKey = key as keyof Services.Index.returnType;
      // On crée la fonction wrapper
      const wrappedFn = ((...args: any[]): ExtendedWrappedOutput => {
        const [first, second] = args;
        console.log({ args });

        if (typeof first === 'function') {
          const result = first();
          if (
            !Array.isArray(result) ||
            result.length === 0 ||
            result.length > 2 ||
            !['undefined', 'object'].includes(typeof result[0]) ||
            (result.length === 2 && typeof result[1] !== 'string')
          ) {
            throw new InvalidArgumentError(`Selector arguments for the << ${typedKey} >> service are not allowed.`);
          }
          const [selArgs, customKey] = result;

          const updaterFn = (v: any) => {
            return { ...v, ...selArgs };
          };

          return {
            key: customKey ?? typedKey,
            updater: updaterFn,
            cacheOptions: second,
          };
        } else if (typeof first === 'object') {
          return {
            key: typedKey,
            cacheOptions: first,
          };
        } else {
          throw new InvalidArgumentError(`Selector arguments for the << ${typedKey} >> service are not allowed.`);
        }
      }) as Services.Index.WrappedServices<Services.Index.returnType>[typeof typedKey];

      // CAS 2 : attacher la clé par défaut sur la fonction elle-même
      (wrappedFn as any).defaultKey = `${String(typedKey)}`;
      acc[typedKey] = wrappedFn;
      return acc;
    }, {} as Services.Index.WrappedServices<Services.Index.returnType>);
  }, [preparedService]);

  const callServices: Services.Providers.serviceWrapper = useCallback(
    (selector, options = {}) => {
      const svc = preparedService(options);
      const wrappedServices = Object.entries(svc).reduce((acc, [key, fn]) => {
        const typedKey = key as keyof Services.Index.returnType;
        const typedFn = fn as Services.Index.returnType[typeof typedKey] & ((arg: any, customKey?: string) => any);
        acc[typedKey] = (...args: any[]): Services.Index.WrappedServiceOutput<typeof typedFn> => {
          const [first, second] = args;
          return {
            key: second ? String(second) : `${String(typedKey)}:${JSON.stringify(first)}`,
            fetcher: () => typedFn(first),
          };
        };
        return acc;
      }, {} as Services.Index.WrappedServices<Services.Index.returnType>);
      return selector(wrappedServices);
    },
    [preparedService],
  );

  const contextValue = useMemo(() => ({ callServices, wrappedServices }), [callServices, wrappedServices]);
  return <ServiceContext.Provider value={contextValue}>{children}</ServiceContext.Provider>;
}

export function useService<K extends keyof Services.Index.returnType, U extends Services.Providers.useService.ServiceOption = NonNullable<unknown>>(
  ...args: Parameters<Services.Providers.useService.Type<K, U>>
): ReturnType<Services.Providers.useService.Type<K, U>> {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useService must be used within a ServiceProvider');
  }
  const serviceOutput = context.callServices(...args);
  return useSWR(serviceOutput.key, async () => {
    try {
      const response = await serviceOutput.fetcher();
      return response as Services.Providers.useService.ServiceData<Awaited<ReturnType<Services.Index.returnType[K]>>>;
    } catch (error: unknown) {
      throw servicesErrors(error);
    }
  }) as ReturnType<Services.Providers.useService.Type<K, U>>;
}

export function usePrefetch<K extends keyof Services.Index.returnType>(selector: Services.Providers.useService.selector<K>): void {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('usePrefetch must be used within a ServiceProvider');
  }
  const { key, fetcher } = context.callServices(selector);
  preload(key, fetcher);
}

export function useMutation<U extends Services.Providers.useMutation.globalMutationOptions = NonNullable<unknown>>(
  callback: Services.Providers.useMutation.selector,
  options?: U,
): void {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useMutation must be used within a ServiceProvider');
  }

  // Exécution de la callback avec les fonctions extraites
  const mutationsArray = callback(context.wrappedServices);

  mutationsArray.forEach(item => {
    // CAS 2 : si l'utilisateur a passé la référence à la fonction (non invoquée)
    if (typeof item === 'function') {
      const key = (item as any).defaultKey;
      mutate(k => typeof k === 'string' && k.startsWith(key), undefined, options ?? {});
    } else {
      // Ici, v.account(...args)
      // TODO: => cacheOptions et options combinaisons suivant la key combined de options
      const { key, updater, cacheOptions } = item ?? {};
      if (updater && typeof updater === 'function') {
        // CAS 1
        mutate(
          k => typeof k === 'string' && k.startsWith(key),
          (currentCache: any) => updater!(currentCache),
          cacheOptions || {},
        );
      } else {
        // CAS 3
        mutate(k => typeof k === 'string' && k.startsWith(key), undefined, cacheOptions || {});
      }
    }
  });
}
