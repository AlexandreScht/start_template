import { ServicesError } from '@/exceptions';
import { BitGetAPI } from '@/utils/axiosGates';
import { logger } from '@/utils/logger';
import { Service } from 'typedi';

@Service()
export default class MarginServiceFile {
  public async placeOrder({ symbol, amount }: { symbol: string; amount: number }): Promise<boolean> {
    try {
      const {
        data: { msg },
      } = await BitGetAPI.post('/api/v2/margin/isolated/place-order', {
        symbol,
        side: 'buy',
        orderType: 'market',
        loanType: 'autoLoan',
        quoteSize: amount,
      });
      return msg === 'success';
    } catch (error) {
      console.log(error);

      logger.error('MarginServiceFile.placeOrder => ', error);
      throw new ServicesError();
    }
  }
  public async getOrder() {
    try {
      const {
        data: { data },
      } = await BitGetAPI.get('/api/v2/margin/isolated/fills?startTime=1733262425391&symbol=XRPUSDT');
      return data;
    } catch (error) {
      console.log(error);

      logger.error('MarginServiceFile.placeOrder => ', error);
      throw new ServicesError();
    }
  }
  // public async placeOrder({ symbol, amount }: { symbol: string; amount: number;}): Promise<boolean> {
  //   try {
  //     const { data: { msg } } = await BitGetAPI.post('/api/margin/v1/isolated/order/placeOrder', {
  //       symbol,
  //       side: 'buy',
  //       orderType: 'market',
  //       loanType: "autoLoan",
  //       quoteAmount: amount,
  //     });
  //     return msg === "success"
  //   } catch (error) {
  //     console.log(error);

  //     logger.error('MarginServiceFile.placeOrder => ', error);
  //     throw new ServicesError();
  //   }
  // }

  public async repaySymbol(symbol: string, amount: number): Promise<{ success: boolean; debtAmount?: number }> {
    try {
      const {
        data: {
          msg,
          data: { remainDebtAmount },
        },
      } = await BitGetAPI.post('/api/v2/margin/isolated/account/repay', {
        symbol,
        coin: 'USDT',
        repayAmount: amount.toString(),
      });

      return { success: msg === 'success', debtAmount: Number.parseInt(remainDebtAmount || 0) };
    } catch (error) {
      logger.error('MarginServiceFile.repaySymbol => ', error);
      throw new ServicesError('Failed to repay symbol');
    }
  }

  public async riskRatio(symbol?: string): Promise<{ symbol: string; riskRateRatio: `${number}` }[]> {
    try {
      const {
        data: { data: res },
      } = await BitGetAPI.get(`/api/v2/margin/isolated/account/risk-rate${symbol ? '?symbol=' + symbol : ''}`);

      return symbol ? res : res.filter((v: any) => v.riskRateRatio !== '0');
    } catch (error) {
      logger.error('MarginServiceFile.repaySymbol => ', error);
      throw new ServicesError('Failed to repay symbol');
    }
  }

  public async positions(
    symbol: string,
    timestamp: number,
    sumBorrowed: number,
  ): Promise<{
    liquidationPrice: number;
    entries: number[];
    sumQuantity: number;
    repay: number;
    sumToken: number;
    MM: number;
    FEE: number;
  }> {
    try {
      const {
        data: {
          data: { resultList },
        },
      } = await BitGetAPI.get(`/api/v2/margin/isolated/financial-records?symbol=${symbol}&startTime=${timestamp}`);

      const filtered = resultList.filter(v => ['deal_in', 'deal_out', 'borrow', 'exchange_in', 'repay'].includes(v.marginType));

      const calcUnifiedLiquidationPrice = (totalBorrowed: number, totalQuantity: number, mm: number, reimbursement = 0) => {
        const effectiveBorrowed = totalBorrowed - reimbursement;
        return effectiveBorrowed / ((1 - mm) * totalQuantity);
      };

      const calcLiquidationPriceSingle = (entryPrice: number, investedTotal: number, borrowed: number, quantity: number, repay = 0, fee: number) => {
        const collateral = investedTotal - (borrowed - repay);
        return entryPrice - (collateral + fee) / quantity;
      };

      const { entries, sumQuantity, repay, sumToken } = filtered.reduce(
        (acc, op) => {
          if (!['deal_in', 'deal_out', 'exchange_in', 'repay'].includes(op.marginType) || acc.otherTrade) return acc;
          switch (op.marginType) {
            case 'exchange_in':
              acc.otherTrade = true;
              break;
            case 'repay':
              acc.repay += Number.parseFloat(op.amount);
              break;
            case 'deal_out':
              const amountOut = Math.abs(Number.parseFloat(op.amount));
              acc.lastOut.amount = op.cTime === acc.lastOut.timeStamp ? Number.parseFloat((amountOut + acc.lastOut.amount).toFixed(5)) : amountOut;
              acc.lastOut.timeStamp = op.cTime;
              acc.sumQuantity += amountOut;
              break;
            case 'deal_in':
              const amountIn = Number.parseFloat(op.amount);
              const newAmountIn = op.cTime === acc.lastIn.timeStamp ? Number.parseFloat((amountIn + acc.lastIn.amount).toFixed(5)) : amountIn;

              acc.lastIn.amount = newAmountIn;
              acc.sumToken += newAmountIn;
              acc.entries.push(acc.lastOut.amount / newAmountIn);
              acc.lastIn.timeStamp = op.cTime;
              break;
            default:
              break;
          }
          return acc;
        },
        {
          repay: 0,
          entries: [] as number[],
          sumQuantity: 0,
          sumToken: 0,
          otherTrade: false,
          lastIn: {
            timeStamp: '',
            amount: 0,
          },
          lastOut: {
            timeStamp: '',
            amount: 0,
          },
        },
      );

      const MM = 0.15;
      const FEE = 0.78244;

      const liquidationPrice =
        entries.length > 1
          ? calcUnifiedLiquidationPrice(sumBorrowed, sumToken, MM, repay)
          : calcLiquidationPriceSingle(entries[0], sumQuantity, sumBorrowed, sumToken, repay, FEE);

      return {
        liquidationPrice,
        sumQuantity,
        repay: repay || 0,
        sumToken,
        entries,
        MM,
        FEE,
      };
    } catch (error) {
      console.log(error);

      logger.error('MarginServiceFile.repaySymbol => ', error);
      throw new ServicesError('Failed to repay symbol');
    }
  }

  public async maxBorrow(symbol: string): Promise<number> {
    try {
      const {
        data: { data: res },
      } = await BitGetAPI.get(`/api/v2/margin/isolated/account/max-borrowable-amount?symbol=${symbol}`);
      return res?.quoteCoinMaxBorrowAmount;
    } catch (error) {
      logger.error('MarginServiceFile.repaySymbol => ', error);
      throw new ServicesError('Failed to repay symbol');
    }
  }
}
