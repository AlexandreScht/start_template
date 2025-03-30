// import AuthControllerFile from '@/controllers/auth';
// import { activate2FASchema, askCodeSchema, loginSchema, registerSchema, resetPasswordSchema, verify2FASchema } from '@/libs/shemaValidate';
// import auth from '@/middlewares/auth';
// import cookieValues from '@/middlewares/cookie';
// import mw from '@/middlewares/mw';
// import slowDown from '@/middlewares/slowDown';
import { default as TestControllerFile } from '@/controllers/user';
import mw from '@/middlewares/mw';
import { Router } from 'express';

export class TestRouter extends TestControllerFile {
  public router = Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/params/:id', mw([this.params_module]));
  }

  getRouter() {
    return this.router;
  }
}
