import config from '@/config';
import type { Services } from '@/interfaces/services';

export function serializeCookies(cookies: { name: string; value: unknown }[]): Services.Axios.Cookie[] {
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
            domain: new URL(config.SERVER_URI).hostname,
            sameSite: 'strict',
          }),
      secure: config.SERVER_URI.startsWith('https'),
    };
  });
}
