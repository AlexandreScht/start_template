import env from '@/config';
import crypto from 'crypto';
import Redis, { Redis as RedisClient } from 'ioredis';
import macaddress from 'macaddress';

class RedisInstance {
  private static instance: RedisInstance;
  protected redisClient: RedisClient;
  private uniqueId: string;

  private constructor(id: string) {
    const { REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = env;

    this.uniqueId = crypto.createHash('sha256').update(id).digest('hex');

    console.log(this.uniqueId);

    this.redisClient = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.redisClient.on('error', err => {
      throw err;
    });

    this.redisClient.on('connect', () => console.info(`Redis server port: ${this.redisClient.options.port}`));
  }

  public static async getInstance(): Promise<RedisInstance> {
    if (!RedisInstance.instance) {
      const mac = await macaddress.one();
      RedisInstance.instance = new RedisInstance(mac);
    }
    return RedisInstance.instance;
  }

  private prefixKey(key?: string): string {
    return key ? `${this.uniqueId}_` : `${this.uniqueId}_${key}`;
  }

  public getRedisClient(): RedisClient {
    return this.redisClient;
  }

  public async getAll(): Promise<Map<string, unknown>> {
    const keys = await this.redisClient.keys(`${this.prefixKey()}*`);
    const result = new Map<string, unknown>();
    for (const key of keys) {
      const value = await this.redisClient.get(key);
      result.set(key.replace(`${this.prefixKey()}_`, ''), JSON.parse(value as string));
    }
    return result;
  }

  public async get<T>(key: string): Promise<T | undefined> {
    const data = await this.redisClient.get(this.prefixKey(key));
    return data ? JSON.parse(data) : undefined;
  }

  public async set(key: string, value: unknown, ...args: any[]): Promise<void> {
    await this.redisClient.set(this.prefixKey(key), JSON.stringify(value), ...args);
  }

  public async del(key: string): Promise<void> {
    await this.redisClient.del(this.prefixKey(key));
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

export default await RedisInstance.getInstance();
