import { createRoutes } from '.';

const clientRoutes = createRoutes({
  pages: {
    home: () => '/dashboard',
  },
});

export default clientRoutes;
