import type { AxiosInstance } from 'axios';

declare namespace ApiRequests {
  type setRequest<P, R> = (params: P) => (instance: AxiosInstance) => Promise<R>;

  namespace User {
    type Account = setRequest<{ id: number }, { user: string }>;
  }
}
