'use client';

import { InvalidArgumentError } from '@/exceptions/errors';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import type React from 'react';
import { createContext, useCallback, useMemo, useRef } from 'react';

export const CallServicesContext = createContext<Services.Provider.WrappedServices<typeof PrepareServices> | undefined>(
  undefined,
);

export const MutationServicesContext = createContext<{
  mutationServices: {
    [K in keyof typeof PrepareServices]: Services.useMutation.MutationService<(typeof PrepareServices)[K]> & {
      defaultKey: string;
    };
  };
} | null>(null);

const servicesCache = new WeakMap();

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const prepareServicesRef = useRef(PrepareServices);

  const createWrappedServices = useCallback(<T extends Record<string, (...args: any[]) => any>>(services: T) => {
    if (servicesCache.has(services)) {
      return servicesCache.get(services);
    }

    const result = {} as {
      [K in keyof T]: Services.Provider.WrappedServiceFunction<
        Services.ParamType<T[K]>,
        Services.Index.returnType<T[K]>
      >;
    };

    const serviceKeys = Object.keys(services) as (keyof T)[];

    serviceKeys.forEach(key => {
      const keyString = String(key);
      result[key] = ((params: Services.ParamType<T[typeof key]>, override?: string) => {
        let paramKey: string;
        if (params === undefined || params === null) {
          paramKey = 'undefined';
        } else if (typeof params === 'string' || typeof params === 'number') {
          paramKey = String(params);
        } else {
          paramKey = JSON.stringify(params);
        }

        return {
          key: override ? String(override) : `${keyString}:${paramKey}`,
          fetcher: (axiosInstance: Services.Axios.instance) => services[key](params)(axiosInstance),
        };
      }) as Services.Provider.WrappedServiceFunction<
        Services.ParamType<T[typeof key]>,
        Services.Index.returnType<T[typeof key]>
      >;
    });

    servicesCache.set(services, result);
    return result;
  }, []);

  const callServices: Services.Provider.WrappedServices<typeof PrepareServices> = useMemo(
    () => createWrappedServices(prepareServicesRef.current),
    [createWrappedServices],
  );

  const validateResult = useCallback((result: unknown, typedKey: string): [any, string?] => {
    if (
      !Array.isArray(result) ||
      result.length === 0 ||
      result.length > 2 ||
      (result.length === 2 && typeof result[1] !== 'string')
    ) {
      throw new InvalidArgumentError(`Les arguments pour le service << ${typedKey} >> ne sont pas autorisés.`);
    }
    return result as [unknown, string?];
  }, []);

  const mutationServices = useMemo(() => {
    const svc = PrepareServices;
    return Object.entries(svc).reduce(
      (acc, [key]) => {
        const createWrappedFn = <F extends (arg: any) => any>(
          typedKey: string,
        ): Services.useMutation.MutationService<F> & { defaultKey: string } => {
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

  const callServicesValue = useMemo(() => callServices, [callServices]);
  const mutationServicesValue = useMemo(() => ({ mutationServices }), [mutationServices]);

  return (
    <CallServicesContext.Provider value={callServicesValue}>
      <MutationServicesContext.Provider value={mutationServicesValue}>{children}</MutationServicesContext.Provider>
    </CallServicesContext.Provider>
  );
}
