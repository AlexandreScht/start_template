'use client';

import { InvalidArgumentError } from '@/exceptions/errors';
import { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import useSWR, { mutate, type MutatorOptions } from 'swr';

interface ServiceContextProvider {
  services: Services.Index.WrappedServices<Services.Index.returnType>;
  // revalidate: (services: Services.Revalidate.argsType[], options?: MutatorOptions) => void;
}

const ServiceContext = createContext<ServiceContextProvider | undefined>(undefined);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const preparedService = useCallback((arg: Services.Axios.axiosHeaders) => PrepareServices({ ...arg, side: 'client' }), []);

  const services = useCallback(
    <K extends keyof Services.Index.returnType>(
      selector: (
        s: Services.Index.WrappedServices<Services.Index.returnType>,
      ) => ReturnType<Services.Index.WrappedServices<Services.Index.returnType>[K]>,
      options: Services.Axios.axiosHeaders,
    ) => {
      const services = preparedService(options);
      const wrappedServices = Object.entries(services).reduce((acc, [key, fn]) => {
        const typedKey = key as keyof Services.Index.returnType;
        const typedFn = fn as Services.Index.returnType[typeof typedKey] & ((arg: any, customKey?: string) => any);

        acc[typedKey] = ((...args: any[]): Services.Index.WrappedServiceOutput<typeof typedFn> => {
          const [first, second] = args;
          return {
            key: `${String(second ?? typedKey)}:${JSON.stringify(first)}`,
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
  // const contextValue = useMemo(() => ({ services, revalidate }), [services, revalidate]);

  return <ServiceContext.Provider value={contextValue}>{children}</ServiceContext.Provider>;
}

export function useService(): any {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useAppService must be used within a ServiceProvider');
  }
  return useSWR('/', () => '');
}
