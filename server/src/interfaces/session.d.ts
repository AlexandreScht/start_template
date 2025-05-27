export namespace Session {
  export type JWT<T> = string & { __jwtPayloadBrand?: T };

  export type role = 'normal' | 'premium';

  export interface TokenUser {
    sessionId: number;
    sessionRole: role;
    refreshToken: string;
  }
}
