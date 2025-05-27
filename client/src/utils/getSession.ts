'use server';

import nextAuthOptions from '@/config/authOption';
import { getServerSession } from 'next-auth';

export default async function getSession() {
  return await getServerSession(nextAuthOptions);
}
