import { ServerException } from '@/exceptions';
import { logger } from '@/utils/logger';
import { assetMethod, ControllerMethods, ExpressHandler } from '@interfaces/controllers';
import AccountServiceFile from '@services/account';
import Container from 'typedi';

export default class UserControllerFile implements ControllerMethods<UserControllerFile> {
  // private AccountService: AccountServiceFile;

  constructor() {
    // this.AccountService = Container.get(AccountServiceFile);
  }

  protected account: ExpressHandler = async ({ res, next }) => {
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
