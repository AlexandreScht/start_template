import { ServerException } from '@/exceptions';
import { logger } from '@/utils/logger';
import { type ControllerMethods, type ExpressHandler } from '@interfaces/controllers';

export default class UserControllerFile implements ControllerMethods<UserControllerFile> {
  // private AccountService: AccountServiceFile;

  constructor() {
    // this.AccountService = Container.get(AccountServiceFile);
  }

  protected params_module: ExpressHandler = async ({ res, next }) => {
    try {
      // const ballance = await this.AccountService.getBallance();

      res.status(200).send({ user: 'AlexPopof' });
    } catch (error) {
      console.log(error);

      if (!(error instanceof ServerException)) {
        logger.error('UserControllerFile.account => ', error);
      }
      next(error);
    }
  };
}
