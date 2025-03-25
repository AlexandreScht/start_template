import type schemaValidator from '@/validators';
import type { BareFetcher, Key, SWRConfiguration, SWRResponse } from 'swr';
import { type ApiRequests } from './clientApi';
import { type Services } from './services';

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

    export interface HttpGatewayConfig<Req extends ApiRequests.setRequest<any, any> = ApiRequests.setRequest<any, unknown>> {
      validator?: (schemas: typeof schemaValidator) => unknown;
      request: (axios: Services.Axios.instance) => Promise<DataFromRequest<Req>>;
    }
    // export interface HttpGatewayConfig<T, R> {
    //   validator?: (schemas: typeof schemaValidator) => T;
    //   request: (axios: Services.Axios.instance) => R;
    // }
  }
}
