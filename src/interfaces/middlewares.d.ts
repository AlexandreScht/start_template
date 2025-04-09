import { type defaultTransformers } from '@/middlewares/transform';
import type schemaValidator from '@/validators';
import type { BareFetcher, Key, SWRConfiguration, SWRResponse } from 'swr';
import { type ApiRequests } from './clientApi';
import { type Services } from './services';
import { type User } from './user';

declare namespace Middlewares {
  namespace swr {
    type mw<Extra> = <Data = any, Error = any>(...args: Parameters<args<Data, Error>>) => ReturnType<args<Data, Error>> & Extra;

    type args<Data = any, Error = any> = (
      key: Key,
      fetcher: BareFetcher<Data> | null,
      config?: SWRConfiguration<Data, Error, BareFetcher<Data>>,
    ) => SWRResponse<Data, Error>;
  }

  namespace httpGateway {
    type DataFromRequest<T> = T extends ApiRequests.setRequest<any, infer R> ? R : unknown;
    type RequestDataType<T> = T extends ApiRequests.setRequest<infer R, any> ? R : unknown;

    type allowedLevel = Array<'info' | 'warn' | 'error'>;

    export type MiddlewaresSet<Prop> = {
      logs: (levels?: allowedLevel) => (data: Prop) => void;
      auth: (role?: User.role | Array<User.role>) => (data: Prop) => void;
      transform: (fn: (data: Prop, transformers: typeof defaultTransformers) => Prop) => (data: Prop) => void;
    };

    export interface HttpGatewayConfig<Req extends ApiRequests.setRequest<any, any> = ApiRequests.setRequest<any, unknown>> {
      middlewares?: (mw: MiddlewaresSet<RequestDataType<Req>>) => Array<(data: RequestDataType<Req>) => void>;
      validator?: (schemas: typeof schemaValidator) => unknown;
      request: (
        axios: Services.Axios.instance,
      ) => Promise<DataFromRequest<Req>> | [Promise<DataFromRequest<Req>>, (schemas: typeof schemaValidator) => unknown];
    }
    export type deps<P> = [
      Services.Axios.instance,
      [params: RequestDataType<P>, revalidateArgs?: (v: RequestDataType<P>) => RequestDataType<P> | RequestDataType<P>],
    ];
  }
}
