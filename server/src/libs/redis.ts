import env from '@/config';
import { SkipInTest } from '@/decorators/skipInTest';
import { ServerException } from '@/exceptions';
import { logger } from '@/utils/logger';
import Redis, { type Redis as RedisClient } from 'ioredis';

interface RedisSetOptions {
  NX?: boolean; // équivaut à 'NX'
  XX?: boolean; // équivaut à 'XX'
  EX?: number; // secondes  -> 'EX'
  PX?: number; // millisecondes -> 'PX'
  GET?: boolean; // renvoyer l'ancienne valeur
}
export default class RedisInstance {
  private static instance: RedisInstance;
  protected redisClient: RedisClient;

  private constructor() {
    const { REDIS_PASSWORD, REDIS_PORT, REDIS_HOST } = env;

    this.redisClient = new Redis({
      host: REDIS_HOST,
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
  // 1) Sans options
  public async set<T>(key: string, value: T, opts: RedisSetOptions = {}): Promise<'OK' | null | string> {
    const args: (string | number)[] = [key, JSON.stringify(value)];

    if (opts.EX !== undefined) args.push('EX', opts.EX);
    if (opts.PX !== undefined) args.push('PX', opts.PX);
    if (opts.NX) args.push('NX');
    if (opts.XX) args.push('XX');
    if (opts.GET) args.push('GET');

    // @ts-expect-error -> variadic, ioredis accepte string[]
    return this.redisClient.set(...(args as any));
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
  public async getAll<T>(pattern: string, deleteAfter: boolean = false): Promise<T[]> {
    let cursor = '0';
    const keys: string[] = [];

    do {
      const [nextCursor, foundKeys] = await this.redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');

    if (keys.length === 0) {
      return [];
    }

    const values = await this.redisClient.mget(...keys);
    if (deleteAfter) await Promise.all(keys.map(key => this.delete(key)));
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
