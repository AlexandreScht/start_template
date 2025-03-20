import type { AxiosInstance } from 'axios';

declare namespace ApiRequests {
  type setRequest<P, R> = (params: P) => (instance: { axios: AxiosInstance }) => Promise<R>;

  namespace User {
    type Account = setRequest<{ id: number }, { user: string }>;
  }
}
