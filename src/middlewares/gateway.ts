import { InvalidArgumentError } from '@/exceptions/errors';
import { type ApiRequests } from '@/interfaces/clientApi';
import { type Middlewares } from '@/interfaces/middlewares';
import { type Services } from '@/interfaces/services';
import schemaValidator from '@/validators';
import { ZodError } from 'zod';

export async function httpGateway<Req extends ApiRequests.setRequest<any, any> = ApiRequests.setRequest<any, unknown>>(
  args: Middlewares.httpGateway.HttpGatewayConfig<Req>,
  deps: [Services.Axios.instance],
): Promise<{ data: Middlewares.httpGateway.DataFromRequest<Req> }> {
  try {
    const [axios] = deps;
    const { validator, request } = args;
    if (!request) {
      throw new InvalidArgumentError('Request argument is required !');
    }
    if (validator && !axios?.revalidate) {
      validator(schemaValidator);
    }
    return request(axios);
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const issue = err.issues[0];
      throw new InvalidArgumentError(`Keys < ${issue.path.join('.') || 'unknown'} > ${issue.message}`);
    }
    throw err;
  }
}
