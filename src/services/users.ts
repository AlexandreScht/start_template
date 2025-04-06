import type { ApiRequests } from '@/interfaces/clientApi';
import { httpGateway } from '@/middlewares/gateway';
import apiRoutes from '@/router/api';

const {
  api: { test: router },
} = apiRoutes;

export const TestParamsService: ApiRequests.Test.Params = props => async axios => {
  return await httpGateway<ApiRequests.Test.Params>(
    ({ id }) => ({
      // middlewares: mw => [mw.auth, mw.logs, mw.transform]
      middlewares: mw => [mw.logs(), mw.transform((v, { number }) => ({ id: number.increment(v.id, 5) }))],
      validator: schema => schema.userSchema({ id }),
      request: axios => axios.get(router.params([id])),
    }),
    [props, axios],
  );
};
