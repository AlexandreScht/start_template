'use client';

import { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import useSWR from 'swr';

const ServiceContext = createContext<Services.Providers.ServiceContextProvider | undefined>(undefined);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const preparedService = useCallback((arg: Services.headerOption) => PrepareServices({ ...arg, side: 'client' }), []);

  const services: Services.Providers.serviceWrapper = useCallback(
    (selector, options = {}) => {
      const services = preparedService(options);
      const wrappedServices = Object.entries(services).reduce((acc, [key, fn]) => {
        const typedKey = key as keyof Services.Index.returnType;
        const typedFn = fn as Services.Index.returnType[typeof typedKey] & ((arg: any, customKey?: string) => any);

        acc[typedKey] = ((...args: any[]): Services.Index.WrappedServiceOutput<typeof typedFn> => {
          const [first, second] = args;
          return {
            key: second ? String(second) : `${String(typedKey)}:${JSON.stringify(first)}`,
            fetcher: () => typedFn(first),
          };
        }) as Services.Index.WrappedServices<Services.Index.returnType>[typeof typedKey];

        return acc;
      }, {} as Services.Index.WrappedServices<Services.Index.returnType>);
      return selector(wrappedServices);
    },
    [preparedService],
  );

  // const revalidate = useCallback((services: Services.Revalidate.argsType[], options?: MutatorOptions): void => {
  //   const isValidService = (obj: any): obj is { key: string; service: (arg: unknown) => unknown; arg: (cache: any) => any } =>
  //     obj && typeof obj === 'object' && ['key', 'service', 'arg'].every(key => key in obj);

  //   services.forEach(service => {
  //     const isFnService = typeof service === 'function';
  //     const serviceObj = isFnService ? service() : service;

  //     if (!isValidService(serviceObj)) {
  //       throw new InvalidArgumentError('Service array include an invalid function');
  //     }
  //     const { key, arg: updater } = serviceObj;

  //     if (isFnService) {
  //       mutate(key, v => v, options);
  //     } else {
  //       if (typeof updater !== 'function') {
  //         throw new InvalidArgumentError('Service arguments only accept functions');
  //       }
  //       const serviceOptions = updater(undefined)[1];
  //       mutate(
  //         key,
  //         currentCache => {
  //           const [newValues] = updater(currentCache);
  //           return newValues;
  //         },
  //         serviceOptions ?? options,
  //       );
  //     }
  //   });
  // }, []);

  const contextValue = useMemo(() => ({ services }), [services]);
  // const contextValue = useMemo(() => ({ services, revalidate }), [services, revalidate]);

  return <ServiceContext.Provider value={contextValue}>{children}</ServiceContext.Provider>;
}

export const useService = <K extends keyof Services.Index.returnType>(
  ...args: Parameters<Services.Providers.useService.Type<K>>
): ReturnType<Services.Providers.useService.Type<K>> => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useService must be used within a ServiceProvider');
  }
  const serviceOutput = context.services(...args);
  return useSWR(serviceOutput.key, async () => {
    const response = await serviceOutput.fetcher();
    return response as Services.Providers.useService.ServiceData<Awaited<ReturnType<Services.Index.returnType[K]>>>;
  });
};

export function useMutate() {}
