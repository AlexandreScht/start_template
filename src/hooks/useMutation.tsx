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

// 'use client';

// import { ClientException } from '@/exceptions/errors';
// import type { Services } from '@/interfaces/services';
// import type PrepareServices from '@/services';
// import { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
// import { mutate } from 'swr';
// import { MutationServicesContext } from './ServiceProvider';

// export function useMutation(
//   selector: (services: Services.useMutation.MutationServices<typeof PrepareServices>) => Array<any>,
//   defaultOption?: Services.Config.globalMutationOptions,
// ): void {
//   const context = useContext(MutationServicesContext);
//   if (!context || !context.mutationServices) {
//     throw new ClientException('useMutation doit être utilisé dans un ServiceProvider');
//   }
//   const { mutationServices } = context;

//   const selectedMutations = useMemo(
//     () => selector(mutationServices as unknown as Services.useMutation.MutationServices<any>),
//     [mutationServices, selector],
//   );

//   const isExtendedWrappedOutput = useCallback(
//     (item: Services.useMutation.MutationDefinition): boolean => typeof item === 'object' && item !== null && 'key' in item,
//     [],
//   );

//   // Fonction qui gère la fusion des options :
//   // - Si allowedMerge est false dans options, on retourne uniquement les options épurées.
//   // - Sinon, on fusionne en fonction de la logique de onMerge de defaultOption
//   //   (puis on retire onMerge ainsi que allowedMerge et allowedMutation du résultat).
//   const setMutateOptions = useCallback((defaultOpt?: Services.Config.globalMutationOptions, options?: Services.Config.MutationOptions) => {
//     const { allowedMerge, allowedMutation, ...cleanOptions } = options ?? {};
//     if (allowedMerge === false) {
//       return cleanOptions;
//     }
//     const { onMerge, ...cleanDefaultOpt } = defaultOpt ?? {};
//     switch (onMerge) {
//       case 'combined':
//         return { ...cleanDefaultOpt, ...cleanOptions };
//       case 'force':
//         return { ...cleanOptions, ...cleanDefaultOpt };
//       default:
//         return { ...cleanDefaultOpt, ...cleanOptions };
//     }
//   }, []);

//   // Ref pour mémoriser la dernière valeur de allowedMutation pour chaque key.
//   const previousAllowedMutationRef = useRef(new Map<string, boolean>());

//   useEffect(() => {
//     selectedMutations.forEach(item => {
//       let key: string;
//       let allowedMutation: boolean = true; // Par défaut, on autorise la mutation.
//       let mutateOptions = {};

//       if (typeof item === 'function') {
//         key = (item as { defaultKey: string }).defaultKey;
//         if (defaultOption && 'allowedMutation' in defaultOption) {
//           allowedMutation = defaultOption.allowedMutation as boolean;
//         }
//         mutateOptions = defaultOption ? setMutateOptions(defaultOption, {}) : {};
//       } else if (isExtendedWrappedOutput(item)) {
//         const { key: itemKey, updater, cacheOptions } = item as Services.useMutation.MutationDefinition;
//         key = itemKey;
//         if (cacheOptions && 'allowedMutation' in cacheOptions) {
//           allowedMutation = cacheOptions.allowedMutation as boolean;
//         }
//         mutateOptions = setMutateOptions(defaultOption, cacheOptions);
//       } else {
//         return;
//       }

//       // Vérifier si allowedMutation a changé pour cet item.
//       const previousAllowed = previousAllowedMutationRef.current.get(key);
//       if (previousAllowed === allowedMutation) {
//         // Si pas de changement, on ne fait rien.
//         return;
//       }
//       // Mémoriser la nouvelle valeur pour cet item.
//       previousAllowedMutationRef.current.set(key, allowedMutation);

//       // Si allowedMutation est false, on ne lance pas mutate pour cet item.
//       if (!allowedMutation) {
//         return;
//       }

//       // En fonction du type d'item, on appelle mutate de swr.
//       if (typeof item === 'function') {
//         mutate((k: string) => typeof k === 'string' && k.startsWith(key), undefined, mutateOptions);
//       } else if (isExtendedWrappedOutput(item)) {
//         if (item.updater && typeof item.updater === 'function') {
//           mutate(
//             (k: string) => typeof k === 'string' && k.startsWith(key),
//             (currentCache: unknown) => item.updater!(currentCache),
//             mutateOptions,
//           );
//         } else {
//           mutate((k: string) => typeof k === 'string' && k.startsWith(key), undefined, mutateOptions);
//         }
//       }
//     });
//   }, [selectedMutations, defaultOption, isExtendedWrappedOutput, setMutateOptions]);
// }
