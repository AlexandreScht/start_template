import PerfControllerFile from '@/controllers/test';
import mw from '@/middlewares/mw';
import { Router, type Router as ExpressRouter } from 'express';

export class PerfRouter extends PerfControllerFile {
  public router: ExpressRouter = Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/simple', mw([this.simple_request]));
  }

  getRouter() {
    return this.router;
  }
}
