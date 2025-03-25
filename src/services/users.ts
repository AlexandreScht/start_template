import type { ApiRequests } from '@/interfaces/clientApi';
import { httpGateway } from '@/middlewares/gateway';
import apiRoutes from '@/router/api';

const {
  api: { user: router },
} = apiRoutes;

export const AccountService: ApiRequests.User.Account =
  ({ id }) =>
  async axios => {
    const { data } = await httpGateway<ApiRequests.User.Account>(
      {
        validator: schema => schema.userSchema({ id }),
        request: axios => axios.get(router.account([id])),
      },
      [axios],
    );
    return data;
  };
