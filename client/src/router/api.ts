import { createRoutes } from '.';

const apiRoutes = createRoutes({
  api: {
    perf: {
      simple: () => '/simple',
    },
    auth: {
      login: () => '/login',
    },
  },
});

export default apiRoutes;
