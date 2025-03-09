'use server';
import config from '@/config';
import serverConfig from '@/config/server';
import { parse } from 'cookie';
import { cookies } from 'next/headers';

export default async function getSessionCookie(cookieName?: string) {
  try {
    return cookies().get(cookieName ? cookieName : (config?.COOKIE as string))?.value;
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
          domain: new URL(config.SERVER_URI).hostname,
          maxAge: parseInt(parsedCookie['Max-Age'] || serverConfig.maxAge),
          path: parsedCookie['Path'],
          secure: config.SERVER_URI.startsWith('https'),
          expires,
        });
      }
    });
  } catch (error) {
    console.error('Error setting response cookies:', error);
  }
}

/**
 * function to get cookie in client side from server side
 */
export async function setRequestCookies(): Promise<
  {
    name: string;
    value: string;
    path?: string;
    domain?: string;
    secure: boolean;
    sameSite?: 'strict';
    httpOnly: boolean;
  }[]
> {
  try {
    return cookies()
      .getAll()
      .filter(cookie => !cookie.name.startsWith('next-auth.'))
      .map(cookie => {
        const signedCookie = cookie.value.startsWith('s:');
        return {
          name: cookie.name,
          value: cookie.value,
          httpOnly: true,
          ...(signedCookie
            ? {}
            : {
                path: '/',
                domain: new URL(config.SERVER_URI).hostname,
                sameSite: 'strict',
              }),
          secure: config.SERVER_URI.startsWith('https'),
        };
      });
  } catch (error) {
    console.error('Error retrieving server cookies:', error);
    return [];
  }
}

export async function getServerUri() {
  return config.SERVER_URI;
}
