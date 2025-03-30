import { Routes } from '@interfaces/routes';
// import { AuthRouter } from '@routes/auth';
import { Router } from 'express';
import { TestRouter } from './user';

export default class ApiRouter implements Routes {
  public router: Router;

  constructor() {
    this.router = Router();
  }

  protected initializeRoutes() {
    // this.router.use('/auth', new AuthRouter().getRouter());
    this.router.use('/test', new TestRouter().getRouter());
    // this.router.use('/news', new ScrappingRouter().getRouter());
  }
}
