import CallbackControllerFile from '@/controllers/callback';
import mw from '@/middlewares/mw';
import { Router, type Router as ExpressRouter } from 'express';

export default class CallbackRouter extends CallbackControllerFile {
  public router: ExpressRouter = Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/google', mw([this.google]));
  }

  getRouter() {
    return this.router;
  }
}
