import { emailValidator, numberValidator, passwordValidator, stringValidator } from '@/utils/zodValidates';
import { z } from 'zod';

export const userSchema = z.object({
  id: numberValidator,
});

export const loginSchema = z
  .object({
    email: emailValidator,
    password: passwordValidator,
    confirmPassword: stringValidator,
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Password must be the same',
    path: ['confirmPassword'],
  });

export const oAuthSchema = z.object({
  at_hash: stringValidator,
  id_token: stringValidator,
});
