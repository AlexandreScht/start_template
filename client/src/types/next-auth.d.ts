import { type User } from '@/interfaces/user';
import type NextAuth from 'next-auth';

declare module 'next-auth' {
  interface User extends User.session {}
  interface Session extends User.session {}
  interface Profile extends User.session {
    email_verified?: boolean;
    at_hash?: string;
  }
  interface Jwt extends User.session {}
}

declare module 'next-auth/jwt' {
  interface JWT extends User.session {}
}

export default NextAuth;
