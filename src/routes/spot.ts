import config from '@/config';
import AccountControllerFile from '@/controllers/account';
import SpotControllerFile from '@/controllers/spot';
import cookies from '@/middlewares/cookies';
import mw from '@/middlewares/mw';
import Validator from '@/middlewares/validator';
import { Router } from 'express';

export class SpotRouter extends SpotControllerFile {
  public router = Router();

  constructor() {
    super();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/list', mw([this.spotList]));
    this.router.get('/wallet', mw([this.spotList]));
  }

  getRouter() {
    return this.router;
  }
}
