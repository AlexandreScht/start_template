import apiRoutes from '@/router/api';
import env from '.';

const {
  api: { auth: router },
} = apiRoutes;

const oAuthMethods = {
  google: `${env.BACKEND}${router.google()}`,
};

export default oAuthMethods;
