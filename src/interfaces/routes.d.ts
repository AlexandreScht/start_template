import { type Socket } from 'socket.io-client';
import { codeError } from './error';

type QueryType<T> = T extends Record<string, string | number | boolean | unknown[]> ? T : Record<string, string | number | boolean | unknown[]>;

type ParamsType<T> = T extends (string | number | boolean)[] ? T : (string | number | boolean)[];

// Corrections ici : Utilisation des types définis correctement
type QueryRoutesType = (value?: QueryType<unknown>) => string;
type ParamsRoutesType = (value?: ParamsType<unknown>) => string;
type PropsRoutesType = (value?: ParamsType<unknown>) => string;

// Modification de RoutesPropsType pour accepter plusieurs paramètres
type RoutesPropsType = (...args: any[]) => string;

interface RouteObject {
  [key: string]: RoutesPropsType | RouteObject;
}

type IoSocket = Socket & {
  io: {
    uri?: string;
    opts: {
      extraHeaders: {
        Origin?: string;
      };
    };
  };
};
