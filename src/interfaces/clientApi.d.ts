import type { AxiosInstance } from 'axios';

declare namespace ApiRequests {
  type setRequest<P, R> = (instance: { axios: AxiosInstance }) => (params: P) => Promise<R>;

  namespace User {
    type Account = setRequest<{ id: number }, { user: string }>;
  }
}
