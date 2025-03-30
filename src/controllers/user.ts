import { ServerException } from '@/exceptions';
import { logger } from '@/utils/logger';
import { ControllerMethods, ExpressHandler } from '@interfaces/controllers';

export default class TestControllerFile implements ControllerMethods<TestControllerFile> {
  // private AccountService: AccountServiceFile;

  constructor() {
    // this.AccountService = Container.get(AccountServiceFile);
  }

  protected params_module: ExpressHandler = async ({ res, next }) => {
    try {
      // const ballance = await this.AccountService.getBallance();
      res.status(200).send({ user: 'Alex' });
    } catch (error) {
      console.log(error);

      if (!(error instanceof ServerException)) {
        logger.error('UserControllerFile.account => ', error);
      }
      next(error);
    }
  };
}
