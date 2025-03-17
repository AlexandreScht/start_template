'use client';

import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import useSWR, { preload } from 'swr';

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

  const contextValue = useMemo(() => ({ services }), [services]);
  return <ServiceContext.Provider value={contextValue}>{children}</ServiceContext.Provider>;
}

export function useService<K extends keyof Services.Index.returnType, U extends Services.Providers.useService.ServiceOption = NonNullable<unknown>>(
  ...args: Parameters<Services.Providers.useService.Type<K, U>>
): ReturnType<Services.Providers.useService.Type<K, U>> {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useService must be used within a ServiceProvider');
  }
  const serviceOutput = context.services(...args);
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
  const { key, fetcher } = context.services(selector);
  preload(key, fetcher);
}

export function useMutation<U extends Services.Providers.useMutation.globalMutationOptions = NonNullable<unknown>>(
  ...args: Parameters<Services.Providers.useMutation.Type<U>>
): ReturnType<Services.Providers.useMutation.Type<U>> {
  // Implémentation ici...
}
