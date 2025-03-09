import AccountControllerFile from '@/controllers/account';
import MarginControllerFile from '@/controllers/margin';
import mw from '@/middlewares/mw';
import Validator from '@/middlewares/validator';
import { assetSchema } from '@/validators.ts/account';
import { boughtSchema, repaySchema } from '@/validators.ts/margin';
import { Router } from 'express';

export class MarginRouter extends MarginControllerFile {
  public router = Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post('/order', mw([Validator({ body: boughtSchema }), this.isolatedMargin]));
    this.router.post('/repay', mw([Validator({ body: repaySchema }), this.repayToken]));
    this.router.get('/risk', mw([Validator({ body: assetSchema }), this.marginRisk]));
    // this.router.get('/ballance', mw([cookies({ names: config.security.cookie.COOKIE_NAME }), this.ballance]));
  }

  getRouter() {
    return this.router;
  }
}
