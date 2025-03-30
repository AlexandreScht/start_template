import { type Services } from './services';

declare namespace ApiRequests {
  type setRequest<P, R> = (params: P) => (instance: Services.Axios.instance) => Promise<R>;

  namespace Test {
    type Params = setRequest<{ id: number }, { user: string }>;
  }
}
