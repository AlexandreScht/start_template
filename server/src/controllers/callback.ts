import { ServerException } from '@/exceptions';
import { logger } from '@/utils/logger';
import passport from 'passport';
import env from '@/config';

export default class CallbackControllerFile {
  constructor() {}

  protected async google({ req, res, next }) {
    try {
      passport.authenticate('google', { session: false }, (err, user: any) => {
        console.log({ user });

        if (err || !user) {
          const message = err?.message || 'Authentification refusée';
          return res.redirect(`${env.ORIGIN}/login?error=${encodeURIComponent(message)}`);
        }
        req.login(user, loginErr => {
          if (loginErr) {
            logger.error('Erreur lors de req.login:', loginErr);
            return res.redirect(`${env.ORIGIN}/login?error=${encodeURIComponent(loginErr)}`);
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
