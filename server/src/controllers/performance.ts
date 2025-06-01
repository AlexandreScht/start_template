import { ServerException } from '@/exceptions';
import { logger } from '@/utils/logger';
import { type ControllerMethods, type ExpressHandler } from '@interfaces/controllers';

export default class PerfControllerFile implements ControllerMethods<PerfControllerFile> {
  constructor() {}

  protected simple_request: ExpressHandler = async ({ res, next }) => {
    try {
      res.status(200).send('Success to receive data from localhost server ir0ws');
    } catch (error) {
      console.log(error);

      if (!(error instanceof ServerException)) {
        logger.error('UserControllerFile.account => ', error);
      }
      next(error);
    }
  };
}
