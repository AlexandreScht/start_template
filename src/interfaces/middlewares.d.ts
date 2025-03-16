import type { BareFetcher, Key, SWRConfiguration, SWRResponse } from 'swr';

declare namespace Middlewares {
  namespace swr {
    type mw<Extra> = <Data = any, Error = any>(...args: Parameters<args<Data, Error>>) => ReturnType<args<Data, Error>> & Extra;

    type args<Data = any, Error = any> = (
      key: Key,
      fetcher: BareFetcher<Data> | null,
      config?: SWRConfiguration<Data, Error, BareFetcher<Data>>,
    ) => SWRResponse<Data, Error>;
  }
}
