import env from '@/config';
import { ServerException } from '@/exceptions';
import { logger } from '@/utils/logger';
import type { NextFunction, Request, Response } from 'express';
import passport from 'passport';
export default class CallbackControllerFile {
  constructor() {}

  protected async google({ req, res, next }: { req: Request; res: Response; next: NextFunction }) {
    try {
      return passport.authenticate('google', { session: true }, (err, user: any) => {
        if (err || !user) {
          const message = err?.message || 'Authentification refusée';
          return res.redirect(`${env.ORIGIN}/login?error=${encodeURIComponent(message)}`);
        }
        req.login(user, { session: true }, loginErr => {
          if (loginErr) {
            logger.error('Erreur lors de req.login:', loginErr);
            return res.redirect(`${env.ORIGIN}/login?error=${encodeURIComponent(loginErr.message || 'Session Error')}`);
          }
          return res.redirect(env.ORIGIN);
        });
      })(req, res, next);
    } catch (error) {
      console.log(error);

      if (!(error instanceof ServerException)) {
        logger.error('UserControllerFile.account => ', error);
      }
      next(error);
    }
  }
}
