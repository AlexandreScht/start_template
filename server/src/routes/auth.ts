// import AuthControllerFile from '@/controllers/auth';
// import { activate2FASchema, askCodeSchema, loginSchema, registerSchema, resetPasswordSchema, verify2FASchema } from '@/libs/shemaValidate';
// import auth from '@/middlewares/auth';
// import cookieValues from '@/middlewares/cookie';
// import mw from '@/middlewares/mw';
// import slowDown from '@/middlewares/slowDown';
// import Validator from '@/middlewares/validator';
// import { stringValidator } from '@/utils/zodValidate';
import AuthControllerFile from '@/controllers/auth';
import mw from '@/middlewares/mw';
import Validator from '@/middlewares/validator';
import { Router, type Router as ExpressRouter } from 'express';
import passport from 'passport';

export class AuthRouter extends AuthControllerFile {
  public router: ExpressRouter = Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: true }));
    // this.router.post(
    //   '/login',
    //   mw([Validator({ body: loginSchema }), captchaMiddleWare(), slowDown({ onError: 750 }), this.login]),
    // );
    // this.router.post('/register', mw([Validator({ body: registerSchema }), captchaMiddleWare(), this.register]));
    // this.router.get('/askCode', mw([cookies({ names: 'access_cookie', acceptError: true }), this.askCode]));
    // this.router.patch(
    //   '/reset-password',
    //   mw([
    //     cookies({ names: 'reset_access' }),
    //     Validator({ body: resetPasswordSchema, token: stringValidator }),
    //     this.resetPassword,
    //   ]),
    // );
    // this.router.patch(
    //   '/reset-password/:email',
    //   mw([Validator({ params: z.object({ email: stringValidator }) }), this.askResetPassword]),
    // );
    // this.router.patch(
    //   '/validate-account/:code',
    //   mw([
    //     Validator({ params: askCodeSchema }),
    //     cookies({ names: 'access_cookie', acceptError: true }),
    //     this.validateAccount,
    //   ]),
    // );
    // this.router.post('/register', mw([Validator({ body: registerSchema }), this.register]));
  }

  getRouter() {
    return this.router;
  }
}
