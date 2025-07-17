import { ServerException } from '@/exceptions';
import UsersModel from '@/models/users';
import { logger } from '@/utils/logger';

export default class testControllerFile {
  constructor() {}

  protected simple_request = async ({ res, next }) => {
    try {
      await UsersModel.deleteWhere({
        id: ({ between, op, fn }) =>
          between(1, 5)
            .and([op('>', 5), op(fn.avg(), '<', 5), op(fn.count(), '=', 2), op(fn.max(), '=', 3)])
            .or(op(fn.min(), '=', 4)),
      }).execute();

      await UsersModel.deleteFrom().where(eb => eb());

      return res.status(200).json(access_token);
    } catch (error) {
      console.log(error);

      if (!(error instanceof ServerException)) {
        logger.error('UserControllerFile.account => ', error);
      }
      next(error);
    }
  };
}

//! a corriger le types
