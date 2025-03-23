'use client';

import { ClientException } from '@/exceptions/errors';
import type { Services } from '@/interfaces/services';
import type PrepareServices from '@/services';
import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { mutate } from 'swr';
import { MutationServicesContext } from './ServiceProvider';

export function useMutation(
  selector: (services: Services.useMutation.MutationServices<typeof PrepareServices>) => Array<any>,
  defaultOption?: Services.Config.globalMutationOptions,
): void {
  const context = useContext(MutationServicesContext);
  if (!context || !context.mutationServices) {
    throw new ClientException('useMutation doit être utilisé dans un ServiceProvider');
  }
  const { mutationServices } = context;

  const selectedMutations = useMemo(
    () => selector(mutationServices as unknown as Services.useMutation.MutationServices<any>),
    [mutationServices, selector],
  );

  const hasMutatedRef = useRef(false);

  const isExtendedWrappedOutput = useCallback(
    (item: Services.useMutation.MutationDefinition): boolean => typeof item === 'object' && item !== null && 'key' in item,
    [],
  );

  const setMutateOptions = useCallback((defaultOpt?: Services.Config.globalMutationOptions, options?: Services.Config.MutationOptions) => {
    if (!options) return defaultOpt ?? {};
    switch (defaultOpt?.onMerge) {
      case 'combined':
        return { ...defaultOpt, ...options };
      case 'force':
        return { ...options, ...defaultOpt };
      default:
        return { ...defaultOpt, ...options };
    }
  }, []);

  useEffect(() => {
    if (!selectedMutations.length || hasMutatedRef.current) return;
    hasMutatedRef.current = true;

    selectedMutations.forEach(item => {
      if (typeof item === 'function') {
        const key = (item as { defaultKey: string }).defaultKey;
        mutate((k: string) => typeof k === 'string' && k.startsWith(key), undefined, defaultOption ?? {});
      } else if (isExtendedWrappedOutput(item)) {
        const { key, updater, cacheOptions } = item as Services.useMutation.MutationDefinition;
        const mutateOption = setMutateOptions(defaultOption, cacheOptions);
        if (updater && typeof updater === 'function') {
          mutate(
            (k: string) => typeof k === 'string' && k.startsWith(key),
            (currentCache: unknown) => updater(currentCache),
            mutateOption,
          );
        } else {
          mutate((k: string) => typeof k === 'string' && k.startsWith(key), undefined, mutateOption);
        }
      }
    });
  }, [defaultOption, selectedMutations, isExtendedWrappedOutput, setMutateOptions]);
}
