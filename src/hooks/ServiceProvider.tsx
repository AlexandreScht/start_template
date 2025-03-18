'use client';

import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import useSWR, { mutate, preload } from 'swr';

const ServiceContext = createContext<Services.Providers.ServiceContextProvider | undefined>(undefined);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const preparedService = useCallback((arg: Services.headerOption = {}) => PrepareServices({ ...arg, side: 'client' }), []);

  const wrappedServices = useMemo(() => {
    const svc = preparedService();
    return Object.entries(svc).reduce((acc, [key, fn]) => {
      const typedKey = key as keyof Services.Index.returnType;
      const typedFn = fn as Services.Index.returnType[typeof typedKey] & ((arg: any, customKey?: string) => any);
      // On crée la fonction wrapper
      const wrappedFn = ((...args: any[]): ExtendedWrappedOutput => {
        const [first, second] = args;
        let keyString = `${String(typedKey)}`;
        let updater: undefined | ExtendedWrappedOutput['updater'];
        let cacheOptions: any = undefined;
        if (typeof first === 'function') {
          updater = first;
          cacheOptions = second; // ex: { isValid: true }
          // La clé par défaut reste celle générée par le nom du service
          keyString = `${String(typedKey)}`;
        } else {
          cacheOptions = first;
          keyString = `${String(typedKey)}`;
        }
        return {
          key: keyString,
          fetcher: () => typedFn(first),
          updater,
          cacheOptions,
        };
      }) as Services.Index.WrappedServices<Services.Index.returnType>[typeof typedKey];

      // CAS 2 : attacher la clé par défaut sur la fonction elle-même
      (wrappedFn as any).defaultKey = `${String(typedKey)}:default`;
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
      // On récupère la clé par défaut stockée sur la fonction
      const key = (item as any).defaultKey;
      console.log('useMutation: Référence de fonction détectée (ex: v.account)');
      mutate(key, undefined, {}); // Mutate avec la clé par défaut, sans updater ni options
    } else {
      // Ici, item est le résultat d'un appel (cas 1 ou cas 3)
      console.log('useMutation: Fonction appelée détectée (ex: v.account(...args))');
      if (item.updater && typeof item.updater === 'function') {
        // CAS 1
        // On utilise l'updater pour mettre à jour le cache.
        // On suppose que lors de l'appel, l'updater pourra retourner [newValues, keyOverride?]
        mutate(
          // Appel initial de l'updater pour déterminer si un keyOverride est fourni
          item.updater({})[1] || item.key,
          (currentCache: any) => {
            const [newValues] = item.updater!(currentCache);
            return newValues;
          },
          item.cacheOptions || {},
        );
      } else {
        // CAS 3 : aucun updater n'est défini, on utilise simplement la clé par défaut et on passe cacheOptions.
        mutate(item.key, undefined, item.cacheOptions || {});
      }
    }
  });
}
