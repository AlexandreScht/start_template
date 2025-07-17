import type { ApiRequests } from '@/interfaces/clientApi';
import { httpGateway } from '@/middlewares/gateway';
import apiRoutes from '@/router/api';

const {
  api: { auth: router },
} = apiRoutes;

export const login: ApiRequests.Auth.Login =
  (...props) =>
  async axios => {
    return await httpGateway<ApiRequests.Auth.Login>(
      ({ email, password }) => ({
        validator: schema => schema.loginSchema({ email, password }),
        request: axios => axios.post(router.login(), { email, password }),
        middlewares: mw => [mw.limit('auth', email)],
      }),
      [axios, props],
    );
  };
