import config from '@config';
import { signedCookie } from 'cookie-parser';
import { decode, sign, TokenExpiredError, verify, type Secret, type SignOptions } from 'jsonwebtoken';
import { jwtDecode } from 'jwt-decode';
import speakeasy from 'speakeasy';

export function createSessionToken<T extends object>(values: T, expiresIn: string | number) {
  const { security } = config;
  return sign(values, security.session.SESSION_SECRET as Secret, { expiresIn } as SignOptions);
}

export const decryptSessionApiKey = <T>(Token: string, allowExpiredToken?: boolean): [boolean | Error, T?] => {
  const { security } = config;
  try {
    const data = verify(Token, security.session.SESSION_SECRET) as T;
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

export function getSignedCookieValue<T>(cookie: string): T | undefined {
  try {
    if (cookie) {
      const [tokenValue] = cookie.split(';');
      const { security } = config;
      const parsedToken = tokenValue.startsWith('s:') ? (signedCookie(tokenValue.substring(2), security.cookie.COOKIE_SECRET) as string) : tokenValue;
      return jwtDecode(parsedToken);
    }
    return undefined;
  } catch (error) {
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
