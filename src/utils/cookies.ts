'use server';
import env from '@/config';
import serverConfig from '@/config/server';
import { type Services } from '@/interfaces/services';
import { parse } from 'cookie';
import CryptoJS from 'crypto-js';
import { cookies } from 'next/headers';

export default async function getSessionCookie(cookieName?: string) {
  try {
    return cookies().get(cookieName ? cookieName : (env?.COOKIE as string))?.value;
  } catch (error) {
    return undefined;
  }
}

export async function getRequestCookies(apiCookies: string[]): Promise<void> {
  try {
    apiCookies.forEach((cookie: string) => {
      const parsedCookie = parse(cookie);
      const [cookieName, cookieValue] = Object.entries(parsedCookie)[0];

      if (parsedCookie && cookieName && cookieValue) {
        const sameSite = parsedCookie['SameSite']?.toLowerCase() as 'strict' | 'lax' | 'none';

        const expires = parsedCookie['Expires'] ? new Date(parsedCookie['Expires']) : undefined;

        cookies().set({
          name: cookieName,
          value: cookieValue,
          httpOnly: true,
          sameSite,
          domain: new URL(env.SERVER_URI).hostname,
          maxAge: parseInt(parsedCookie['Max-Age'] || serverConfig.maxAge),
          path: parsedCookie['Path'],
          secure: env.SERVER_URI.startsWith('https'),
          expires,
        });
      }
    });
  } catch (error) {
    console.error('Error setting response cookies:', error);
  }
}

export async function verifySignature(signature: string, signed: string): Promise<boolean> {
  const signatureResolved = CryptoJS.HmacSHA256(signature, env.SIGNATURE).toString(CryptoJS.enc.Hex);
  return signed === signatureResolved;
}

/**
 * function to get cookie in client side from server side
 */
export async function setRequestCookies(): Promise<Services.Axios.Cookie[]> {
  try {
    return serializeCookies(
      cookies()
        .getAll()
        .filter(cookie => !cookie.name.startsWith('next-auth.')),
    );
  } catch (error) {
    console.error('Error retrieving server cookies:', error);
    return [];
  }
}

export async function getServerUri() {
  return env.SERVER_URI;
}

export async function serializeCookies(cookies: { name: string; value: unknown }[]): Promise<Services.Axios.Cookie[]> {
  return cookies.map(cookie => {
    const value = typeof cookie.value === 'string' ? cookie.value : JSON.stringify(cookie.value);
    const signedCookie = value.startsWith('s:');
    return {
      name: cookie.name,
      value: value,
      httpOnly: true,
      ...(signedCookie
        ? {}
        : {
            path: '/',
            domain: new URL(env.SERVER_URI).hostname,
            sameSite: 'strict',
          }),
      secure: env.SERVER_URI.startsWith('https'),
    };
  });
}
