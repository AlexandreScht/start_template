import { type User } from '@/interfaces/user';
import clientRoutes from '@/router/client';

export const Roles = {
  member: 1,
  premium: 2,
  admin: 3,
};

const { pages } = clientRoutes;

//* path routes access
//? An array of routes that dons't requires authentication
export const publicPaths: Array<string> = [
  pages.login(),
  // pages.password(),
  // pages.register(),
  // pages.unauthorized(),
  // pages.notFund(),
  // pages['reset-password'].reset(),
  // pages['signup'].confirmEmail(),
];

//? An array of routes that requires an authentication
export const privatePaths: Array<string> = [pages.home()];

//? An array of routes that can only be accessed by the admin role.
export const adminPaths: Array<string> = [];

//* route access
export const routeAccess: Record<User.role, string[]> = {
  admin: [...adminPaths, ...privatePaths, ...publicPaths],
  premium: [...privatePaths, ...publicPaths],
  member: [...privatePaths, ...publicPaths],
};

//* access function
/**
 * Checks if the user has sufficient access rights based on their role.
 *
 * @param userRole - The role of the user, of type User.role.
 * @param requiredRole - The minimum required role to access a resource, of type User.role.
 * @returns boolean - Returns true if the user's role is equal to or greater than the required role; otherwise, returns false.
 */
export default function hasAccess(userRole: User.role, requiredRole: User.role): boolean {
  return userRole >= requiredRole;
}

/**
 * Checks if a given route is accessible by a user based on their role.
 *
 * @param route - The route path to check.
 * @param role - The role of the user, of type User.role.
 * @returns boolean - Returns true if the user's role has access to the route, false otherwise.
 */
export const canGo = (route: string, role: User.role): boolean => {
  if (!role || !route) {
    return false;
  }

  const userPathAccess = routeAccess[role];
  return !!userPathAccess?.some(pathPattern => route.startsWith(pathPattern));
};
