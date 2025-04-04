import { type Session } from '@/interfaces/session';
import env from '@config';
import { signedCookie } from 'cookie-parser';
import { decode, sign, TokenExpiredError, verify, type Secret, type SignOptions } from 'jsonwebtoken';
import { jwtDecode } from 'jwt-decode';
import speakeasy from 'speakeasy';
import { logger } from './logger';
const { SESSION_SECRET, COOKIE_SECRET } = env;
export function createSessionToken<T extends object>(values: T, expiresIn: string | number) {
  return sign(values, SESSION_SECRET as Secret, { expiresIn } as SignOptions);
}

export const decryptSessionApiKey = <T>(Token: string, allowExpiredToken?: boolean): [boolean | Error, T?] => {
  try {
    const data = verify(Token, SESSION_SECRET) as T;
    return [false, data];
  } catch (error) {
    if (error instanceof TokenExpiredError && allowExpiredToken) {
      const decoded = decode(Token) as T | null;
      if (decoded) {
        return [error, decoded];
      }
      return [error];
    }
    return [error];
  }
};

export function getSignedCookieValue<T extends Session.JWT<unknown>>(cookie: T): T extends Session.JWT<infer U> ? U : undefined {
  try {
    if (cookie) {
      const [tokenValue] = cookie.split(';');
      const parsedToken = tokenValue.startsWith('s:') ? (signedCookie(tokenValue.substring(2), COOKIE_SECRET) as string) : tokenValue;
      return jwtDecode(parsedToken) as any;
    }
    return undefined;
  } catch (error) {
    logger.error('token.getSignedCookieValue => ', error);
    return undefined;
  }
}

export const verifyAuthenticator2FA = (secret: string, token: string) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
  });
};
