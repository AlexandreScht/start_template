import type { ApiRequests } from '@/interfaces/clientApi';
import { httpGateway } from '@/middlewares/gateway';
import apiRoutes from '@/router/api';

const {
  api: { test: router },
} = apiRoutes;

export const TestParamsService: ApiRequests.Test.Params =
  ({ id }) =>
  async axios => {
    const { data } = await httpGateway<ApiRequests.Test.Params>(
      {
        validator: schema => schema.userSchema({ id }),
        request: axios => axios.get(router.params([id])),
      },
      [axios],
    );
    return data;
  };
