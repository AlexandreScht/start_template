import { Routes } from '@interfaces/routes';
// import { AuthRouter } from '@routes/auth';
import { Router } from 'express';
import { AccountRouter } from './account';
import { MarginRouter } from './margin';
import { SpotRouter } from './spot';

export default class ApiRouter implements Routes {
  public router: Router;

  constructor() {
    this.router = Router();
  }

  protected initializeRoutes() {
    // this.router.use('/auth', new AuthRouter().getRouter());
    this.router.use('/account', new AccountRouter().getRouter());
    this.router.use('/spot', new SpotRouter().getRouter());
    // this.router.use('/spot', new ScrappingRouter().getRouter());
    this.router.use('/margin', new MarginRouter().getRouter());
    // this.router.use('/news', new ScrappingRouter().getRouter());
  }
}
