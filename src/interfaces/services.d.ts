import type PrepareServices from '@/services';
import type { CacheOptions } from 'axios-cache-interceptor';
import type { MutatorOptions, SWRConfiguration, SWRHook, SWRResponse } from 'swr';

declare namespace Services {
  /* =======================
     Types utilitaires communs
  ========================== */
  export type ParamType<F> = F extends (arg: infer A) => unknown ? A : never;
  export type WrappedFunctionCharge<A> = (arg: A) => [A, string?];
  interface axiosInstance {
    headers?: Axios.axiosHeaders;
    cache?: Cache.options;
    side: 'server' | 'client';
  }
  /* =======================
     Déclarations Axios
  ========================== */
  export namespace Axios {
    export interface Cookie {
      name: string;
      value: string;
      path?: string;
      domain?: string;
      secure: boolean;
      sameSite?: 'strict';
      httpOnly: boolean;
    }
    export interface SetCookie {
      name: string;
      value: unknown;
    }
    export type CommonRequestHeadersList = 'Accept' | 'Content-Length' | 'User-Agent' | 'Content-Encoding' | 'Authorization';
    export type AxiosHeaderValue = string | string[] | number | boolean | null;
    export interface RawAxiosHeaders {
      [key: string]: AxiosHeaderValue;
    }
    export type axiosHeaders = Partial<
      {
        ContentType:
          | 'text/html'
          | 'text/plain'
          | 'multipart/form-data'
          | 'application/json'
          | 'application/x-www-form-urlencoded'
          | 'application/octet-stream';
        'Set-Cookies': SetCookie[];
        withCredentials: boolean;
      } & { [Key in CommonRequestHeadersList]: AxiosHeaderValue }
    >;
  }

  /* =======================
     Déclarations Cache
  ========================== */
  export namespace Cache {
    export type serverOption = Partial<{
      key: string;
      enabled?: CacheOptions['cachePredicate'] | boolean;
      lifeTime?: CacheOptions['ttl'];
      persist?: boolean;
      etag?: CacheOptions['etag'];
      serverConfig?: boolean | CacheOptions['interpretHeader'];
      ModifiedSince?: CacheOptions['ModifiedSince'];
      debug?: CacheOptions['debug'];
    }>;

    export type clientOption = Partial<SWRConfiguration>;
    export type options = serverOption | clientOption;
  }

  interface BaseWrappedServiceOutput {
    key: string;
  }

  // Pour les services utilisés avec useService (fetcher)
  export interface FetchWrappedServiceOutput<F extends (...args: any[]) => any> extends BaseWrappedServiceOutput {
    fetcher: () => Index.returnType<F>;
  }

  // Pour les services utilisés avec useMutation (updater et options de cache)
  export interface UpdatableWrappedServiceOutput<F extends (...args: any[]) => any> extends BaseWrappedServiceOutput {
    updater?: (v: Parameters<F>) => Index.returnType<F>;
    cacheOptions?: Providers.useService.MutateOption;
  }

  // Type générique pour définir la signature d'une fonction « wrapped »
  type WrappedServiceFunctionGeneric<F, Output> = F extends (arg: infer A) => unknown
    ? {
        (arg: ParamType<F>, override?: string): Output;
        (arg: WrappedFunctionCharge<A>, options?: MutatorOptions & { isValid?: boolean }): Output;
      }
    : never;

  /* =======================
     Namespace Index (cas fetcher)
  ========================== */
  export namespace Index {
    export type returnType<F> = F extends (params: any) => (instance: { axios: any }) => Promise<infer R> ? R : never;

    export type WrappedServiceFunction<F> = WrappedServiceFunctionGeneric<F, FetchWrappedServiceOutput<F>>;

    export type WrappedServices<T extends { [K in keyof T]: (...args: any[]) => any }> = {
      [K in keyof T]: WrappedServiceFunction<T[K]>;
    };
  }

  /* =======================
     Namespace Wrap (cas updater)
  ========================== */
  export namespace Wrap {
    export type WrappedServiceFunction<F> = WrappedServiceFunctionGeneric<F, UpdatableWrappedServiceOutput<F>>;

    export type WrappedServices<T extends { [K in keyof T]: (...args: any[]) => any }> = {
      [K in keyof T]: WrappedServiceFunction<T[K]>;
    };

    // Optionnel : output étendu pour mutation
    export interface ExtendedWrappedOutput<F extends (...args: any[]) => any> extends UpdatableWrappedServiceOutput<F> {
      updater?: (currentCache: any) => [object?, string?];
      cacheOptions?: Providers.useService.MutateOption;
    }
  }

  /* =======================
     Namespace Providers
  ========================== */
  export namespace Providers {
    export type serviceWrapper = <K extends keyof Index.returnType>(
      selector: (s: Index.WrappedServices<Index.returnType>) => ReturnType<Index.WrappedServices<Index.returnType>[K]>,
      options?: useService.ServiceOption,
    ) => ReturnType<Index.WrappedServices<Index.returnType>[K]>;

    export interface ServiceContextProvider {
      callServices: serviceWrapper;
      wrappedServices: Wrap.WrappedServices<Index.returnType>;
    }

    // Utilitaire pour supprimer l'overload de la charge (pour useService)
    export type RemoveChargeOverload<F> = F extends {
      (arg: infer A, override?: string): infer R;
      (arg: any): any;
    }
      ? (arg: A, override?: string) => R
      : never;

    /* --------- useService --------- */
    export namespace useService {
      export type ServiceData<T> = T;
      export type CleanWrappedServices<T extends { [K in keyof T]: (...args: any[]) => any }> = {
        [K in keyof T]: RemoveChargeOverload<Index.WrappedServiceFunction<T[K]>>;
      };

      export interface ServiceOption {
        headers?: Axios.axiosHeaders;
        cache?: Cache.clientOption;
      }
      export interface ServiceServerOption {
        headers?: Axios.axiosHeaders;
        cache?: Cache.serverOption;
      }

      export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

      export type ExtractMiddlewareFromConfig<P> = P extends { cache: { use: infer U } }
        ? U extends Array<(hook: SWRHook) => infer Fn>
          ? UnionToIntersection<Fn extends (...args: any[]) => infer R ? R : never>
          : unknown
        : unknown;

      export type selector<K extends keyof Index.returnType> = (
        services: CleanWrappedServices<Index.returnType>,
      ) => FetchWrappedServiceOutput<Index.returnType[K]>;

      // export type Type<K extends keyof Index.returnType, U extends ServiceOption = unknown> = (
      //   selector: selector<K>,
      //   options?: U,
      // ) => SWRResponse<ServiceData<Awaited<ReturnType<Index.returnType[K]>>>, Error.messageReturn> & ExtractMiddlewareFromConfig<U>;

      export type Type<K extends keyof Index.returnType, U extends ServiceOption = unknown> = (
        selector: selector<K>,
        options?: U,
      ) => SWRResponse<ServiceData<Awaited<Index.returnType[K]>>, Error.messageReturn> & ExtractMiddlewareFromConfig<U>;

      // Alias pour les options de mutation
      export type MutateOption = MutatorOptions & { isValid?: boolean };
    }

    /* --------- useMutation --------- */
    export namespace useMutation {
      export type returnType = ReturnType<typeof PrepareServices>;

      export interface WrappedServiceOutput<F extends (...args: any[]) => any> {
        key: string;
        arg: Parameters<F>;
      }

      // Fonction wrapper pour mutation
      export type WrappedServiceFunction<F> = F extends (arg: infer A) => unknown
        ? {
            (arg: useService.MutateOption): WrappedServiceOutput<F>;
            <T extends ParamType<F> = ParamType<F>>(arg: (v: T) => [T, string?], options?: useService.MutateOption): WrappedServiceOutput<F>;
          }
        : never;

      export type WrappedServices<T extends { [K in keyof T]: (...args: any[]) => any }> = {
        [K in keyof T]: WrappedServiceFunction<T[K]>;
      };

      export type globalMutationOptions = MutatorOptions & {
        merge?: 'combined' | 'none' | 'force';
      };

      export type CleanWrappedServices<T extends { [K in keyof T]: (...args: any[]) => any }> = {
        [K in keyof T]: WrappedServiceFunction<T[K]>;
      };

      export type selector = (
        services: CleanWrappedServices<returnType>,
      ) => Array<WrappedServiceOutput<returnType[keyof returnType]> | WrappedServiceFunction<returnType[keyof returnType]>>;
    }
  }

  /* =======================
     Namespace Error
  ========================== */
  export namespace Error {
    export interface messageReturn {
      err: string;
      code: string;
    }
  }
}

// import type { AxiosInstance } from 'axios';
// import React, { useCallback, useRef } from 'react';
// import useSWR, { SWRConfiguration, SWRResponse } from 'swr';

// /* ===== Types provenant de services.d.ts ===== */
// namespace Services {
//   export namespace Index {
//     // Extrait le type de retour (résolu) d'un service
//     export type returnType<F> = F extends (params: any) => (instance: { axios: any }) => Promise<infer R> ? R : never;
//   }
//   export namespace useService {
//     // Ici, aucune transformation n'est faite sur le type retourné
//     export type ServiceData<T> = T;
//     // Type minimal pour l'option de service (vous pouvez l'enrichir si besoin)
//     export interface ServiceOption {}
//     // Extrait le middleware éventuel depuis la config (simplifié)
//     export type ExtractMiddlewareFromConfig<P> = P extends {
//       cache: { use: infer U };
//     }
//       ? U extends Array<(hook: any) => infer Fn>
//         ? Fn extends (...args: any[]) => infer R
//           ? R
//           : unknown
//         : unknown
//       : unknown;
//     // Type du selector servant à récupérer un service
//     export type selector<K extends keyof any> = (services: WrappedServices<typeof PrepareServices>) => { key: string; fetcher: () => Promise<any> };
//   }
//   export namespace Error {
//     // Type d'erreur attendu (à enrichir si besoin)
//     export interface messageReturn {}
//   }
// }

// /* ===== Types auxiliaires pour useService (local) ===== */
// export type ServiceOption = {
//   headers?: ApiRequests.Axios.axiosHeaders; // réutilise le type depuis les déclarations existantes
//   cache?: Partial<SWRConfiguration>;
// };

// export type WrappedServiceFunction<P, R> = (
//   params: P,
//   override?: string,
// ) => {
//   key: string;
//   fetcher: () => Promise<R>;
// };

// export type WrappedServices<T extends Record<string, any>> = {
//   [K in keyof T]: T[K] extends (params: infer P) => (instance: { axios: AxiosInstance }) => Promise<infer R> ? WrappedServiceFunction<P, R> : never;
// };

// export type ServiceSelector<R> = (services: WrappedServices<typeof PrepareServices>) => {
//   key: string;
//   fetcher: () => Promise<R>;
// };

// declare namespace ApiRequests {
//   type setRequest<P, R> = (params: P) => (instance: { axios: AxiosInstance }) => Promise<R>;

//   namespace User {
//     type Account = setRequest<{ id: number }, { user: string }>;
//   }

//   namespace Axios {
//     export interface Cookie {
//       name: string;
//       value: string;
//       path?: string;
//       domain?: string;
//       secure: boolean;
//       sameSite?: 'strict';
//       httpOnly: boolean;
//     }
//     export interface SetCookie {
//       name: string;
//       value: unknown;
//     }
//     export type CommonRequestHeadersList = 'Accept' | 'Content-Length' | 'User-Agent' | 'Content-Encoding' | 'Authorization';
//     export type AxiosHeaderValue = string | string[] | number | boolean | null;
//     export interface RawAxiosHeaders {
//       [key: string]: AxiosHeaderValue;
//     }
//     export type axiosHeaders = Partial<
//       {
//         ContentType:
//           | 'text/html'
//           | 'text/plain'
//           | 'multipart/form-data'
//           | 'application/json'
//           | 'application/x-www-form-urlencoded'
//           | 'application/octet-stream';
//         'Set-Cookies': SetCookie[];
//         withCredentials: boolean;
//       } & { [Key in CommonRequestHeadersList]: AxiosHeaderValue }
//     >;
//   }
// }

// export const AccountService: ApiRequests.User.Account =
//   ({ id }) =>
//   async axios => {
//     console.log(axios);
//     console.log(id);
//     return { user: 'Rodrigo' };
//   };

// const PrepareServices = {
//   //* users
//   account: AccountService,
// };

// export default PrepareServices;

// export function ServiceProvider() {
//   const prepareServicesRef = useRef(PrepareServices);

//   const callServices = useCallback(<R>(selector: ServiceSelector<R>, options?: ServiceOption): { key: string; fetcher: () => Promise<R> } => {
//     const axiosInstance = (axios as any).create(options);
//     const svc = prepareServicesRef.current;
//     const wrappedServices = Object.entries(svc).reduce(
//       (acc, [key, fn]) => {
//         acc[key as keyof typeof svc] = (...args: any[]) => {
//           const [first, second] = args;
//           return {
//             key: second ? String(second) : `${String(key)}:${JSON.stringify(first)}`,
//             fetcher: () => fn(first)(axiosInstance),
//           };
//         };
//         return acc;
//       },
//       {} as WrappedServices<typeof PrepareServices>,
//     );
//     return selector(wrappedServices);
//   }, []);

//   // La fonction useService retourne désormais le type souhaité
//   function useService<K extends keyof typeof PrepareServices, U extends ServiceOption = ServiceOption>(
//     selector: Services.useService.selector<K>,
//     options?: U,
//   ): SWRResponse<Services.useService.ServiceData<Awaited<Services.Index.returnType<(typeof PrepareServices)[K]>>>, Services.Error.messageReturn> &
//     Services.useService.ExtractMiddlewareFromConfig<U> {
//     const serviceOutput = callServices(selector as unknown as ServiceSelector<any>, options);
//     return useSWR(
//       serviceOutput.key,
//       async () => {
//         try {
//           const response = await serviceOutput.fetcher();
//           return response;
//         } catch (error) {
//           throw new Error();
//         }
//       },
//       options?.cache,
//     ) as SWRResponse<Services.useService.ServiceData<Awaited<Services.Index.returnType<(typeof PrepareServices)[K]>>>, Services.Error.messageReturn> &
//       Services.useService.ExtractMiddlewareFromConfig<U>;
//   }

//   useService(v => v.account({ id: 5 }, 'customKey'));

//   /**
//     Exemple d'appel correct:
//       useService((v) => v.account({ id: 5 }, "key"), { cache: {}, headers: {} });
//   */

//   // ...existing code...
// }
