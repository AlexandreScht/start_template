import { createRoutes } from '.';

const clientRoutes = createRoutes({
  home: () => '/dashboard',
  login: () => '/',
  unauthorized: () => '/unauthorized',
  notFound: () => '/not-found',
});

export default clientRoutes;
