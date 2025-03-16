import { ServiceError } from '@/exceptions/errors';
import type { ApiRequests } from '@/interfaces/clientApi';
import validator from '@/middlewares/validator';
import apiRoutes from '@/router/api';
import { userSchema } from '@/validators/users';

const {
  api: { user: router },
} = apiRoutes;

export const AccountService: ApiRequests.User.Account =
  ({ axios }) =>
  async ({ id }) => {
    console.log(typeof id);
    console.log(id);
    // throw new Error("I'm an error");

    // validator(userSchema, { id });

    // const { data } = await axios.get(router.account([id]));
    // return data;
    return { user: 'Rodrigo' };
  };
