import type PrepareServices from '@/services';
import { type AxiosInstance, type AxiosResponse } from 'axios';
import type { CacheOptions, CacheRequestConfig } from 'axios-cache-interceptor';
import type { MutatorOptions, SWRConfiguration, SWRHook } from 'swr';

export namespace Services {
  export type ParamType<F> = F extends (arg: infer A) => unknown ? A : never;
  export type ReturnParamType<F> = F extends (arg: any) => Awaited<(v: any) => Promise<infer A>> ? A : never;
  export namespace Index {
    export type returnType<F> = F extends (params: any) => (instance: Axios.instance) => Promise<infer R> ? R : never;
  }

  export namespace serverService {
    export type dateRes<R> = R;

    export interface response<R> {
      data?: dateRes<R>;
      error?: Error.messageReturn;
    }

    export type SimpleWrappedServiceFunction<P, R> = (params: P) => (axios: Axios.instance) => Promise<R>;

    export type WrappedServerServices<T extends Record<string, any>> = {
      [K in keyof T]: T[K] extends (params: infer P) => (instance: Axios.instance) => Promise<infer R>
        ? SimpleWrappedServiceFunction<P, R>
        : never;
    };

    export type ServerServiceSelector<R> = (
      services: WrappedServerServices<typeof PrepareServices>,
    ) => (axios: Axios.instance) => Promise<dateRes<R>>;
  }

  export namespace useService {
    export type ServiceData<T> = T;

    export type ExtractMiddlewareFromConfig<P> = P extends {
      cache: { use: infer U };
    }
      ? U extends Array<(hook: SWRHook) => infer Fn>
        ? Fn extends (...args: any[]) => infer R
          ? R
          : unknown
        : unknown
      : unknown;
  }
  export namespace useMutation {
    export type MutationDefinition = {
      key: string;
      updater?: (v: any) => any;
      cacheOptions?: Config.MutationOptions;
    };

    export type MutationService<F> = F extends (arg: infer A) => unknown
      ? {
          (arg: Config.MutationOptions): unknown;
          (arg: (v: ParamType<F>) => [ParamType<F>, string?], options?: Config.MutationOptions): unknown;
        }
      : never;

    export type MutationServices<S extends Record<string, (...args: any[]) => any>> = {
      [K in keyof S]: MutationService<S[K]>;
    };
  }

  export namespace serverRevalidate {
    export type MutationService<F> = F extends (arg: infer A) => unknown
      ? {
          (arg: ParamType<F>, update?: ((v: ReturnParamType<F>) => ReturnParamType<F>) | ReturnParamType<F>): unknown;
        }
      : never;

    export type WrappedServiceFunction<P, R> = (params: P, updater?: P) => () => Promise<R>;

    export type WrappedServices<T extends Record<string, any>> = {
      [K in keyof T]: T[K] extends (params: infer P) => (instance: Axios.instance) => Promise<infer R>
        ? WrappedServiceFunction<P, R>
        : never;
    };

    export type MutationServices<S extends Record<string, (...args: any[]) => any>> = {
      [K in keyof S]: MutationService<S[K]>;
    };
  }

  export namespace Config {
    export type ServiceOption = {
      headers?: Axios.axiosHeaders;
      cache?: Partial<SWRConfiguration>;
      isDisabled?: boolean;
    };

    export type ServerServiceOption = {
      headers?: Axios.axiosHeaders;
      cache?: serverCache;
    };

    export type globalMutationOptions = MutatorOptions & {
      onMerge?: 'combined' | 'none' | 'force';
    };

    export type MutationOptions = MutatorOptions & {
      allowedMerge?: boolean;
      allowedMutation?: boolean;
    };
    export interface serverCache
      extends Partial<Omit<CacheOptions, 'ttl' | 'interpretHeader' | 'persist' | 'cachePredicate'>> {
      lifeTime?: number | ((request: CacheRequestConfig) => number | Promise<number>);
      persist?: boolean;
      enabled?: CacheOptions['cachePredicate'];
      serverConfig?: CacheOptions['interpretHeader'];
    }
  }

  export namespace Axios {
    export interface AxiosRevalidateResponse<T = any, D = any> extends AxiosResponse<T, D> {
      xTags?: string[] | string;
    }
    export interface axiosApi {
      headers?: axiosHeaders;
      cache?: Partial<SWRConfiguration> | Partial<CacheOptions>;
      xTag?: string;
      side: 'server' | 'client';
    }

    export type instance = AxiosInstance & { revalidate?: boolean };
    export interface revalidateInstance extends instance {
      xTags?: string[] | string;
      revalidateArgs?: unknown | ((v?: unknown) => unknown);
    }
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
    export type CommonRequestHeadersList =
      | 'Accept'
      | 'Content-Length'
      | 'Cache-Control'
      | 'User-Agent'
      | 'Content-Encoding'
      | 'Authorization';
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

  export namespace Provider {
    export type WrappedServiceFunction<P, R> = (
      params: P,
      override?: string,
    ) => {
      key: string;
      fetcher: (axiosInstance: Axios.instance) => Promise<R>;
    };

    export type WrappedServices<T extends Record<string, any>> = {
      [K in keyof T]: T[K] extends (params: infer P) => (instance: Axios.instance) => Promise<infer R>
        ? WrappedServiceFunction<P, R>
        : never;
    };

    export type ServiceSelector<R> = (services: WrappedServices<typeof PrepareServices>) => {
      key: string;
      fetcher: (axiosInstance: Axios.instance) => Promise<R>;
    };

    export interface returnProvider {
      callServices: WrappedServices<typeof PrepareServices>;
      mutationServices: Services.useMutation.MutationServices<typeof PrepareServices>;
    }
  }

  export namespace Error {
    export interface messageReturn {
      err: string;
      code: string;
    }
  }
}
