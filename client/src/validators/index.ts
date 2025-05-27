import { type z, type ZodTypeAny } from 'zod';
import * as userSchemas from './users';

const prepareSchemas = {
  ...userSchemas,
};

function createSchemaValidator<T extends Record<string, ZodTypeAny>>(
  schemas: T,
): {
  [K in keyof T]: (data: z.input<T[K]>) => z.infer<T[K]>;
} {
  const validators = {} as { [K in keyof T]: (data: z.input<T[K]>) => z.infer<T[K]> };
  for (const key in schemas) {
    validators[key] = (data: z.input<T[typeof key]>) => schemas[key].parse(data);
  }
  return validators;
}
const schemaValidator = createSchemaValidator(prepareSchemas);
export default schemaValidator;
