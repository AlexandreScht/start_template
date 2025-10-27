import { type Services } from './services';

declare namespace ApiRequests {
  type setRequest<P, R> = P extends undefined
    ? {
        (): (instance: Services.Axios.instance) => Promise<R>;
        (params: P): (instance: Services.Axios.instance) => Promise<R>;
      }
    : (params: P) => (instance: Services.Axios.instance) => Promise<R>;

  namespace Test {
    type Params = setRequest<{ id: number }, { user: string }>;
  }
  namespace Auth {
    type Login = setRequest<{ email: string; password: string }, void>;
  }
  namespace Perf {
    type simple = setRequest<undefined, true>;
  }
}
