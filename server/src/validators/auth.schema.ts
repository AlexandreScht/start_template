import { z } from 'zod';
import { emailValidator, numberValidator, passwordValidator, phoneValidator, stringValidator } from '.';

export const loginSchema = {
  body: z.object({
    email: emailValidator,
    password: stringValidator,
  }),
};
export const resetPasswordSchema = z
  .object({
    password: passwordValidator,
    confirm_password: stringValidator,
  })
  .refine(data => data.password === data.confirm_password, {
    message: 'Password must be the same',
    path: ['confirmPassword'],
  });

export const registerSchema = {
  body: z.intersection(
    z.object({
      email: emailValidator,
      first_name: stringValidator,
      last_name: stringValidator,
      phone: phoneValidator.optional(),
    }),
    resetPasswordSchema,
  ),
};

export const validateAccountSchema = {
  body: z.object({
    access_code: numberValidator.min(1000).max(9999),
  }),
  token: stringValidator,
};

export const askCodeSchema = z.object({
  code: numberValidator.min(1000).max(9999),
});

export const verify2FASchema = z.object({
  otp: numberValidator.min(100000).max(999999),
});

export const activate2FASchema = z
  .object({
    twoFactorType: z.enum(['email', 'authenticator']),
  })
  .merge(verify2FASchema);
