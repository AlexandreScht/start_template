import { InsufficientFund, InvalidToken, ServerException, ServicesError } from '@/exceptions';
import MarginServiceFile from '@/services/margin';
import TokenServiceFile from '@/services/tokens';
import { truncateToDecimals } from '@/utils/convertor';
import { logger } from '@/utils/logger';
import { assetMethod, ControllerMethods, ExpressHandler, IsolatedMethod, RepayMethod } from '@interfaces/controllers';
import AccountServiceFile from '@services/account';
import Container from 'typedi';

export default class MarginControllerFile implements ControllerMethods<MarginControllerFile> {
  private AccountService: AccountServiceFile;
  private TokenService: TokenServiceFile;
  private MarginService: MarginServiceFile;
  private queue: Promise<void> = Promise.resolve();

  constructor() {
    this.AccountService = Container.get(AccountServiceFile);
    this.TokenService = Container.get(TokenServiceFile);
    this.MarginService = Container.get(MarginServiceFile);
  }

  protected isolatedMargin: ExpressHandler<IsolatedMethod> = async ({
    res,
    locals: {
      body: { symbols, balance, weekPeriod, leverage },
    },
    next,
  }) => {
    try {
      // const accountBallance = await this.AccountService.getBallance()
      // if (balance > accountBallance) {
      //   throw new InsufficientFund()
      // }
      const valueByCrypto = balance / weekPeriod / symbols.length;
      for (const symbol of symbols) {
        const exist = await this.TokenService.getSymbol(symbol);
        if (!exist) {
          throw new InvalidToken(symbol);
        }
      }
      for (const symbol of symbols) {
        await this.AccountService.transferToken(valueByCrypto, 'spot', symbol);
        await this.MarginService.placeOrder({ symbol, amount: valueByCrypto * leverage });
      }
      res.status(200).send(true);
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.register => ', error);
      }
      next(error);
    }
  };

  protected repayToken: ExpressHandler<RepayMethod> = async ({
    locals: {
      body: { symbol, amount },
    },
    res,
    next,
  }) => {
    try {
      const accountBallance = await this.AccountService.getBallance();
      if (amount > accountBallance) {
        throw new InsufficientFund();
      }
      const exist = await this.TokenService.getSymbol(symbol);
      if (!exist) {
        throw new InvalidToken(symbol);
      }
      await this.AccountService.transferToken(amount, 'spot', symbol);
      const { success, debtAmount } = await this.MarginService.repaySymbol(symbol, amount);
      if (!success) {
        throw new ServicesError('Failed to repay symbol');
      }
      if (debtAmount === 0) {
        // transferer en spot
      }
      res.status(200).send({ success });
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AccountControllerFile.repay => ', error);
      }
      next(error);
    }
  };

  private async schedule<T>(fn: () => Promise<T>, delay: number): Promise<T> {
    this.queue = this.queue.then(() => new Promise<void>(resolve => setTimeout(resolve, delay)));
    return this.queue.then(fn);
  }

  protected marginRisk: ExpressHandler<assetMethod> = async ({ locals: { params }, res, next }) => {
    try {
      if (params?.asset) {
        const [tokens] = await this.AccountService.getMarginAsset(params.asset);
        const [assets] = await this.MarginService.riskRatio(params.asset);
        res.status(200).send({ tokens, assets });
        return;
      }
      const tokens = await this.AccountService.getMarginAsset();
      const assets = await this.MarginService.riskRatio();

      const isolatedTokensPromises = tokens.map(async token => {
        const asset = assets.find(v => v.symbol === token.symbol);
        if (!asset) return null;
        const { borrow, interest, created } = token;
        const { symbol, riskRateRatio } = asset;

        const currentPrice = await this.schedule(() => this.TokenService.getPrice(token.symbol), 50);

        const liquidation = await this.schedule(() => this.MarginService.positions(symbol, created, Math.abs(Number.parseFloat(borrow))), 100);

        return {
          sumBorrowed: Math.abs(truncateToDecimals(borrow, 2)),
          interest: truncateToDecimals(interest, 2),
          riskRateRatio: Number.parseFloat(riskRateRatio),
          symbol: symbol.replace('USDT', ''),
          currentPrice: Number.parseFloat(currentPrice),
          ...liquidation,
        };
      });

      const isolateTokens = (await Promise.all(isolatedTokensPromises)).filter(token => token !== null);

      res.status(200).send(isolateTokens);
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AccountControllerFile.transfer => ', error);
      }
      next(error);
    }
  };
}
