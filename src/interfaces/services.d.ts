import type PrepareServices from '@/services';
import type { CacheOptions } from 'axios-cache-interceptor';
import type { MutatorOptions, SWRConfiguration, SWRHook, SWRResponse } from 'swr';

// Déclare un espace de nom global "Service"
declare namespace Services {
  // Sous-module "Index

  interface headerOption {
    cache?: Cache.options;
    headers?: Axios.axiosHeaders;
    side?: 'client' | 'server';
  }

  interface ServiceServerOption {
    headers?: Axios.axiosHeaders;
    cache?: Cache.serverOption;
  }

  namespace Axios {
    interface Cookie {
      name: string;
      value: string;
      path?: string;
      domain?: string;
      secure: boolean;
      sameSite?: 'strict';
      httpOnly: boolean;
    }
    interface SetCookie {
      name: string;
      value: unknown;
    }

    type CommonRequestHeadersList = 'Accept' | 'Content-Length' | 'User-Agent' | 'Content-Encoding' | 'Authorization';

    export type AxiosHeaderValue = string | string[] | number | boolean | null;
    interface RawAxiosHeaders {
      [key: string]: AxiosHeaderValue;
    }
    type axiosHeaders = Partial<
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

  namespace Cache {
    type serverOption = Partial<{
      key: string;
      enabled?: CacheOptions['cachePredicate'] | boolean;
      lifeTime?: CacheOptions['ttl'];
      persist?: boolean;
      etag?: CacheOptions['etag'];
      serverConfig?: boolean | CacheOptions['interpretHeader'];
      ModifiedSince?: CacheOptions['ModifiedSince'];
      debug?: CacheOptions['debug'];
    }>;

    type clientOption = Partial<SWRConfiguration>;

    type options = serverOption | clientOption;
  }

  namespace Index {
    type returnType = ReturnType<typeof PrepareServices>;

    interface WrappedServiceOutput<F extends (...args: any[]) => any> {
      key: string;
      fetcher: () => ReturnType<F>;
    }

    type WrappedFunctionCharge<A> = (arg: A) => [A, string?];

    type ParamType<F> = F extends (arg: infer A) => unknown ? A : never;

    type WrappedServiceFunction<F> = F extends (arg: infer A) => unknown
      ? {
          (arg: ParamType<F>, override?: string): WrappedServiceOutput<F>;
          (arg: WrappedFunctionCharge<A>, options?: MutatorOptions & { isValid?: boolean }): WrappedServiceOutput<F>;
        }
      : never;

    type WrappedServices<T extends { [K in keyof T]: (...args: any[]) => any }> = {
      [K in keyof T]: WrappedServiceFunction<T[K]>;
    };
  }

  namespace Wrap {
    interface WrappedServiceOutput<F extends (...args: any[]) => any> {
      key: string;
      updater?: (v: Parameters<F>) => ReturnType<F>;
      cacheOptions?: Providers.useService.mutateOption;
    }

    interface ExtendedWrappedOutput extends Services.Wrap.WrappedServiceOutput<any> {
      updater?: (currentCache: any) => [object?, string?];
      cacheOptions?: Providers.useService.mutateOption;
    }

    type WrappedFunctionCharge<A> = (arg: A) => [A, string?];

    type ParamType<F> = F extends (arg: infer A) => unknown ? A : never;

    type WrappedServiceFunction<F> = F extends (arg: infer A) => unknown
      ? {
          (arg: ParamType<F>, override?: string): WrappedServiceOutput<F>;
          (arg: WrappedFunctionCharge<A>, options?: MutatorOptions & { isValid?: boolean }): WrappedServiceOutput<F>;
        }
      : never;

    type WrappedServices<T extends { [K in keyof T]: (...args: any[]) => any }> = {
      [K in keyof T]: WrappedServiceFunction<T[K]>;
    };
  }

  namespace Providers {
    type serviceWrapper = <K extends keyof Index.returnType>(
      selector: (s: Index.WrappedServices<Index.returnType>) => ReturnType<Index.WrappedServices<Index.returnType>[K]>,
      options?: useService.ServiceOption,
    ) => ReturnType<Index.WrappedServices<Index.returnType>[K]>;

    interface ServiceContextProvider {
      callServices: serviceWrapper;
      wrappedServices: Wrap.WrappedServices<Services.Index.returnType>;
    }

    namespace useMutation {
      type returnType = ReturnType<typeof PrepareServices>;

      interface WrappedServiceOutput<F extends (...args: any[]) => any> {
        key: string;
        arg: Parameters<F>;
      }

      type WrappedFunctionCharge<A> = (arg: A) => [A, string?];

      type ParamType<F> = F extends (arg: infer A) => unknown ? A : never;

      type mutateOption = MutatorOptions & { isValid?: boolean };

      type WrappedServiceFunction<F> = F extends (arg: infer A) => unknown
        ? {
            <T extends ParamType<F> = ParamType<F>>(arg: (v: T) => [T, string?], options?: mutateOption): WrappedServiceOutput<F>;
            (arg: mutateOption): WrappedServiceOutput<F>;
          }
        : never;

      type WrappedServices<T extends { [K in keyof T]: (...args: any[]) => any }> = {
        [K in keyof T]: WrappedServiceFunction<T[K]>;
      };

      type globalMutationOptions = MutatorOptions & {
        merge?: 'combined' | 'none' | 'force';
      };

      type CleanWrappedServices<T extends { [K in keyof T]: (...args: any[]) => any }> = {
        [K in keyof T]: WrappedServiceFunction<T[K]>;
      };

      type selector = (
        services: CleanWrappedServices<returnType>,
      ) => Array<WrappedServiceOutput<returnType[keyof returnType]> | WrappedServiceFunction<returnType[keyof returnType]>>;
    }

    namespace useService {
      type ServiceData<T> = T extends infer U ? U : T;

      type RemoveChargeOverload<F> = F extends {
        (arg: infer A, override?: string): infer R;
        (arg: any): any;
      }
        ? (arg: A, override?: string) => R
        : never;

      type CleanWrappedServices<T extends { [K in keyof T]: (...args: any[]) => any }> = {
        [K in keyof T]: RemoveChargeOverload<Index.WrappedServiceFunction<T[K]>>;
      };

      interface ServiceOption {
        headers?: Axios.axiosHeaders;
        cache?: Cache.clientOption;
      }

      type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

      type ExtractMiddlewareFromConfig<P> = P extends { cache: { use: infer U } }
        ? U extends Array<(hook: SWRHook) => infer Fn>
          ? UnionToIntersection<Fn extends (...args: any[]) => infer R ? R : never>
          : NonNullable<unknown>
        : NonNullable<unknown>;

      type selector<K extends keyof Index.returnType> = (
        services: CleanWrappedServices<Index.returnType>,
      ) => Index.WrappedServiceOutput<Index.returnType[K]>;

      type Type<K extends keyof Index.returnType, U extends ServiceOption = NonNullable<unknown>> = (
        selector: selector<K>,
        options?: U,
      ) => SWRResponse<ServiceData<Awaited<ReturnType<Index.returnType[K]>>>, Error.messageReturn> & ExtractMiddlewareFromConfig<U>;
    }
  }

  //* service functions
  namespace Error {
    interface messageReturn {
      err: string;
      code: string;
    }
  }
}
