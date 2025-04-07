export namespace User {
  export type role = 'member' | 'premium';

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
