import { ParamsType } from '@/interfaces/routes';
import { createRoutes, createRouteWithParams } from '.';

const apiRoutes = createRoutes({
  api: {
    user: {
      account: (params: ParamsType<unknown>) => createRouteWithParams('/account', params),
    },
  },
});

export default apiRoutes;
