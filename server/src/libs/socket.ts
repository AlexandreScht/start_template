// socketManager.ts

import { ServerException } from '@/exceptions';
import { type Events } from '@/interfaces/events';
import { type WebSocket } from '@/interfaces/websocket';
import socketMiddleware from '@/middlewares/websocket';
import { logger } from '@utils/logger';
import { type Server } from 'socket.io';
import EventsList from './events';
import RedisInstance from './redis';

export default class SocketManager extends EventsList {
  private static instance: SocketManager;
  private io: WebSocket.wslServer;
  private socketMap: WebSocket.socketMap;

  constructor(io: WebSocket.wslServer) {
    super(RedisInstance);
    this.io = io;
    this.initializeSocket();
  }

  private async initializeSocket() {
    this.io.use(socketMiddleware(this.socketMap));
    this.io.on('connection', async socket => {
      const { user } = socket.data;
      if (user) {
        const events = await this.checkMissingEvents(user.sessionId);
        if (events.length > 0) {
          events.forEach(event => {
            const { eventName, data } = event;
            socket.emit(eventName, data);
          });
        }
      }

      socket.on('disconnect', () => {
        if (user) {
          const { sessionId } = user;
          this.socketMap.delete(sessionId);
        }
      });
    });
  }

  public async ioSendToUser(userId: number, values: Events.values) {
    try {
      const user = this.socketMap.get(userId);
      if (!user) {
        await this.setUserEvent(userId, values);
        return;
      }
      const { socketId } = user;
      const { eventName, data } = values;
      this.io.to(socketId).emit(eventName, data);
    } catch (error) {
      logger.error('SocketManager.ioSendToAll => ', error);
    }
  }

  public static getInstance(io?: Server): SocketManager {
    try {
      if (!SocketManager.instance) {
        if (!io) {
          throw new ServerException(
            500,
            'SocketManager not initialized yet. Please provide the io parameter the first time.',
          );
        }
        SocketManager.instance = new SocketManager(io);
      }
      return SocketManager.instance;
    } catch (error) {
      logger.error('SocketManager.getInstance => ', error);
    }
  }
}
