import type PrepareServices from '@/services';
import type { CacheOptions } from 'axios-cache-interceptor';
import type { MutatorOptions, SWRConfiguration, SWRResponse } from 'swr';

// Déclare un espace de nom global "Service"
declare namespace Services {
  // Sous-module "Index"
  interface ResponseType<T> {
    err?: unknown;
    res?: T;
    code?: number | string;
  }

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

    type WrappedFunctionCharge<A> = (arg: A) => [A, MutatorOptions?];

    type WrappedServiceFunction<F> = F extends (arg: infer A) => unknown
      ? {
          (arg: A, override?: string): WrappedServiceOutput<F>;
          (arg: WrappedFunctionCharge<A>): WrappedServiceOutput<F>;
        }
      : never;

    type WrappedServices<T extends { [K in keyof T]: (...args: any[]) => any }> = {
      [K in keyof T]: WrappedServiceFunction<T[K]>;
    };
  }

  namespace Revalidate {
    type OverloadedParamUnion<F extends (...args: any[]) => any> = F extends { (...args: infer P): any } ? P[0] : never;
    type AcceptsFunction<F extends (...args: any[]) => any> = Extract<OverloadedParamUnion<F>, (arg: any) => unknown> extends never ? never : F;
    type ValidatedServiceFunction<F extends (...args: any[]) => any> = AcceptsFunction<F>;
    type argsType = Index.WrappedServiceOutput<any> | ValidatedServiceFunction<(...args: any[]) => any>;
  }

  namespace Providers {
    type serviceWrapper = <K extends keyof Index.returnType>(
      selector: (s: Index.WrappedServices<Index.returnType>) => ReturnType<Index.WrappedServices<Index.returnType>[K]>,
      options?: useService.ServiceOption,
    ) => ReturnType<Index.WrappedServices<Index.returnType>[K]>;

    interface ServiceContextProvider {
      services: serviceWrapper;
    }

    namespace useService {
      type ServiceData<T> = T extends ResponseType<infer U> ? U : T;

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

      type Type<K extends keyof Index.returnType> = (
        selector: (services: CleanWrappedServices<Index.returnType>) => Index.WrappedServiceOutput<Index.returnType[K]>,
        options?: ServiceOption,
      ) => SWRResponse<ServiceData<Awaited<ReturnType<Index.returnType[K]>>>, any>;
    }
  }

  //* service functions
  namespace User {
    // Exemple d'interface pour le profil utilisateur
    interface Profile {
      id: number;
      name: string;
      email: string;
    }

    // Exemple d'interface pour les identifiants
    interface Credentials {
      username: string;
      password: string;
    }
  }
}
