import type { ApiRequests } from '@/interfaces/clientApi';
import validator from '@/middlewares/validator';
import apiRoutes from '@/router/api';
import { userSchema } from '@/validators/users';

const {
  api: { user: router },
} = apiRoutes;

// export const AccountService: ApiRequests.User.Account =
//   ({ id }) =>
//   async axios => {
//     const { data } = await validator(userSchema, { id }, axios.get(router.account([id])));
//     return data;
//   };

// export const AccountService: ApiRequests.User.Account =
//   ({ id }) =>
//   async axios => {
//     const { data } = await validator({
//       schema: userSchema,
//       payload: { id },
//       axios,
//       request: axios => axios.get(router.account([id])),
//     });
//     return data;
//   };
