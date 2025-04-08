import hasAccess from '@/config/rolesAccess';
import { InvalidAccessError } from '@/exceptions/errors';
import { type User } from '@/interfaces/user';
import getSession from '@/utils/getSession';

export default async function authMw(requiredRole?: User.role | Array<User.role>) {
  const session = await getSession();
  if (!session) throw new InvalidAccessError();
  if (requiredRole) {
    if (Array.isArray(requiredRole)) {
      const accessGranted = requiredRole.some(role => hasAccess(session.sessionRole, role));
      if (!accessGranted) {
        throw new InvalidAccessError();
      }
    } else {
      if (!hasAccess(session.sessionRole, requiredRole)) {
        throw new InvalidAccessError();
      }
    }
  }
}
