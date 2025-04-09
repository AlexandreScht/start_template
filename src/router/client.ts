import { createRoutes } from '.';

const clientRoutes = createRoutes({
  home: () => '/dashboard',
  login: () => '/',
});

export default clientRoutes;
