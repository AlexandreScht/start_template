import { ClientException, InvalidArgumentError } from '@/exceptions/errors';
import { ZodError, ZodSchema } from 'zod';

const validator = (validators: ZodSchema<any>, values: object): void | Error => {
  if (!(validators instanceof ZodSchema)) {
    throw new InvalidArgumentError('validators is not a Zod schema');
  }
  try {
    validators.parse(values);
    return;
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const issue = err.issues[0];
      throw new InvalidArgumentError(`Keys < ${issue.path.join('.') || 'unknown'} > ${issue.message}`);
    }
    throw new ClientException(500, 'error validation');
  }
};

export default validator;
