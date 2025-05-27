'use client';

import { InvalidArgumentError } from '@/exceptions/errors';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import React, { createContext, useCallback, useMemo, useRef } from 'react';

export const CallServicesContext = createContext<Services.Provider.WrappedServices<typeof PrepareServices> | undefined>(undefined);

export const MutationServicesContext = createContext<{
  mutationServices: {
    [K in keyof typeof PrepareServices]: Services.useMutation.MutationService<(typeof PrepareServices)[K]> & { defaultKey: string };
  };
} | null>(null);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const prepareServicesRef = useRef(PrepareServices);

  const createWrappedServices = useCallback(
    <T extends Record<string, (...args: any[]) => any>>(
      services: T,
    ): {
      [K in keyof T]: Services.Provider.WrappedServiceFunction<Services.ParamType<T[K]>, Services.Index.returnType<T[K]>>;
    } => {
      const result = {} as {
        [K in keyof T]: Services.Provider.WrappedServiceFunction<Services.ParamType<T[K]>, Services.Index.returnType<T[K]>>;
      };

      (Object.keys(services) as (keyof T)[]).forEach(key => {
        result[key] = ((params: Services.ParamType<T[typeof key]>, override?: string) => ({
          key: override ? String(override) : `${String(key)}:${JSON.stringify(params)}`,
          fetcher: (axiosInstance: Services.Axios.instance) => services[key](params)(axiosInstance),
        })) as Services.Provider.WrappedServiceFunction<Services.ParamType<T[typeof key]>, Services.Index.returnType<T[typeof key]>>;
      });

      return result;
    },
    [],
  );

  const callServices: Services.Provider.WrappedServices<typeof PrepareServices> = useMemo(() => {
    return createWrappedServices(prepareServicesRef.current);
  }, [createWrappedServices]);

  // const callServices: Services.Provider.WrappedServices<typeof PrepareServices> = useMemo(() => {
  //   const svc = prepareServicesRef.current;
  //   return Object.entries(svc).reduce(
  //     (acc, [key, fn]) => {
  //       acc[key as keyof typeof svc] = (...args: any[]) => {
  //         const [first, second] = args;
  //         return {
  //           key: second ? String(second) : `${String(key)}:${JSON.stringify(first)}`,
  //           fetcher: axiosInstance => fn(first)(axiosInstance),
  //         };
  //       };
  //       return acc;
  //     },
  //     {} as Services.Provider.WrappedServices<typeof PrepareServices>,
  //   );
  // }, []);

  const validateResult = useCallback((result: unknown, typedKey: string): [any, string?] => {
    if (!Array.isArray(result) || result.length === 0 || result.length > 2 || (result.length === 2 && typeof result[1] !== 'string')) {
      throw new InvalidArgumentError(`Les arguments pour le service << ${typedKey} >> ne sont pas autorisés.`);
    }
    return result as [unknown, string?];
  }, []);

  const mutationServices = useMemo(() => {
    const svc = PrepareServices;
    return Object.entries(svc).reduce(
      (acc, [key]) => {
        const createWrappedFn = <F extends (arg: any) => any>(typedKey: string): Services.useMutation.MutationService<F> & { defaultKey: string } => {
          const wrappedFn = ((...args: any[]): Services.useMutation.MutationDefinition => {
            const [first, second] = args;
            if (typeof first === 'function') {
              const [, customKey] = validateResult(first(), typedKey);
              return {
                key: customKey ?? typedKey,
                updater: (prev: Services.ParamType<F>) => {
                  const [newVal] = first(prev);
                  return newVal;
                },
                cacheOptions: second ?? {},
              };
            } else if (typeof first === 'object') {
              return { key: typedKey, cacheOptions: first };
            }
            throw new InvalidArgumentError(`Les arguments pour le service << ${typedKey} >> ne sont pas autorisés.`);
          }) as Services.useMutation.MutationService<F> & { defaultKey: string };
          wrappedFn.defaultKey = typedKey;
          return wrappedFn;
        };
        acc[key as keyof typeof svc] = createWrappedFn(key) as any;
        return acc;
      },
      {} as {
        [K in keyof typeof svc]: Services.useMutation.MutationService<(typeof svc)[K]> & { defaultKey: string };
      },
    );
  }, [validateResult]);

  return (
    <CallServicesContext.Provider value={callServices}>
      <MutationServicesContext.Provider value={{ mutationServices }}>{children}</MutationServicesContext.Provider>
    </CallServicesContext.Provider>
  );
}
