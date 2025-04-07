'use server';
import nextAuthOptions from '@/config/authOption';
import { type User } from '@/interfaces/user';
import getSessionCookie from '@/utils/cookies';
import { getServerSession } from 'next-auth';

export default async function authMw(role?: User.role | Array<User.role>) {
  const session = await getServerSession(nextAuthOptions);
}
