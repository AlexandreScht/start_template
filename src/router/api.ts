import { type ParamsType, type QueryType } from '@/interfaces/routes';
import { createRoutes, createRouteWithParams, createRouteWithQueries } from '.';

const apiRoutes = createRoutes({
  api: {
    test: {
      query: (query: QueryType<unknown>) => createRouteWithQueries('/query', query),
      params: (params: ParamsType<unknown>) => createRouteWithParams('/params', params),
      body: () => '/body',
      // mix params et query
      // mix params et body
      // mix query et body
      // mix all
    },
  },
});

export default apiRoutes;
