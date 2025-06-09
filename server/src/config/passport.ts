// src/config/passport.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import env from '.';
import { type Session } from '@/interfaces/session';

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
        // Ici vous récupérez ou créez votre utilisateur en base
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
