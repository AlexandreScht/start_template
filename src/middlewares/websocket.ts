// socketAuthMiddleware.ts

import env from '@/config';
import { InvalidArgumentError } from '@/exceptions';
import { type WebSocket } from '@/interfaces/websocket';
import { logger } from '@/utils/logger';
import { getSignedCookieValue } from '@/utils/token';
import type RedisInstance from '@libs/redis';
import { createHmac } from 'crypto';
import type { Socket } from 'socket.io';

const socketMiddleware = (redisClient: typeof RedisInstance) => async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const { token, signature } = socket.handshake.auth as WebSocket.handshakeAuth;

    if (!signature) {
      throw new InvalidArgumentError('Signature value is required');
    }

    const signed = createHmac('sha256', env.SIGNATURE).update(signature).digest('hex');
    //TODO parti a vérifier
    const payload = getSignedCookieValue(token);

    socket.data = {
      signed,
      ...(payload ? payload : {}),
    };

    if (payload) {
      const { sessionId, refreshToken } = payload;
      const prevSession = await redisClient.get<WebSocket.socketList>(`wss:${sessionId}`);
      if (prevSession.refreshToken === refreshToken) {
        socket.to(prevSession.socketId).emit('session_double', undefined);
        socket.to(prevSession.socketId).disconnectSockets();
      }
      await redisClient.set<WebSocket.socketList>(`wss:${sessionId}`, { refreshToken, socketId: socket.id });
    }
    next();
  } catch (err) {
    logger.error('socketMiddleware error =>', err);
    socket.disconnect(true);
    next(new Error(err));
  }
};

export default socketMiddleware;
