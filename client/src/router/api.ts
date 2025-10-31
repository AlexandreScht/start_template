import { createRoutes } from '.';

const apiRoutes = createRoutes({
  api: {
    test: {
      simple: () => '/simple',
    },
    auth: {
      login: () => '/login',
      google: () => '/google',
    },
    user: {
      isAdmin: () => '/is-admin',
    },
  },
});

export default apiRoutes;
