// import AuthControllerFile from '@/controllers/auth';
// import { activate2FASchema, askCodeSchema, loginSchema, registerSchema, resetPasswordSchema, verify2FASchema } from '@/libs/shemaValidate';
// import auth from '@/middlewares/auth';
// import cookieValues from '@/middlewares/cookie';
// import mw from '@/middlewares/mw';
// import slowDown from '@/middlewares/slowDown';
// import Validator from '@/middlewares/validator';
// import { stringValidator } from '@/utils/zodValidate';
import { Router } from 'express';
import { z } from 'zod';

export class AuthRouter extends AuthControllerFile {
  public router = Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // this.router.post('/register', mw([Validator({ body: registerSchema }), this.register]));
    // this.router.post('/login', mw([Validator({ body: loginSchema }), slowDown({ onError: 750 }), this.login]));
  }

  getRouter() {
    return this.router;
  }
}
