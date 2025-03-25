import type { ApiRequests } from '@/interfaces/clientApi';
import { type Services } from '@/interfaces/services';
import { httpGateway } from '@/middlewares/gateway';
import apiRoutes from '@/router/api';
import type schemaValidator from '@/validators';

const {
  api: { user: router },
} = apiRoutes;

export const AccountService: ApiRequests.User.Account =
  ({ id }) =>
  async axios => {
    const { data } = await httpGateway<ApiRequests.User.Account>(
      {
        validator: (schema: typeof schemaValidator) => schema.userSchema({ id }),
        request: (axios: Services.Axios.instance) => axios.get(router.account([id])),
      },
      [axios],
    );
    return data;
  };
