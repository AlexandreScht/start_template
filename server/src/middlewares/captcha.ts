import env from '@/config';
import { type ctx } from '@/interfaces/middlewares';
import ApiServiceFile from '@/services/api';
import { logger } from '@/utils/logger';
import { ServerException } from '@exceptions';
import Container from 'typedi';

export default function captchaMiddleWare() {
  const apiService = Container.get(ApiServiceFile);
  return async (ctx: ctx) => {
    if (env.NODE_ENV === 'development') {
      return ctx.next();
    }
    const { next, locals } = ctx;
    try {
      const {
        body: { token },
      } = locals;

      const isValid = await apiService.FetchRecaptchaIdentity(token);

      if (!isValid) {
        throw new Error();
      }

      next();
    } catch (error) {
      logger.error('Captcha middleware error: ', error);
      throw new ServerException(
        401,
        'Activité suspecte détectée. Veuillez réessayez plus tard ou contactez le support.',
      );
    }
  };
}
