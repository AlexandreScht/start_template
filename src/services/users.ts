import { getErrorMessage } from '@/exceptions/errorMessage';
import type { ResponseType } from '@/interfaces/routes';
import validator from '@/middlewares/validator';
import apiRoutes from '@/router/api';
import { userSchema } from '@/validators/users';
import type { AxiosInstance } from 'axios';

const {
  api: { user: router },
} = apiRoutes;

export const AccountService =
  ({ axios }: { axios: AxiosInstance }) =>
  async ({ id }: { id: number }): Promise<ResponseType<{ user: string }>> => {
    try {
      console.log(typeof id);
      console.log(id);

      // validator(userSchema, { id });

      const { data } = await axios.get(router.account([id]));
      return data;
    } catch (err: unknown) {
      return { error: getErrorMessage(err) };
    }
  };
