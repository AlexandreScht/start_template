import type { default as UserRole } from './UserRole';
/** Identifier type for public.users */
export type UsersId = number ;
/** Represents the table public.users */
export default interface UsersTable {
  id?: UsersId;
  email: string;
  password: string | null;
  first_name: string;
  last_name: string;
  role?: UserRole;
  phone: string | null;
  validate?: boolean;
  profile: object | null;
  stripe_customer_id: string | null;
  is_subscribe?: boolean;
  updated_at?: Date | number | string;
  created_at?: Date | number | string;
}