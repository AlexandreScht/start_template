// import AuthControllerFile from '@/controllers/auth';
// import { activate2FASchema, askCodeSchema, loginSchema, registerSchema, resetPasswordSchema, verify2FASchema } from '@/libs/shemaValidate';
// import auth from '@/middlewares/auth';
// import cookieValues from '@/middlewares/cookie';
// import mw from '@/middlewares/mw';
// import slowDown from '@/middlewares/slowDown';
import config from '@/config';
import AccountControllerFile from '@/controllers/account';
import cookies from '@/middlewares/cookies';
import mw from '@/middlewares/mw';
import Validator from '@/middlewares/validator';
import { assetSchema } from '@/validators.ts/account';
// import { stringValidator } from '@/utils/zodValidate';
import { Router } from 'express';

export class AccountRouter extends AccountControllerFile {
  public router = Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/ballance', mw([this.ballance]));
    this.router.get('/margin-asset', mw([Validator({ params: assetSchema }), this.marginAsset]));
  }

  getRouter() {
    return this.router;
  }
}
