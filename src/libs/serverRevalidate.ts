import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import AxiosInstance from './axiosIntance';

export default async function serverRevalidate<U extends Services.Config.ServerServiceOption = Services.Config.ServerServiceOption>(
  selector: (services: Services.serverRevalidate.MutationServices<typeof PrepareServices>) => Array<any>,
  options?: U,
): Promise<void | Error> {
  try {
    const wrappedServices: Services.serverRevalidate.MutationServices<typeof PrepareServices> = Object.entries(PrepareServices).reduce(
      (acc, [key, service]) => {
        (acc as any)[key] = (route: any, revalidateArgs?: (v: unknown) => unknown | unknown) => {
          return () => {
            const axios = AxiosInstance({
              ...options,
              side: 'server',
              revalidate: true,
              revalidateArgs,
            });
            return service(route)(axios);
          };
        };
        return acc;
      },
      {} as Services.serverRevalidate.MutationServices<typeof PrepareServices>,
    );

    const services = selector(wrappedServices);
    services.forEach(service => service());
  } catch (error) {
    throw servicesErrors(error);
  }
}

// serverRevalidate(v => [v.account({ id: 5 }, v => ({ ...v, id: 6 }))]);
// serverRevalidate(v => [v.account({ id: 5 }, { id: 9 })]);
