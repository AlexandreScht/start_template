import { ServicesError } from '@/exceptions';
import type Database from '@/types/models/Database';
import { logger } from '@/utils/logger';
import { genSalt, hash } from 'bcryptjs';
import { type Transaction } from 'kysely';
import { Service } from 'typedi';

@Service()
export default class AuthServiceClass {
  public async register(
    data: {
      email: string;
      password?: string;
      first_name: string;
      last_name: string;
      phone?: string;
    },
    trx: Transaction<Database>,
  ) {
    try {
      if (data.password) {
        const salt = await genSalt(10);
        const hashedPassword = await hash(data.password, salt);
        return await trx
          .insertInto('users')
          .values({ ...data, password: hashedPassword })
          .returning(['role', 'id'])
          .executeTakeFirstOrThrow();
      } else {
        return await trx
          .insertInto('users')
          .values({ ...data, validate: true })
          .returning(['role', 'id'])
          .executeTakeFirstOrThrow();
      }
    } catch (error) {
      logger.error('AuthServiceFile.register => ', error);
      throw new ServicesError();
    }
  }
}
