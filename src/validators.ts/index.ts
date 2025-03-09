import { z } from 'zod';

export const stringValidator = z.string();
export const numberValidator = z.number().int();
export const decimal = (decimals: number) => (schema: z.ZodNumber) =>
  schema.refine(
    val => {
      const parts = val.toString().split('.');
      const decimalPart = parts[1];
      return !decimalPart || decimalPart.length <= decimals;
    },
    {
      message: `Le nombre ne doit pas avoir plus de ${decimals} décimales`,
    },
  );
