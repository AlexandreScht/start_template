import { type Roles } from '@/config/rolesAccess';

export namespace User {
  export type role = keyof typeof Roles;

  export interface session {
    sessionId: number;
    sessionRole: role;
    sessionName: {
      last_name: string;
      first_name: string;
    };
  }

  export type JWT = string & { __jwtPayloadBrand?: session };
}
