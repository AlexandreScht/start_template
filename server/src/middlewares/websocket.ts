// socketAuthMiddleware.ts

import env from '@/config';
import { InvalidArgumentError } from '@/exceptions';
import { type WebSocket } from '@/interfaces/websocket';
import { logger } from '@/utils/logger';
import { getSignedCookieValue } from '@/utils/token';
import { createHmac } from 'crypto';
import type { Socket } from 'socket.io';

const socketMiddleware = (socketMap: WebSocket.socketMap) => (socket: Socket, next: (err?: Error) => void) => {
  try {
    const { token, signature } = socket.handshake.auth as WebSocket.handshakeAuth;

    if (!signature) {
      throw new InvalidArgumentError('Signature value is required');
    }

    const signed = createHmac('sha256', env.SIGNATURE).update(signature).digest('hex');
    //TODO parti a vérifier
    const payload = getSignedCookieValue(token);

    if (payload) {
      socket.data = { ...socket.data, ...payload };
      const { sessionId, refreshToken } = payload;
      const prevSession = socketMap.get(sessionId);
      if (prevSession.refreshToken === refreshToken) {
        socket.to(prevSession.socketId).emit('session_double', undefined);
        socket.to(prevSession.socketId).disconnectSockets();
      }
      socketMap.set(sessionId, { refreshToken, socketId: socket.id, signed });
    }

    const originalEmit = socket.emit;
    socket.emit = function (event, data, ...args) {
      const finalData = { signed, data };
      return originalEmit.call(this, event, finalData, ...args);
    };

    next();
  } catch (err) {
    logger.error('socketMiddleware error =>', err);
    socket.disconnect(true);
    next(new Error(err));
  }
};

export default socketMiddleware;
