import dbInstance from '@/database/pg';
import type Database from '@/types/models/Database';
import { logger } from '@/utils/logger';
import { type Transaction } from 'kysely';
import { Service } from 'typedi';

@Service()
export default class QueryBuilder {
  private db: typeof dbInstance.getDb;
  constructor() {
    this.db = dbInstance.getDb;
  }

  public async transactionBuilder<T, V>(
    serviceFn: (trx: Transaction<Database>) => Promise<T>,
    logicFn: (result: T, trx: Transaction<Database>) => Promise<V>,
  ): Promise<V> {
    try {
      return await this.db.transaction().execute(async trx => {
        const result = await serviceFn(trx);
        return logicFn(result, trx);
      });
    } catch (error) {
      logger.error('QueryBuilderFile.transactionBuilder => ', error);
      throw error;
    }
  }
}
