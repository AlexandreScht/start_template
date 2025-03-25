import { type Services } from './services';

declare namespace ApiRequests {
  type setRequest<P, R> = (params: P) => (instance: Services.Axios.instance) => Promise<R>;

  namespace User {
    type Account = setRequest<{ id: number }, { user: string }>;
  }
}
