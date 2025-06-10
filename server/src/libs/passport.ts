// src/config/passport.ts
import { type Session } from '@/interfaces/session';
import UserServiceClass from '@/services/users';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import env from '../config';
import QueryBuilderClass from '@/services/query';
import AuthServiceClass from '@/services/auth';
import Container from 'typedi';
import { InvalidArgumentError } from '@/exceptions';
import MailerServiceClass from '@/services/mailer';

export default function PassportLibs() {
  const UserService = Container.get(UserServiceClass);
  const QueryBuilder = Container.get(QueryBuilderClass);
  const AuthService = Container.get(AuthServiceClass);
  const MailerService = Container.get(MailerServiceClass);

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: Session.TokenUser, done) => {
    done(null, user);
  });

  //? Google strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: `/api/callback/google`,
        passReqToCallback: false,
        state: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        const {
          emails: [{ value: email, verified }],
          name: { familyName, givenName },
        } = profile;
        try {
          if (!verified) {
            throw new InvalidArgumentError('Email not verified');
          }

          const userFound = await UserService.getUser({ email, isoAuth: true }, ['id', 'role', 'refreshToken']);

          const {
            id,
            role: sessionRole,
            refreshToken,
          } = userFound
            ? userFound
            : await QueryBuilder.transactionBuilder(
                trx =>
                  AuthService.register(
                    {
                      email,
                      password: null,
                      firstName: givenName,
                      lastName: familyName,
                    },
                    trx,
                  ),
                async ({ id, refreshToken, role }) => {
                  if (!role || refreshToken || !id) throw new InvalidArgumentError();
                  await MailerService.new_oauth2_register(email);
                  return { role, id, refreshToken };
                },
              );

          const user = {
            sessionId: Number(id),
            sessionRole,
            refreshToken,
          } satisfies Session.TokenUser;
          return done(null, user);
        } catch (err) {
          return done(err as Error, false);
        }
      },
    ),
  );
}
