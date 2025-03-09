import { ServerException } from '@/exceptions';
import SpotServiceFile from '@/services/spot';
import TokenServiceFile from '@/services/tokens';
import { logger } from '@/utils/logger';
import { ControllerMethods, ExpressHandler } from '@interfaces/controllers';
import { Vibrant } from 'node-vibrant/node';
import Container from 'typedi';
export default class SpotControllerFile implements ControllerMethods<SpotControllerFile> {
  private SpotService: SpotServiceFile;
  private TokenService: TokenServiceFile;

  constructor() {
    this.SpotService = Container.get(SpotServiceFile);
    this.TokenService = Container.get(TokenServiceFile);
  }

  protected spotList: ExpressHandler = async ({ res, next }) => {
    try {
      const cryptoList = await this.SpotService.getAvailableList();
      // console.log(Array.from(cryptoList).find(([key, v]) => key === "kas"));

      const metadataList = await this.TokenService.metadata(cryptoList);
      const spotList = await this.TokenService.quotes(metadataList);

      spotList.sort((a, b) => b.market_cap - a.market_cap);

      res.status(200).send(spotList);
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.spotList => ', error);
      }
      next(error);
    }
  };
}
