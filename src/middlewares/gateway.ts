import { InvalidArgumentError } from '@/exceptions/errors';
import { type ApiRequests } from '@/interfaces/clientApi';
import { type Middlewares } from '@/interfaces/middlewares';
import { type Services } from '@/interfaces/services';
import schemaValidator from '@/validators';
import { ZodError } from 'zod';
import authMw from './auth';
import { logging } from './logs';
import { transform } from './transform';

export async function httpGateway<P extends ApiRequests.setRequest<any, any>>(
  options: (props: Middlewares.httpGateway.RequestDataType<P>) => Middlewares.httpGateway.HttpGatewayConfig<P>,
  deps: Middlewares.httpGateway.deps<P>,
): Promise<Middlewares.httpGateway.DataFromRequest<P>> {
  try {
    const [props, axios] = deps;
    const { validator, request, middlewares } = options(props);

    if (middlewares) {
      const middlewaresSet: Middlewares.httpGateway.MiddlewaresSet<typeof props> = {
        logs: lvl => logging(axios, lvl) as any,
        auth: role => authMw(role) as any,
        transform: (fn: (data: typeof props, transformers: any) => typeof props) => transform(fn, props),
      };

      const results = await Promise.all(
        middlewares(middlewaresSet).map(async result => {
          return result instanceof Promise ? await result : result;
        }),
      );

      const transformedProps = results.find(result => result !== undefined);
      if (transformedProps) {
        const { validator, request } = options(transformedProps);
        return await executeRequest(request, validator, axios);
      }
    }

    return await executeRequest(request, validator, axios);
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const issue = err.issues[0];
      throw new InvalidArgumentError(`Keys < ${issue.path.join('.') || 'unknown'} > ${issue.message}`);
    }
    throw err;
  }
}

async function executeRequest<P extends ApiRequests.setRequest<any, any>>(
  request: Middlewares.httpGateway.HttpGatewayConfig<P>['request'],
  validator: Middlewares.httpGateway.HttpGatewayConfig<P>['validator'],
  axios: Services.Axios.instance,
) {
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
}
