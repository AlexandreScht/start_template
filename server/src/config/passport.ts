// src/config/passport.ts
import { type Session } from '@/interfaces/session';
import UserServiceFile from '@/services/users';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import env from '.';
import QueryBuilder from '@/libs/queryBuilder';
import AuthServiceFile from '@/services/auth';

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: Session.TokenUser, done) => {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `/api/callback/google`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const UserService = new UserServiceFile();
        const QueryBuilder = new QueryBuilder();
        const AuthService = new AuthServiceFile();
        const userFound = await UserService.getUser({ email: profile.emails?.[0].value, isoAuth: true }, ['id', 'role', 'created_at']);

      const {
        id: userId,
        role,
        createdAt,
      } = userFound
        ? userFound
        : await transaction(this.UserService.getModel, async trx => {
            const user = await this.AuthService.register<registerOauth>({ email, ...(accessUsers.includes(email) ? { role: 'admin' } : {}) }, trx);
            if (!user) {
              throw new ServicesError('Une erreur est survenue lors de votre connexion');
            }

            await this.APIService.CreateBrevoUser({ email, firstName, lastName, google: false });

            return user;
        });
        
              await QueryBuilder.transactionBuilder(
                trx => AuthService.register({ email: profile.emails?.[0].value, password: null, firstName: profile.name.givenName, lastName: profile.name.familyName }, trx),
                async ({ id, ...returningValues }) => {
                  if (!('accessToken' in returningValues) || !id) throw new InvalidArgumentError();
                  const { accessToken } = returningValues;
                  await this.MailerService.new_register(email, accessToken);
                  createSessionCookie<Token.cookieIdentifier>(res, { id, cookieName: 'new_register' }, '15m');
                },
              );
        const user = {
          sessionId: Number(profile.id),
          sessionRole: 'normal',
          refreshToken: profile.emails?.[0].value,
        } satisfies Session.TokenUser;
        return done(null, user);
      } catch (err) {
        return done(err as Error, false);
      }
    },
  ),
);
