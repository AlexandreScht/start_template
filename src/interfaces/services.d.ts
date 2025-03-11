import type PrepareServices from '@/services';
import type { AxiosRequestHeaders } from 'axios';
import type { CacheOptions } from 'axios-cache-interceptor';
import type { MutatorOptions } from 'swr';

// Déclare un espace de nom global "Service"
declare namespace Services {
  // Sous-module "Index"
  export interface ResponseType<T> {
    err?: unknown;
    res?: T;
    code?: number | string;
  }

  export type serviceOption = Partial<Cache.option>;

  namespace Cache {
    export type storage = 'redis' | 'ram';
    type params = Partial<{
      key: string;
      enabled: CacheOptions['cachePredicate'] | boolean;
      lifeTime: number;
      storage: storage;
      persist: boolean;
      eTag: CacheOptions['etag'];
      acceptServerConfig: CacheOptions['interpretHeader'];
      ModifiedSince: CacheOptions['ModifiedSince'];
      debug: CacheOptions['debug'];
    }>;
    interface option {
      cache?: params;
      header?: AxiosRequestHeaders;
    }
  }

  namespace Index {
    export type returnType = ReturnType<typeof PrepareServices>;

    export interface WrappedServiceOutput<F, A> {
      key: string;
      service: F;
      arg: A;
    }

    export type WrappedFunctionCharge<A> = (arg: A) => [A, MutatorOptions?];

    export type WrappedServiceFunction<F> = F extends (arg: infer A) => unknown
      ? {
          (arg: A, override?: string): WrappedServiceOutput<F, A>;
          (arg: WrappedFunctionCharge<A>): WrappedServiceOutput<F, WrappedFunctionCharge<A>>;
        }
      : never;

    export type WrappedServices<T> = {
      [K in keyof T]: WrappedServiceFunction<T[K]>;
    };
  }

  namespace Revalidate {
    type OverloadedParamUnion<F extends (...args: any[]) => any> = F extends { (...args: infer P): any } ? P[0] : never;
    type AcceptsFunction<F extends (...args: any[]) => any> = Extract<OverloadedParamUnion<F>, (arg: any) => unknown> extends never ? never : F;
    type ValidatedServiceFunction<F extends (...args: any[]) => any> = AcceptsFunction<F>;
    export type argsType = Index.WrappedServiceOutput<any, Index.WrappedFunctionCharge<any>> | ValidatedServiceFunction<(...args: any[]) => any>;
  }

  // Sous-module "User"
  namespace User {
    // Exemple d'interface pour le profil utilisateur
    export interface Profile {
      id: number;
      name: string;
      email: string;
    }

    // Exemple d'interface pour les identifiants
    export interface Credentials {
      username: string;
      password: string;
    }
  }
}
