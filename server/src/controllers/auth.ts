import env from '@/config';
import { user_tester } from '@/config/list';
import { InvalidArgumentError, InvalidCredentialsError, InvalidSessionError, ServerException } from '@/exceptions';
import { type Session } from '@/interfaces/session';
import { type Token } from '@/interfaces/token';
import QueryBuilder from '@/libs/queryBuilder';
import ApiServiceFile from '@/services/api';
import AuthServiceFile from '@/services/auth';
import MailerServiceFile from '@/services/mailer';
import UserServiceFile from '@/services/users';
import { type authControllerType } from '@/types/controllers/auth';
import createSessionCookie from '@/utils/createCookie';
import { logger } from '@/utils/logger';
import Container from 'typedi';
import { v4 as uuid } from 'uuid';
export default class AuthControllerFile {
  private APIService: ApiServiceFile;
  private AuthService: AuthServiceFile;
  private UserService: UserServiceFile;
  private MailerService: MailerServiceFile;
  private queryBuilder: QueryBuilder;

  constructor() {
    this.APIService = Container.get(ApiServiceFile);
    this.UserService = Container.get(UserServiceFile);
    this.MailerService = Container.get(MailerServiceFile);
    this.AuthService = Container.get(AuthServiceFile);
    this.queryBuilder = Container.get(QueryBuilder);
  }

  protected async register({
    locals: {
      body: { email, password, firstName, lastName, phone },
    },
    res,
    next,
  }: authControllerType.register) {
    try {
      if (new URL(env.ORIGIN).hostname.startsWith('test.') && !user_tester.includes(email)) {
        throw new InvalidCredentialsError('Only developer accounts can have access to this site.');
      }

      const user = await this.UserService.getUser({ email }, ['id', 'accessToken', 'validate']);

      if (user) {
        const { id, accessToken, validate } = user;
        if (validate) {
          await this.MailerService.already_register(email);
          res.status(200).send('Please check your email to activate your account.');
          return;
        }
        await this.MailerService.new_register(email, accessToken);
        createSessionCookie<Token.cookieIdentifier>(res, { id, cookieName: 'new_register' }, '15m');
        res.status(200).send('Please check your email to activate your account.');
        return;
      }

      await this.queryBuilder.transactionBuilder(
        trx => this.AuthService.register({ email, password, firstName, lastName, phone }, trx),
        async ({ id, ...returningValues }) => {
          if (!('accessToken' in returningValues) || !id) throw new InvalidArgumentError();
          const { accessToken } = returningValues;
          await this.MailerService.new_register(email, accessToken);
          createSessionCookie<Token.cookieIdentifier>(res, { id, cookieName: 'new_register' }, '15m');
        },
      );
      res.status(200).send('Please check your email to activate your account.');
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.register => ', error);
      }
      next(error);
    }
  }

  protected async login({
    locals: {
      body: { email, password },
    },
    res,
    next,
  }: authControllerType.login) {
    try {
      if (new URL(env.ORIGIN).hostname.startsWith('test.') && !user_tester.includes(email)) {
        throw new InvalidCredentialsError('Only developer accounts can have access to this site.');
      }

      const user = await this.UserService.getUserModel(email);

      if (!user) {
        throw new InvalidCredentialsError('Email ou mot de passe incorrect !');
      }

      const { id, role, validate, firstName } = await this.AuthService.login(user, password);

      if (!validate) {
        throw new InvalidSessionError(
          'Please verify your email address by clicking the link sent to your email address before logging in.',
        );
      }

      createSessionCookie<Session.userPayload>(
        res,
        { refreshToken: uuid(), sessionId: id, sessionRole: role, cookieName: env.COOKIE_NAME },
        '31d',
      );

      res.status(200).send({ firstName, role });
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.register => ', error);
      }
      next(error);
    }
  }

  protected async validateAccount({
    locals: {
      params: { accessToken },
      cookie: { new_register },
    },
    res,
    next,
  }: authControllerType.validAccount) {
    try {
      if (!new_register || new_register?.expired)
        throw new InvalidArgumentError('This link has expired. Please request a new one to continue.');
      const { id } = new_register || {};
      if (!id || !accessToken) {
        throw new InvalidArgumentError(
          'Sorry, something went wrong. Please request a new verification link to continue.',
        );
      }

      const user = await this.UserService.updateUsers({ id, accessToken }, { accessToken: null, validate: true });

      if (!user) {
        throw new InvalidArgumentError(
          'Sorry, something went wrong. If the issue persists, please contact support for assistance',
        );
      }

      res.clearCookie('new_register', {
        signed: true,
        httpOnly: true,
        domain: new URL(env.ORIGIN).hostname,
        secure: env.ORIGIN.startsWith('https'),
      });
      res.status(201).send(true);
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.validateAccount => ', error);
      }
      next(error);
    }
  }
}
