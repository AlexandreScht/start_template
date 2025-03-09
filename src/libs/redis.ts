import config from '@/config';
import { ClientException } from '@/exceptions/errors';
import Redis, { Redis as RedisClient } from 'ioredis';

class RedisInstance {
  private static instance: RedisInstance;
  protected redisClient: RedisClient;

  private constructor() {
    const { PASSWORD, PORT, HOST } = config.redis;

    this.redisClient = new Redis({
      host: HOST,
      port: Number(PORT),
      ...(PASSWORD ? { password: PASSWORD } : {}),
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.redisClient.on('error', err => {
      throw new ClientException(500, err);
    });

    this.redisClient.on('connect', () => console.info(`Redis server port: ${this.redisClient.options.port}`));
  }

  public static getInstance(): RedisInstance {
    if (!RedisInstance.instance) {
      RedisInstance.instance = new RedisInstance();
    }
    return RedisInstance.instance;
  }

  public getRedisClient(): RedisClient {
    return this.redisClient;
  }

  public async get<T>(key: string): Promise<T | undefined> {
    const data = await this.redisClient.get(key);
    return data ? JSON.parse(data) : undefined;
  }

  public async set(key: string, value: unknown, ...args: any[]): Promise<void> {
    await this.redisClient.set(key, JSON.stringify(value), ...args);
  }

  public async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  public async disconnect(): Promise<void> {
    try {
      await this.redisClient.quit();
      console.info('Redis connection closed.');
    } catch (error) {
      // Gestion de l'erreur à la déconnexion
    }
  }
}

export default RedisInstance.getInstance();
