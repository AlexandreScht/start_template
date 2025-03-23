import type { ApiRequests } from '@/interfaces/clientApi';
import validator from '@/middlewares/validator';
import apiRoutes from '@/router/api';
import { userSchema } from '@/validators/users';

const {
  api: { user: router },
} = apiRoutes;

export const AccountService: ApiRequests.User.Account =
  ({ id }) =>
  async axios => {
    validator(userSchema, { id });
    const { data } = await axios.get(router.account([id]));
    return data;
  };
