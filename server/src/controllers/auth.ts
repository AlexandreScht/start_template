import env from '@/config';
import { tester_user_allowed } from '@/config/users';
import { InvalidAccessError, InvalidArgumentError, ServerException } from '@/exceptions';
import { type Session } from '@/interfaces/session';
import RedisInstance from '@/libs/redis';
import UserModel from '@/models/users';
import AuthServiceFile from '@/services/auth';
import MailerServiceFile from '@/services/mailer';
import QueryBuilder from '@/services/query';
import { type authControllerType } from '@/types/controllers/auth';
import { checkOtpCode, optCode } from '@/utils/generate';
import { logger } from '@/utils/logger';
import passport from 'passport';
import Container from 'typedi';
import { v4 as uuidv4 } from 'uuid';
export default class AuthControllerFile {
  private redisClient = RedisInstance.getInstance();
  private AuthService = Container.get(AuthServiceFile);
  private MailerService = Container.get(MailerServiceFile);
  private queryBuilder = Container.get(QueryBuilder);

  protected register = async ({
    locals: {
      body: { email, password, first_name, last_name, phone },
    },
    res,
    next,
  }: authControllerType.register) => {
    try {
      if (new URL(env.ORIGIN).hostname.startsWith('test.') && !tester_user_allowed.includes(email)) {
        throw new InvalidAccessError('Only developer accounts can have access to this site.');
      }
      const user = await UserModel.selectWhere(['id', 'validate'], { email }).executeTakeFirst();

      const newUser = async (id: number) => {
        const token = uuidv4();
        const raw = JSON.stringify({ id, token });
        const access_token = Buffer.from(raw).toString('base64');
        const [access_code, code] = optCode(4, '15min');

        await this.MailerService.new_register(email, access_token, code);
        await this.redisClient.set(`register:${id}`, { access_token: token, access_code }, { EX: 15 * 60 });
      };

      if (user) {
        const { id, validate } = user;
        if (validate) {
          await this.MailerService.already_register(email);
          res.status(200).send('Please check your email to activate your account.');
          return;
        }
        await newUser(id);
        res.status(200).send('Please check your email to activate your account.');
        return;
      }

      await this.queryBuilder.transactionBuilder(
        trx => this.AuthService.register({ email, password, first_name, last_name, phone }, trx),
        async ({ id, role }) => {
          if (!id || !role) throw new InvalidArgumentError();
          await newUser(id);
        },
      );
      res.status(200).send('Please check your email to activate your account.');
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.register => ', error);
      }
      next(error);
    }
  };

  protected login = async ({ req, res, next }: authControllerType.login) => {
    try {
      return passport.authenticate('local', { session: true }, (err: Error, user: Session.TokenUser, info: any) => {
        if (err || !user) {
          const message = err?.message || info?.message || 'Authentification refusée';
          return res.redirect(`${env.ORIGIN}/login?error=${encodeURIComponent(message || 'Session Error')}`);
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
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.login => ', error);
      }
      next(error);
      return;
    }
  };

  protected validateAccount = async ({
    locals: {
      body: { access_code },
      token: access_token,
    },
    res,
    next,
  }: authControllerType.validAccount) => {
    try {
      if (!access_code || !access_token)
        throw new InvalidArgumentError(
          'Sorry, something went wrong. Please request a new verification link to continue.',
        );
      const { id, token } = JSON.parse(Buffer.from(decodeURIComponent(access_token), 'base64').toString('utf-8')) || {};

      if (!id || !token)
        throw new InvalidArgumentError(
          'Sorry, something went wrong. Please request a new verification link to continue.',
        );

      const memory = await this.redisClient.get<{ access_token: string; access_code: string }>(`register:${id}`);

      if (!memory) throw new InvalidArgumentError('This link has expired. Please request a new one to continue.');

      if (memory.access_token !== token) {
        throw new InvalidArgumentError(
          'Sorry, something went wrong. Please request a new verification link to continue.',
        );
      }

      if (!checkOtpCode(memory.access_code, String(access_code))) {
        throw new InvalidArgumentError('The code you entered is incorrect. Please try again.');
      }

      const user = await UserModel.updateWhere({ validate: true }, { id }).executeTakeFirst();

      if (!user.numUpdatedRows) {
        throw new InvalidArgumentError(
          'Sorry, something went wrong. If the issue persists, please contact support for assistance',
        );
      }
      res.status(201).send(true);
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.validateAccount => ', error);
      }
      next(error);
    }
  };
}
