import { z } from 'zod';

//? int
export const numberValidator = z.number().int({ message: 'Invalid type. A ≪ number ≫ type is required.' });

//? string
export const stringValidator = z.string({ message: 'Invalid type. A ≪ string ≫ type is required.' });
export const roleValidator = z.enum(['admin', 'business', 'pro', 'free'], { message: 'Invalid choice. The value must be one of the valid options.' });
