'use client';

import { ClientException, InvalidArgumentError } from '@/exceptions/errors';
import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import AxiosInstance from '@/libs/axiosIntance';
import PrepareServices from '@/services';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import useSWR, { mutate, preload } from 'swr';

const ServiceContext = createContext<Services.Providers.ServiceContextProvider | undefined>(undefined);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const prepareServicesRef = useRef(PrepareServices);

  const callServices: Services.Providers.serviceWrapper = useCallback((selector, options = {}) => {
    const axiosInstance = AxiosInstance({ ...options, side: 'client' });
    const svc = prepareServicesRef.current;
    const wrappedServices = Object.entries(svc).reduce((acc, [key, fn]) => {
      const typedKey = key as keyof Services.Index.returnType;
      const typedFn = fn as Services.Index.returnType[typeof typedKey] & ((arg: any, customKey?: string) => any);
      acc[typedKey] = (...args: any[]): Services.FetchWrappedServiceOutput<typeof typedFn> => {
        const [first, second] = args;
        return {
          key: second ? String(second) : `${String(typedKey)}:${JSON.stringify(first)}`,
          fetcher: () => typedFn(first)(axiosInstance),
        };
      };
      return acc;
    }, {} as Services.Index.WrappedServices<Services.Index.returnType>);
    return selector(wrappedServices);
  }, []);

  const mutationServices = useMemo(() => {
    // Appel sans options
    const svc = prepareServicesRef.current;
    return Object.entries(svc).reduce((acc, [key]) => {
      const typedKey = key as keyof Services.Index.returnType;
      // Construction de la fonction wrapper basée sur le type générique WrappedServiceFunction
      const wrappedFn = ((...args: any[]): Services.Wrap.ExtendedWrappedOutput<any> => {
        const [first, second] = args;
        if (typeof first === 'function') {
          const result = first();
          if (
            !Array.isArray(result) ||
            result.length === 0 ||
            result.length > 2 ||
            typeof result[0] !== 'object' ||
            (result.length === 2 && typeof result[1] !== 'string')
          ) {
            throw new InvalidArgumentError(`Selector arguments for the << ${typedKey} >> service are not allowed.`);
          }
          const [selArgs, customKey] = result;
          const updaterFn = (v: any) => ({ ...v, ...selArgs });
          return {
            key: customKey ?? typedKey,
            updater: updaterFn,
            cacheOptions: second,
          };
        } else if (typeof first === 'object') {
          return { key: typedKey, cacheOptions: first };
        }
        throw new InvalidArgumentError(`Selector arguments for the << ${typedKey} >> service are not allowed.`);
      }) as Services.Wrap.WrappedServices<Services.Index.returnType>[typeof typedKey];
      (wrappedFn as any).defaultKey = String(typedKey);
      acc[typedKey] = wrappedFn;
      return acc;
    }, {} as Services.Wrap.WrappedServices<Services.Index.returnType>);
    // Comme prepareServicesRef est constant, on peut omettre des dépendances
  }, []);

  // const wrappedServices = useMemo(() => {
  //   const svc = preparedService();
  //   return Object.entries(svc).reduce((acc, [key]) => {
  //     const typedKey = key as keyof Services.Index.returnType;
  //     // On construit la fonction wrapper en se basant sur le type générique WrappedServiceFunction
  //     const wrappedFn = ((...args: any[]): Services.Wrap.ExtendedWrappedOutput<any> => {
  //       const [first, second] = args;
  //       if (typeof first === 'function') {
  //         const result = first();
  //         if (
  //           !Array.isArray(result) ||
  //           result.length === 0 ||
  //           result.length > 2 ||
  //           typeof result[0] !== 'object' ||
  //           (result.length === 2 && typeof result[1] !== 'string')
  //         ) {
  //           throw new InvalidArgumentError(`Selector arguments for the << ${typedKey} >> service are not allowed.`);
  //         }
  //         const [selArgs, customKey] = result;
  //         const updaterFn = (v: any) => ({ ...v, ...selArgs });
  //         return {
  //           key: customKey ?? typedKey,
  //           updater: updaterFn,
  //           cacheOptions: second,
  //         };
  //       } else if (typeof first === 'object') {
  //         return { key: typedKey, cacheOptions: first };
  //       }
  //       throw new InvalidArgumentError(`Selector arguments for the << ${typedKey} >> service are not allowed.`);
  //     }) as Services.Wrap.WrappedServices<Services.Index.returnType>[typeof typedKey];
  //     (wrappedFn as any).defaultKey = String(typedKey);
  //     acc[typedKey] = wrappedFn;
  //     return acc;
  //   }, {} as Services.Wrap.WrappedServices<Services.Index.returnType>);
  // }, [preparedService]);

  // const callServices: Services.Providers.serviceWrapper = useCallback(
  //   (selector, options = {}) => {
  //     const svc = preparedService(options);
  //     const wrappedServices = Object.entries(svc).reduce((acc, [key, fn]) => {
  //       const typedKey = key as keyof Services.Index.returnType;
  //       const typedFn = fn as Services.Index.returnType[typeof typedKey] & ((arg: any, customKey?: string) => any);
  //       acc[typedKey] = (...args: any[]): Services.FetchWrappedServiceOutput<typeof typedFn> => {
  //         const [first, second] = args;
  //         return {
  //           key: second ? String(second) : `${String(typedKey)}:${JSON.stringify(first)}`,
  //           fetcher: () => typedFn(first),
  //         };
  //       };
  //       return acc;
  //     }, {} as Services.Index.WrappedServices<Services.Index.returnType>);
  //     return selector(wrappedServices);
  //   },
  //   [preparedService],
  // );

  const contextValue = useMemo(() => ({ callServices, mutationServices }), [callServices, mutationServices]);
  return <ServiceContext.Provider value={contextValue}>{children}</ServiceContext.Provider>;
}

export function useService<K extends keyof Services.Index.returnType, U extends Services.Providers.useService.ServiceOption>(
  ...args: Parameters<Services.Providers.useService.Type<K, U>>
): ReturnType<Services.Providers.useService.Type<K, U>> {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new ClientException('useService must be used within a ServiceProvider');
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
    throw new ClientException('usePrefetch must be used within a ServiceProvider');
  }
  const { key, fetcher } = context.callServices(selector);
  preload(key, fetcher);
}

export function useMutation(
  callback: Services.Providers.useMutation.selector,
  defaultOption?: Services.Providers.useMutation.globalMutationOptions,
): void {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new ClientException('useMutation must be used within a ServiceProvider');
  }

  // Exécution de la callback avec les fonctions extraites pour les mutations
  const mutationsArray = callback(
    context.mutationServices as unknown as Services.Providers.useMutation.CleanWrappedServices<Services.Index.returnType>,
  );

  // On utilise un type guard qui retourne le type ExtendedWrappedOutput qui possède updater et cacheOptions
  const isExtendedWrappedOutput = <F extends (...args: any[]) => any>(item: any): item is Services.Wrap.ExtendedWrappedOutput<F> => {
    return item && typeof item === 'object' && 'key' in item;
  };

  const setMutateOptions = (
    defaultOption?: Services.Providers.useMutation.globalMutationOptions,
    options?: Services.Providers.useService.MutateOption,
  ) => {
    if (!options) return defaultOption ?? {};
    switch (defaultOption?.merge) {
      case 'combined':
        return { ...defaultOption, ...options };
      case 'force':
        return { ...options, ...defaultOption };
      default:
        return options ?? defaultOption ?? {};
    }
  };

  useEffect(() => {
    mutationsArray.forEach(item => {
      // Appel à mutate ici, ce qui évite de le faire lors du rendu
      if (typeof item === 'function') {
        const key = (item as any).defaultKey;
        mutate(k => typeof k === 'string' && k.startsWith(key), undefined, defaultOption ?? {});
      } else if (isExtendedWrappedOutput(item)) {
        const { key, updater, cacheOptions } = item as any;
        const mutateOption = setMutateOptions(defaultOption, cacheOptions);
        if (updater && typeof updater === 'function') {
          mutate(
            k => typeof k === 'string' && k.startsWith(key),
            (currentCache: any) => updater(currentCache),
            mutateOption,
          );
        } else {
          mutate(k => typeof k === 'string' && k.startsWith(key), undefined, mutateOption);
        }
      }
    });
  }, [mutationsArray, defaultOption]);
}
