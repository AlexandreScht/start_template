import { z } from 'zod';
import { decimal, numberValidator, stringValidator } from '.';

export const boughtSchema = z.object({
  symbols: z.array(stringValidator),
  balance: numberValidator,
  weekPeriod: numberValidator,
  leverage: numberValidator.optional().default(2),
});

export const repaySchema = z.object({
  symbol: stringValidator,
  amount: decimal(8)(numberValidator.min(0)),
});
