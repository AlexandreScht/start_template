import config from '@/config';
import { addInvalidCryptos } from '@/config/logs';
import { ServicesError } from '@/exceptions';
import { logger } from '@/utils/logger';
import axios, { AxiosError } from 'axios';
import Bottleneck from 'bottleneck';
import { BitGetApiSigned } from './axiosConfig';
// const {
//   apiKey: { EMAILKEY, BREVOKEY },
// } = config;
export class BitGetAPI {
  static async get(uri: string) {
    const timestamp = Date.now().toString();
    const signature = new BitGetApiSigned(config.api.API_SECRET, timestamp, 'GET', uri, undefined).getBitGetSignature();

    return await axios({
      method: 'GET',
      url: uri,
      baseURL: 'https://api.bitget.com',
      headers: {
        'ACCESS-KEY': config.api.API_KEY,
        'ACCESS-SIGN': signature,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-PASSPHRASE': config.api.API_Passphrase,
        locale: 'en-US',
        'Content-Type': 'application/json',
      },
    });
  }
  static async post(uri: string, data: Record<string, any>) {
    const timestamp = Date.now().toString();
    const signature = new BitGetApiSigned(config.api.API_SECRET, timestamp, 'POST', uri, data).getBitGetSignature();

    return await axios({
      method: 'POST',
      url: uri,
      baseURL: 'https://api.bitget.com',
      headers: {
        'ACCESS-KEY': config.api.API_KEY,
        'ACCESS-SIGN': signature,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-PASSPHRASE': config.api.API_Passphrase,
        locale: 'en-US',
        'Content-Type': 'application/json',
      },
      data,
    });
  }
}

export class MarketCapAPI {
  // Limiteur statique
  private static limiter = new Bottleneck({
    // minTime: 250,
    maxConcurrent: 1,
  });

  private static concurrency() {
    return this.limiter;
  }

  private static async _metadataRaw(symbols: string[]) {
    try {
      const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?symbol=${symbols.join(',')}`;
      return axios.get(url, {
        headers: {
          'X-CMC_PRO_API_KEY': config.api.API_MARKET,
        },
      });
    } catch (error) {
      console.log(error.data);
      logger.error('MarketCapAPI._metadataRaw => ', error);
    }
  }

  static async metadata(symbols: string[]): Promise<Record<string, any[]>> {
    try {
      const chunkSize = 100;
      const chunks: string[][] = [];
      for (let i = 0; i < symbols.length; i += chunkSize) {
        chunks.push(symbols.slice(i, i + chunkSize));
      }

      return await chunks.reduce(async (accPromise, chunk) => {
        const acc = await accPromise;
        const {
          data: { data: chunkData },
        } = await this.concurrency().schedule(() => this._metadataRaw(chunk));

        return { ...acc, ...chunkData };
      }, Promise.resolve({} as Record<string, any[]>));
    } catch (error) {
      if (error instanceof AxiosError) {
        const { error_message } = error.response?.data?.status || {};
        if (error_message) {
          const regex = /"symbol":\s*"([^"]+)"/;
          const match = error_message.match(regex);
          if (match) {
            const cryptos = match[1].split(',');
            addInvalidCryptos(cryptos);
          }
        }
      }

      logger.error('MarketCapAPI.metadata => ', error);
      throw new ServicesError();
    }
  }

  private static async _quotesRaw(ids: string[]) {
    try {
      const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${ids.join(',')}`;
      return axios.get(url, {
        headers: {
          'X-CMC_PRO_API_KEY': config.api.API_MARKET,
        },
      });
    } catch (error) {
      console.log(error);

      logger.error('MarketCapAPI._quotesRaw => ', error);
      throw new ServicesError();
    }
  }

  static async quotes(ids: string[]) {
    try {
      const chunkSize = 100;
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += chunkSize) {
        chunks.push(ids.slice(i, i + chunkSize));
      }

      const results = new Map();
      for (const chunk of chunks) {
        const {
          data: { data },
        } = await this.concurrency().schedule(() => this._quotesRaw(chunk));
        Object.entries(data).map(([ids, value]) => {
          results.set(ids, value);
        });
      }
      return results;
    } catch (error) {
      logger.error('MarketCapAPI.quotes => ', error);
      throw new ServicesError();
    }
  }
}
