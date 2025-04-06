import { type Events } from '@/interfaces/events';
import type RedisInstance from './redis';

export default class EventsList {
  protected redisClient: typeof RedisInstance;

  constructor(redisClient: typeof RedisInstance) {
    this.redisClient = redisClient;
  }

  protected async setUserEvent(userId: number, values: Events.values) {
    await this.redisClient.set(`Evt:${userId}`, values);
  }

  protected async checkMissingEvents(userId: number) {
    return await this.redisClient.getAll<Events.values>(`Evt:${userId}`, true);
  }

  get() {}
}
