import csrf from 'csurf';
import { type RequestHandler } from 'express';

export const csrfProtection: RequestHandler = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none',
  },
});
