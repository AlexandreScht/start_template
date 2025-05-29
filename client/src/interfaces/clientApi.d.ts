import { type Services } from './services';
import { type User } from './user';

declare namespace ApiRequests {
  type setRequest<P, R> = (
    params: P,
    revalidateArgs?: R | ((v: R) => R),
  ) => (instance: Services.Axios.instance) => Promise<R>;

  namespace Test {
    type Params = setRequest<{ id: number }, { user: string }>;
  }
  namespace Auth {
    type Login = setRequest<{ email: string; password: string; confirmPassword: string }, { payload: User.session }>;
    type oAuth = setRequest<{ at_hash: string; id_token: string }, { payload: User.session }>;
  }
}
