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
      ({ email, password, confirmPassword }) => ({
        validator: schema => schema.loginSchema({ email, password, confirmPassword }),
        request: axios => axios.post(router.login(), { email, password }),
      }),
      [axios, props],
    );
  };

export const oAuth: ApiRequests.Auth.oAuth =
  (...props) =>
  async axios => {
    return await httpGateway<ApiRequests.Auth.oAuth>(
      ({ at_hash, id_token }) => ({
        validator: schema => schema.loginSchema({ at_hash, id_token }),
        request: axios => axios.post(router.login(), { at_hash, id_token }),
      }),
      [axios, props],
    );
  };
