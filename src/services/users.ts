import type { ApiRequests } from '@/interfaces/clientApi';
import { httpGateway } from '@/middlewares/gateway';
import apiRoutes from '@/router/api';

const {
  api: { test: router },
} = apiRoutes;

export const TestParamsService: ApiRequests.Test.Params =
  (...props) =>
  async axios => {
    return await httpGateway<ApiRequests.Test.Params>(
      ({ id }) => ({
        middlewares: mw => [mw.logs()],
        validator: schema => schema.userSchema({ id }),
        request: axios => axios.get(router.params([id])),
      }),
      [axios, props],
    );
  };
