// src/config/passport.ts
import { tester_user_allowed } from '@/config/users';
import { InvalidAccessError, InvalidArgumentError, InvalidCredentialsError, InvalidSessionError } from '@/exceptions';
import { type Session } from '@/interfaces/session';
import UserModel from '@/models/users';
import AuthServiceClass from '@/services/auth';
import MailerServiceClass from '@/services/mailer';
import QueryBuilderClass from '@/services/query';
import { generateRefreshToken } from '@/utils/generate';
import { logger } from '@/utils/logger';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import Container from 'typedi';
import env from '../config';

export default function PassportLibs() {
  const QueryBuilder = Container.get(QueryBuilderClass);
  const AuthService = Container.get(AuthServiceClass);
  const MailerService = Container.get(MailerServiceClass);

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: Session.TokenUser, done) => {
    done(null, user);
  });

  //? Local strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        session: true,
      },
      async (email, password, done) => {
        try {
          const userFound = await UserModel.selectWhere(['id', 'validate', 'role'], {
            email,
            password: ['is not', null],
          }).executeTakeFirst();

          if (!userFound?.id) {
            throw new InvalidCredentialsError('Email or password is incorrect');
          }

          const { id, role, validate } = userFound;

          await UserModel.checkPassword(password, id);

          if (!validate) {
            throw new InvalidSessionError(
              'Please verify your email address by clicking the link sent to your email address before logging in.',
            );
          }
          const user = {
            sessionId: Number(id),
            sessionRole: role,
            refreshToken: await generateRefreshToken(id),
          } satisfies Session.TokenUser;

          return done(null, user);
        } catch (err) {
          logger.error('Passeport.LocalStrategy error : ', err);
          return done(err as Error, false);
        }
      },
    ),
  );

  //? Google strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: `/api/callback/google`,
        passReqToCallback: false,
        state: false,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const emailObj = profile.emails?.[0];
          const email = emailObj?.value;
          const verified = emailObj?.verified ?? false;

          const givenName = profile.name?.givenName ?? '';
          const familyName = profile.name?.familyName ?? '';

          if (!email) {
            throw new InvalidArgumentError('Email is missing from Google profile');
          }

          if (!verified) {
            throw new InvalidArgumentError('Email not verified');
          }

          const userFound = await UserModel.selectWhere(['id', 'role'], {
            email,
            password: ['is', null],
          }).executeTakeFirst();

          const { id, role: sessionRole } = userFound
            ? userFound
            : await QueryBuilder.transactionBuilder(
                trx => {
                  if (new URL(env.ORIGIN).hostname.startsWith('test.') && !tester_user_allowed.includes(email)) {
                    throw new InvalidAccessError('Only developer accounts can have access to this site.');
                  }
                  return AuthService.register(
                    {
                      email,
                      first_name: givenName,
                      last_name: familyName,
                    },
                    trx,
                  );
                },
                async ({ id, role }) => {
                  if (!role || !id) throw new InvalidArgumentError();
                  await MailerService.new_confirmed_register(email);
                  return { role, id };
                },
              );

          const user = {
            sessionId: Number(id),
            sessionRole,
            refreshToken: await generateRefreshToken(id),
          } satisfies Session.TokenUser;
          return done(null, user);
        } catch (err) {
          logger.error('Passeport.GoogleStrategy error : ', err);
          return done(err as Error, false);
        }
      },
    ),
  );
}
