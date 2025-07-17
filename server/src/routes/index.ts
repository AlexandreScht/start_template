import { type Routes } from '@interfaces/routes';
// import { AuthRouter } from '@routes/auth';
import { Router } from 'express';
import { AuthRouter } from './auth';
import CallbackRouter from './callback';
import { PerfRouter } from './performance';

export default class ApiRouter implements Routes {
  public router: Router;

  constructor() {
    this.router = Router();
  }

  protected initializeRoutes() {
    this.router.use('/auth', new AuthRouter().getRouter());
    // this.router.use('/callback', new CallbackRouter().getRouter());
    // this.router.use('/test', new PerfRouter().getRouter());
    // this.router.use('/news', new ScrappingRouter().getRouter());
  }
}
