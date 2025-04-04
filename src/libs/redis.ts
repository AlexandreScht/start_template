import env from '@/config';
import { SkipInTest } from '@/decorators/skipInTest';
import { ServerException } from '@/exceptions';
import { logger } from '@/utils/logger';
import Redis, { type Redis as RedisClient } from 'ioredis';

class RedisInstance {
  private static instance: RedisInstance;
  protected redisClient: RedisClient;

  private constructor() {
    const { REDIS_PASSWORD, REDIS_PORT } = env;

    this.redisClient = new Redis({
      host: '127.0.0.1',
      port: Number(REDIS_PORT),
      ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.redisClient.on('error', err => {
      logger.error('Redis Client Error', err);
      throw new ServerException();
    });

    this.redisClient.on(
      'connect',
      SkipInTest(() => {
        console.info(`             Redis server port: ${this.redisClient.options.port}`);
      })(),
    );
  }

  public static getInstance(): RedisInstance {
    if (!RedisInstance.instance) {
      RedisInstance.instance = new RedisInstance();
    }
    return RedisInstance.instance;
  }

  /**
   * Stocke une valeur dans Redis en sérialisant l'objet en JSON.
   * @param key La clé.
   * @param value La valeur à stocker.
   */
  public async set<T>(key: string, value: T): Promise<void> {
    await this.redisClient.set(key, JSON.stringify(value));
  }

  /**
   * Récupère la valeur associée à une clé et la désérialise en JSON.
   * @param key La clé.
   * @returns La valeur de type T ou null si la clé n'existe pas.
   */
  public async get<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  /**
   * Vérifie l'existence d'une clé.
   * @param key La clé.
   * @returns true si la clé existe, false sinon.
   */
  public async has(key: string): Promise<boolean> {
    const exists = await this.redisClient.exists(key);
    return exists === 1;
  }

  /**
   * Supprime une clé.
   * @param key La clé à supprimer.
   * @returns Le nombre de clés supprimées (0 ou 1).
   */
  public async delete(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  /**
   * Récupère toutes les valeurs correspondant à un pattern.
   * Utilise la commande SCAN pour récupérer les clés correspondantes puis MGET pour les valeurs.
   * @param pattern Le pattern de recherche (ex: 'wss:*').
   * @returns Un tableau de valeurs de type T.
   */
  public async getAll<T>(pattern: string): Promise<T[]> {
    let cursor = '0';
    const keys: string[] = [];

    // Parcours itératif avec SCAN
    do {
      const [nextCursor, foundKeys] = await this.redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');

    if (keys.length === 0) {
      return [];
    }

    const values = await this.redisClient.mget(...keys);
    return values.filter((v): v is string => v !== null).map(v => JSON.parse(v) as T);
  }

  public async disconnect(): Promise<void> {
    try {
      await this.redisClient.quit();
      console.info('Redis connection closed.');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }
}

export default RedisInstance.getInstance();
