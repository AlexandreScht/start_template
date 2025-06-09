import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { adminPaths, publicPaths } from './config/rolesAccess';
import apiRoutes from './router/api';
import clientRoutes from './router/client';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (publicPaths.some(p => new RegExp(`^${p}$`).test(pathname))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('__Host-session.sid')?.value;
  if (!token) {
    return NextResponse.redirect(new URL(clientRoutes.unauthorized(), req.url));
  }

  if (adminPaths.some(p => new RegExp(`^${p}$`).test(pathname))) {
    const { status, ok } = await fetch(`${process.env.NEXT_PUBLIC_SERVER_API}${apiRoutes.api.user.isAdmin()}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!ok || status !== 200) return NextResponse.redirect(new URL(clientRoutes.notFound(), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|$|login|register|password-reset|api[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
