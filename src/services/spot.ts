import { invalidCrypto } from '@/config/logs';
import { ServicesError } from '@/exceptions';
import { MappedCryptoList, spotCryptoList } from '@/interfaces/spot';
import { authorizedSymbols, blockChainSymbols } from '@/utils/axiosConfig';
import { logger } from '@/utils/logger';
import { BitGetAPI } from '@utils/axiosGates';
import { Service } from 'typedi';

@Service()
export default class SpotServiceFile {
  public async getAvailableList(): Promise<MappedCryptoList> {
    try {
      // Récupération de la liste des symboles
      const {
        data: { data: symbolList },
      } = await BitGetAPI.get('/api/v2/spot/public/symbols');

      // Filtrage et transformation en availableList
      const availableList = (symbolList || [])
        .filter((crypto: Record<string, string>) => crypto.symbol.endsWith('USDT') && crypto.baseCoin !== 'USDC')
        .map((crypto: Record<string, string>) => {
          const symbol = authorizedSymbols(crypto.baseCoin);
          return symbol ? { tradeSymbol: crypto.symbol, symbol } : undefined;
        })
        .filter((v: any) => !!v && !invalidCrypto.includes(v.symbol)) as spotCryptoList[];

      // Récupération des informations détaillées sur les coins
      const {
        data: { data: infoList },
      } = await BitGetAPI.get('/api/v2/spot/public/coins');

      // Enrichissement de la liste avec l'info contractAddress
      const enrichedArray = availableList
        .map(crypto => {
          // Recherche dans infoList l'objet dont la clé coin correspond à crypto.symbol (cas-insensible)
          const coinData = (infoList as any[]).find(v => v.coin.toUpperCase() === crypto.symbol.toUpperCase());
          if (!coinData) return undefined;

          // Si la devise est de type blockchain (cas particulier)
          if (blockChainSymbols(coinData?.coin)) {
            return {
              ...crypto,
              contractAddress: coinData.coin === 'XRP' ? '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe' : true,
            };
          }
          // Vérification des chains disponibles
          if (!coinData?.chains?.length) return undefined;
          const chainWithAddress = coinData.chains.find((v: Record<string, string>) => !!v?.contractAddress);
          if (!chainWithAddress?.contractAddress) return undefined;
          return {
            ...crypto,
            contractAddress: chainWithAddress.contractAddress,
          };
        })
        .filter(v => !!v) as Array<{ tradeSymbol: string; symbol: string; contractAddress: string | boolean }>;

      // Récupération de la liste des devises margin
      const {
        data: { data: marginList },
      } = await BitGetAPI.get('/api/v2/margin/currencies');

      // Création d'un Set pour un lookup rapide : chaque entrée est "BASECOIN-SYMBOL" (en majuscules)
      const marginSet = new Set((marginList || []).map((m: any) => `${m.baseCoin.toUpperCase()}-${m.symbol.toUpperCase()}`));

      // Pour chaque élément enrichi, on ajoute la propriété margin qui est true
      // si la combinaison "symbol-tradeSymbol" se trouve dans marginSet
      const finalArray = enrichedArray.map(item => ({
        ...item,
        margin: marginSet.has(`${item.symbol.toUpperCase()}-${item.tradeSymbol.toUpperCase()}`),
      }));

      // Construction d'un Map où la clé est le symbole en minuscule et la valeur est l'objet enrichi sans la clé symbol
      return finalArray.reduce((acc, item) => {
        const { symbol, ...others } = item;
        acc.set(item.symbol.toLowerCase(), others);
        return acc;
      }, new Map<string, {}>() as MappedCryptoList);
    } catch (error) {
      logger.error('SpotServiceFile.getAvailableList => ', error);
      throw new ServicesError();
    }
  }
}
