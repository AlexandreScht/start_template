import type PrepareServices from '@/services';
import type { CacheOptions } from 'axios-cache-interceptor';
import type { MutatorOptions } from 'swr';

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
    type storage = 'redis' | 'ram';
    type options = Partial<{
      key: string;
      enabled: CacheOptions['cachePredicate'] | boolean;
      lifeTime: CacheOptions['ttl'];
      storage: storage;
      persist: boolean;
      etag: CacheOptions['etag'];
      serverConfig: boolean | CacheOptions['interpretHeader'];
      ModifiedSince: CacheOptions['ModifiedSince'];
      debug: CacheOptions['debug'];
    }>;
  }

  namespace Index {
    type returnType = ReturnType<typeof PrepareServices>;

    interface WrappedServiceOutput<F, A> {
      key: string;
      service: F;
      arg: A;
    }

    type WrappedFunctionCharge<A> = (arg: A) => [A, MutatorOptions?];

    type WrappedServiceFunction<F> = F extends (arg: infer A) => unknown
      ? {
          (arg: A, override?: string): WrappedServiceOutput<F, A>;
          (arg: WrappedFunctionCharge<A>): WrappedServiceOutput<F, WrappedFunctionCharge<A>>;
        }
      : never;

    type WrappedServices<T> = {
      [K in keyof T]: WrappedServiceFunction<T[K]>;
    };
  }

  namespace Revalidate {
    type OverloadedParamUnion<F extends (...args: any[]) => any> = F extends { (...args: infer P): any } ? P[0] : never;
    type AcceptsFunction<F extends (...args: any[]) => any> = Extract<OverloadedParamUnion<F>, (arg: any) => unknown> extends never ? never : F;
    type ValidatedServiceFunction<F extends (...args: any[]) => any> = AcceptsFunction<F>;
    type argsType = Index.WrappedServiceOutput<any, Index.WrappedFunctionCharge<any>> | ValidatedServiceFunction<(...args: any[]) => any>;
  }

  // Sous-module "User"
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
