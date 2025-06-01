import { type ApiRequests } from '@/interfaces/clientApi';
import { httpGateway } from '@/middlewares/gateway';
import apiRoutes from '@/router/api';
const {
  api: { perf: router },
} = apiRoutes;

export const simple: ApiRequests.Perf.simple = () => axios => {
  return httpGateway<ApiRequests.Perf.simple>(
    () => ({
      request: axios => axios.get(router.simple()),
    }),
    [axios],
  );
};
