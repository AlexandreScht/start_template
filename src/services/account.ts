import { ServicesError } from '@/exceptions';
import { isolatedAsset } from '@/interfaces/bitget';
import { BitGetAPI } from '@/utils/axiosGates';
import { logger } from '@/utils/logger';
import { Service } from 'typedi';

@Service()
export default class AccountServiceFile {
  public async getBallance(): Promise<number> {
    try {
      const {
        data: {
          data: [{ available }],
        },
      } = await BitGetAPI.get('/api/v2/spot/account/assets?coin=USDT');
      return Math.trunc(Number.parseFloat(available) * 100) / 100;
    } catch (error) {
      logger.error('AccountServiceFile.getBallance => ', error);
      throw new ServicesError();
    }
  }
  public async transferToken(amount: number, account: 'margin' | 'spot', symbol: string): Promise<boolean> {
    try {
      const [fromType, toType] = account === 'spot' ? ['spot', 'isolated_margin'] : ['isolated_margin', 'spot'];
      const {
        data: { msg },
      } = await BitGetAPI.post('/api/v2/spot/wallet/transfer', {
        fromType,
        toType,
        amount,
        coin: 'USDT',
        symbol: symbol.toLocaleLowerCase(),
      });
      return msg === 'success';
    } catch (error) {
      console.log(error);

      logger.error('AccountServiceFile.transferToken => ', error);
      throw new ServicesError();
    }
  }
  public async getMarginAsset(symbol?: string): Promise<isolatedAsset[]> {
    try {
      const {
        data: { data: res },
      } = await BitGetAPI.get(`/api/v2/margin/isolated/account/assets${symbol ? '?symbol=' + symbol : ''}`);
      if (symbol) {
        const usToken = res.find((v: isolatedAsset & { coin: string }) => v.coin === 'USDT');
        const cryptoToken = res.find((v: isolatedAsset & { coin: string }) => v.coin !== 'USDT');
        return [
          {
            symbol: usToken.symbol,
            borrow: usToken.net,
            interest: usToken.interest,
            totalAmount: cryptoToken.totalAmount,
            created: cryptoToken.cTime,
          },
        ];
      }
      const filteredRes = res.filter((v: isolatedAsset) => v.totalAmount !== '0');
      return Object.values(
        filteredRes.reduce((acc, token) => {
          const existing = acc[token.symbol] || {};
          if (token.coin === 'USDT') {
            acc[token.symbol] = {
              ...existing,
              symbol: token.symbol,
              borrow: token.net,
              interest: token.interest,
              created: token.cTime,
            };
          } else {
            acc[token.symbol] = {
              ...existing,
              symbol: token.symbol,
              totalAmount: token.totalAmount,
            };
          }

          return acc;
        }, {}),
      );
    } catch (error) {
      console.log(error);

      logger.error('AccountServiceFile.getMarginAsset => ', error);
      throw new ServicesError();
    }
  }
}
