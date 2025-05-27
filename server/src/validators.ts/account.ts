import { z } from 'zod';
import { stringValidator } from '.';

export const transferSchema = z.object({
  symbol: stringValidator,
  letterCode: z.enum(['C', 'D', 'R']),
  postal: z.number().int(),
  code: z.number().int(),
  lat: z.number().min(-90, { message: 'Latitude must be at least -90' }).max(90, { message: 'Latitude must be at most 90' }),
  lng: z.number().min(-180, { message: 'Longitude must be at least -180' }).max(180, { message: 'Longitude must be at most 180' }),
  parentZone: z
    .object({
      region: z.object({
        label: stringValidator,
        postal: z.number().int(),
      }),
      department: z
        .object({
          label: stringValidator,
          postal: z.number().int(),
        })
        .optional(),
    })
    .optional(),
});

export const assetSchema = z.object({
  symbol: stringValidator.optional(),
});
