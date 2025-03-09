import { numberValidator } from '@/utils/zodValidates';
import { z } from 'zod';

export const userSchema = z.object({
  id: numberValidator,
});
