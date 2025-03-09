import config from '@/config';
import { ServicesError } from '@/exceptions';
import { MappedCryptoList, MappedCryptoListMetadata, spotCryptoList } from '@/interfaces/spot';
import { idToken } from '@/utils/axiosConfig';
import { BitGetAPI, MarketCapAPI } from '@/utils/axiosGates';
import { truncateToDecimals } from '@/utils/convertor';
import { logger } from '@/utils/logger';
import { Service } from 'typedi';

@Service()
export default class TokenServiceFile {
  public async metadata(props: MappedCryptoList): Promise<MappedCryptoListMetadata> {
    try {
      const symbols = Array.from(props.keys());
      const data = await MarketCapAPI.metadata(symbols);

      return Object.entries(data).reduce((acc, [symbolKey, value]) => {
        const currentCrypto = props.get(symbolKey.toLocaleLowerCase());

        if (!currentCrypto) return acc;
        const { contractAddress, tradeSymbol, margin } = currentCrypto;
        const specialCryptoId = idToken(symbolKey);
        const crypto = specialCryptoId
          ? value.find(v => v.id === specialCryptoId)
          : value.length === 1
            ? value[0]
            : value.find(v => {
                if (contractAddress === true) {
                  return v?.contract_address.find(a => a?.platform?.name?.toLocaleLowerCase() === v?.name?.toLocaleLowerCase());
                }
                return v?.platform?.token_address === contractAddress;
              });

        if (!crypto) {
          const idFounded = Array.from(acc.keys());
          for (const crypto of value) {
            if (!idFounded.includes(crypto.id)) {
              return acc.set(`${crypto.id}`, {
                logo: crypto.logo,
                tradeSymbol,
                margin,
              });
            }
          }
        }
        return acc.set(`${crypto.id}`, {
          logo: crypto.logo,
          tradeSymbol,
          margin,
        });
      }, new Map() as MappedCryptoListMetadata);
    } catch (error) {
      console.log(error);

      logger.error('TokenServiceFile.metadata => ', error);
      throw new ServicesError();
    }
  }

  public async quotes(props: MappedCryptoListMetadata) {
    try {
      const ids = Array.from(props.keys());
      const data = await MarketCapAPI.quotes(ids);
      return Array.from(data).reduce((acc, [key, value]) => {
        const { logo, tradeSymbol, margin } = props.get(key);
        const {
          quote: {
            USD: { price: currentPrice, percent_change_1h, percent_change_24h, percent_change_7d, percent_change_30d, market_cap },
          },
        } = value;
        acc.push({
          name: value.name,
          symbol: value.symbol,
          icon: logo,
          tradeSymbol,
          margin,
          market_cap,
          price: truncateToDecimals(currentPrice, 8),
          yield: {
            hourly: truncateToDecimals(percent_change_1h, 2),
            daily: truncateToDecimals(percent_change_24h, 2),
            weekly: truncateToDecimals(percent_change_7d, 2),
            monthly: truncateToDecimals(percent_change_30d, 2),
          },
        });
        return acc;
      }, []);
    } catch (error) {
      logger.error('TokenServiceFile.quotes => ', error);
      throw new ServicesError();
    }
  }

  public async getSymbol(symbol: string): Promise<boolean> {
    try {
      const {
        data: { msg: res },
      } = await BitGetAPI.get(`/api/v2/spot/public/symbols?symbol=${symbol.toLocaleLowerCase()}`);
      return res === 'success';
    } catch (error) {
      logger.error('MarginServiceFile.getSymbol => ', error);
      return false;
    }
  }
  public async getPrice(symbol: string): Promise<string> {
    try {
      const {
        data: {
          data: [{ lastPr }],
        },
      } = await BitGetAPI.get(`/api/v2/spot/market/tickers?symbol=${symbol.toLocaleLowerCase()}`);
      return lastPr;
    } catch (error) {
      logger.error('MarginServiceFile.getSymbol => ', error);
      throw new ServicesError('Failed to get price');
    }
  }
}
