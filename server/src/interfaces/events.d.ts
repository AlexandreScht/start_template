import type { WebSocket } from '@interfaces/websocket';
export namespace Events {
  export type values = {
    eventName: keyof WebSocket.emitEvents;
    data: any;
  };
}
