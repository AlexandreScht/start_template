import type PrepareServices from '@/services';
import { type AxiosInstance } from 'axios';
import type { CacheOptions } from 'axios-cache-interceptor';
import type { MutatorOptions, SWRConfiguration, SWRHook, SWRResponse } from 'swr';

export namespace Services {
  export namespace Index {
    export type returnType<F> = F extends (params: any) => (instance: AxiosInstance) => Promise<infer R> ? R : never;
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

    export type useServiceResponse<K, U extends Config.ServiceOption = Config.ServiceOption> = SWRResponse<
      ServiceData<Awaited<Index.returnType<(typeof PrepareServices)[K]>>>,
      Error.messageReturn
    > &
      ExtractMiddlewareFromConfig<U>;
  }
  export namespace useMutation {
    export type MutationDefinition = {
      key: string;
      updater?: (v: any) => any;
      cacheOptions?: Config.MutationOptions;
    };

    export type ParamType<F> = F extends (arg: infer A) => unknown ? A : never;

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

  export namespace Config {
    export type ServiceOption = {
      headers?: Axios.AxiosHeaderValue;
      cache?: Partial<SWRConfiguration>;
      isDisabled?: boolean;
    };

    export type globalMutationOptions = MutatorOptions & {
      onMerge?: 'combined' | 'none' | 'force';
    };

    export type MutationOptions = MutatorOptions & {
      allowedMerge?: boolean;
      allowedMutation?: boolean;
    };
  }

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

  export namespace Provider {
    export type WrappedServiceFunction<P, R> = (
      params: P,
      override?: string,
    ) => {
      key: string;
      fetcher: (axiosInstance: AxiosInstance) => Promise<R>;
    };

    export type WrappedServices<T extends Record<string, any>> = {
      [K in keyof T]: T[K] extends (params: infer P) => (instance: AxiosInstance) => Promise<infer R> ? WrappedServiceFunction<P, R> : never;
    };

    export type ServiceSelector<R> = (services: WrappedServices<typeof PrepareServices>) => {
      key: string;
      fetcher: (axiosInstance: AxiosInstance) => Promise<R>;
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
