// socketManager.ts

import { ServerException } from '@/exceptions';
import { type WebSocket } from '@/interfaces/websocket';
import socketMiddleware from '@/middlewares/websocket';
import { logger } from '@utils/logger';
import type Redis from 'ioredis';
import { type Server } from 'socket.io';
import RedisInstance from './redis';

export default class SocketManager {
  private static instance: SocketManager;
  private io: WebSocket.wslServer;
  private redisClient: typeof RedisInstance;

  constructor(io: WebSocket.wslServer) {
    this.io = io;
    this.redisClient = RedisInstance;
    this.initializeSocket();
  }

  private async initializeSocket() {
    this.io.use(socketMiddleware(this.redisClient));
    this.io.on('connection', async socket => {
      if (GetAllEvents.size > 0) {
        GetAllEvents.forEach(async (eventData, userId) => {
          if (this.socketList.has(userId)) {
            await this.redisClient.del(`Event.${userId}`);
            this.ioSendTo(userId, eventData);
          }
        });
      }
      socket.on('disconnect', () => {
        for (const [userId, value] of this.socketList.entries()) {
          if (value.socketId === socket.id) {
            this.socketList.delete(userId);
            break;
          }
        }
      });
    });
  }

  private async getUserEvent(userId: number): Promise<Map<string, eventData>> {
    try {
      let cursor = '0';
      const streams = new Map<string, eventData>();

      do {
        const [newCursor, keys] = await this.redisClient.scan(cursor, 'MATCH', `Event.${userId}`, 'COUNT', '100');
        cursor = newCursor;

        if (keys.length > 0) {
          const values = await this.redisClient.mget(...keys);

          keys.reduce((acc, key, index) => {
            const value = values[index];
            if (value) {
              acc.set(key.replace(/^Event\./, ''), JSON.parse(value));
            }
            return acc;
          }, streams);
        }
      } while (cursor !== '0');

      return streams;
    } catch (error) {
      logger.error('SocketManager.getUserEvent => ', error);
      throw new ServerException(500, 'Could not fetch all streams');
    }
  }

  private async setUserEvent(userId: string, eventData: eventData) {
    await this.redisClient.set(`Event.${userId}`, JSON.stringify(eventData));
  }

  public ioSendTo(idUser: string | number, eventData: eventData) {
    try {
      const userId = typeof idUser === 'number' ? String(idUser) : idUser;
      const user = this.socketList.get(userId);
      if (!user) {
        this.setUserEvent(userId, eventData);
        return;
      }
      const { socketId, secret_key } = user;
      const { eventName, ...res } = eventData;
      this.io.to(socketId).emit(eventName, { res, auth: { secret_key } });
    } catch (error) {
      logger.error('SocketManager.ioSendTo => ', error);
    }
  }

  public async ioSendToAll(eventName: string, eventData: eventData) {
    try {
      this.io.emit(eventName, eventData);
    } catch (error) {
      logger.error('SocketManager.ioSendToAll => ', error);
    }
  }

  public static getInstance(io?: Server): SocketManager {
    try {
      if (!SocketManager.instance) {
        if (!io) {
          throw new ServerException(500, 'SocketManager not initialized yet. Please provide the io parameter the first time.');
        }
        SocketManager.instance = new SocketManager(io);
      }
      return SocketManager.instance;
    } catch (error) {
      logger.error('SocketManager.getInstance => ', error);
    }
  }
}
