import { ServerException } from '@/exceptions';
import { logger } from '@/utils/logger';
import { assetMethod, ControllerMethods, ExpressHandler } from '@interfaces/controllers';
import AccountServiceFile from '@services/account';
import Container from 'typedi';

export default class AccountControllerFile implements ControllerMethods<AccountControllerFile> {
  private AccountService: AccountServiceFile;

  constructor() {
    this.AccountService = Container.get(AccountServiceFile);
  }

  protected ballance: ExpressHandler = async ({ res, next }) => {
    try {
      const ballance = await this.AccountService.getBallance();
      res.status(200).send({ res: ballance });
    } catch (error) {
      console.log(error);

      if (!(error instanceof ServerException)) {
        logger.error('AccountControllerFile.ballance => ', error);
      }
      next(error);
    }
  };

  protected transfer: ExpressHandler = async ({ res, next }) => {
    try {
      const ballance = await this.AccountService.getBallance();
      res.status(200).send({ ballance });
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AccountControllerFile.transfer => ', error);
      }
      next(error);
    }
  };

  protected marginAsset: ExpressHandler<assetMethod> = async ({ locals: { params }, res, next }) => {
    try {
      const assets = await this.AccountService.getMarginAsset(params?.asset);
      res.status(200).send({ assets });
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AccountControllerFile.transfer => ', error);
      }
      next(error);
    }
  };
}
