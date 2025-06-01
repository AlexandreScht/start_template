'use server';
import env from '@/config';
import serverConfig from '@/config/server';
import { type Services } from '@/interfaces/services';
import { parse } from 'cookie';
import { cookies } from 'next/headers';

const server_uri = process.env.NEXT_PUBLIC_SERVER_API as string;
export default async function getSessionCookie(cookieName?: string) {
  try {
    return (await cookies()).get(cookieName ? cookieName : (env?.COOKIE as string))?.value;
  } catch (error) {
    return undefined;
  }
}

export async function getRequestCookies(apiCookies: string[]): Promise<void> {
  try {
    const cookiesInstance = await cookies();
    for (const cookie of apiCookies) {
      const parsedCookie = parse(cookie);
      const [cookieName, cookieValue] = Object.entries(parsedCookie)[0];

      if (parsedCookie && cookieName && cookieValue) {
        const sameSite = parsedCookie['SameSite']?.toLowerCase() as 'strict' | 'lax' | 'none';
        const expires = parsedCookie['Expires'] ? new Date(parsedCookie['Expires']) : undefined;

        cookiesInstance.set({
          name: cookieName,
          value: cookieValue,
          httpOnly: true,
          sameSite,
          domain: new URL(server_uri).hostname,
          maxAge: parseInt(parsedCookie['Max-Age'] || serverConfig.maxAge),
          path: parsedCookie['Path'],
          secure: server_uri.startsWith('https'),
          expires,
        });
      }
    }
  } catch (error) {
    console.error('Error setting response cookies:', error);
  }
}

/**
 * function to get cookie in client side from server side
 */
export async function setRequestCookies(): Promise<Services.Axios.Cookie[]> {
  try {
    return serializeCookies(
      (await cookies())
        .getAll()
        .filter((cookie: { name: string; value: unknown }) => !cookie.name.startsWith('next-auth.')),
    );
  } catch (error) {
    console.error('Error retrieving server cookies:', error);
    return [];
  }
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
            domain: new URL(server_uri).hostname,
            sameSite: 'strict',
          }),
      secure: server_uri.startsWith('https'),
    };
  });
}
