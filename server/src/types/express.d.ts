import { type Session } from '@/interfaces/session';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends Session.TokenUser {}
  }
}
