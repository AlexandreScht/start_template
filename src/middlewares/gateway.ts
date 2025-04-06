import { InvalidArgumentError } from '@/exceptions/errors';
import { type ApiRequests } from '@/interfaces/clientApi';
import { type Middlewares } from '@/interfaces/middlewares';
import schemaValidator from '@/validators';
import { ZodError } from 'zod';

export async function httpGateway<P extends ApiRequests.setRequest<any, any>>(
  options: (props: Middlewares.httpGateway.RequestDataType<P>) => Middlewares.httpGateway.HttpGatewayConfig<P>,
  deps: Middlewares.httpGateway.deps<P>,
): Promise<Middlewares.httpGateway.DataFromRequest<P>> {
  try {
    const [props, axios] = deps;
    const { validator, request } = options(props);
    if (!request) {
      throw new InvalidArgumentError('Request argument is required !');
    }

    if (validator && !axios?.revalidate) {
      validator(schemaValidator);
    }

    const res = request(axios);

    if (Array.isArray(res)) {
      const [promise, validatorFn] = res;
      const { data } = await promise;
      validatorFn(data);
      return data;
    }
    const { data } = await res;
    return data;
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const issue = err.issues[0];
      throw new InvalidArgumentError(`Keys < ${issue.path.join('.') || 'unknown'} > ${issue.message}`);
    }
    throw err;
  }
}

// export async function httpGateway<Req extends ApiRequests.setRequest<any, any> = ApiRequests.setRequest<any, unknown>>(
//   args: Middlewares.httpGateway.HttpGatewayConfig<Req>,
//   deps: [Services.Axios.instance],
// ): Promise<{ data: Middlewares.httpGateway.DataFromRequest<Req> }> {
//   try {
//     const [axios] = deps;
//     const { validator, request } = args;
//     if (!request) {
//       throw new InvalidArgumentError('Request argument is required !');
//     }

//     if (validator && !axios?.revalidate) {
//       validator(schemaValidator);
//     }
//     return request(axios);
//   } catch (err: unknown) {
//     if (err instanceof ZodError) {
//       const issue = err.issues[0];
//       throw new InvalidArgumentError(`Keys < ${issue.path.join('.') || 'unknown'} > ${issue.message}`);
//     }
//     throw err;
//   }
// }
