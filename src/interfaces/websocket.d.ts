import { type Server } from 'socket.io';
import { type Session } from './session';

export namespace WebSocket {
  interface handshakeAuth {
    signature: string;
    token: Session.JWT<Session.TokenUser>;
  }

  type WSS<T> = (v: T) => void;

  export interface emitEvents {
    history_data: WSS<{ candleStick: any }>;
    his_data: WSS<{ candleStick: any }>;
  }

  export interface listenEvents {
    history_data: WSS<{ candleStick: any }>;
  }

  export interface socketList {
    refreshToken: string;
    socketId: string;
    signed: string;
  }

  export type socketMap = Map<number, socketList>;

  export type wslServer = Server<listenEvents, emitEvents, object, { user?: Session.TokenUser }>;
}
