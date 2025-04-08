import { createRoutes } from '.';

const clientRoutes = createRoutes({
  pages: {
    home: () => '/dashboard',
    login: () => '/',
  },
});

export default clientRoutes;
