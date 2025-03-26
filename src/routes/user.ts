// import AuthControllerFile from '@/controllers/auth';
// import { activate2FASchema, askCodeSchema, loginSchema, registerSchema, resetPasswordSchema, verify2FASchema } from '@/libs/shemaValidate';
// import auth from '@/middlewares/auth';
// import cookieValues from '@/middlewares/cookie';
// import mw from '@/middlewares/mw';
// import slowDown from '@/middlewares/slowDown';
import config from '@/config';
import UserControllerFile from '@/controllers/user';
import mw from '@/middlewares/mw';
import { Router } from 'express';

export class UserRouter extends UserControllerFile {
  public router = Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/account/:id', mw([this.account]));
  }

  getRouter() {
    return this.router;
  }
}
