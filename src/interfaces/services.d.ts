import type PrepareServices from '@/services';
import type { CacheOptions } from 'axios-cache-interceptor';
import type { MutatorOptions, SWRConfiguration, SWRHook, SWRResponse } from 'swr';

declare namespace Services {
  /* =======================
     Types utilitaires communs
  ========================== */
  export type ParamType<F> = F extends (arg: infer A) => unknown ? A : never;
  export type WrappedFunctionCharge<A> = (arg: A) => [A, string?];
  interface prepareArg {
    headers?: Axios.axiosHeaders;
    cache?: Cache.options & { side: 'client' | 'server' };
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
    fetcher: () => ReturnType<F>;
  }

  // Pour les services utilisés avec useMutation (updater et options de cache)
  export interface UpdatableWrappedServiceOutput<F extends (...args: any[]) => any> extends BaseWrappedServiceOutput {
    updater?: (v: Parameters<F>) => ReturnType<F>;
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
    export type returnType = ReturnType<typeof PrepareServices>;

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

      export type Type<K extends keyof Index.returnType, U extends ServiceOption = unknown> = (
        selector: selector<K>,
        options?: U,
      ) => SWRResponse<ServiceData<Awaited<ReturnType<Index.returnType[K]>>>, Error.messageReturn> & ExtractMiddlewareFromConfig<U>;

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
