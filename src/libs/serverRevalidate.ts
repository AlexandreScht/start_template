import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import AxiosInstance from './axiosIntance';

export default async function serverRevalidate<U extends Services.Config.ServerServiceOption = Services.Config.ServerServiceOption>(
  selector: (services: Services.serverRevalidate.MutationServices<typeof PrepareServices>) => Array<any>,
  options?: U,
): Promise<void | Error> {
  try {
    const axios = AxiosInstance({
      ...options,
      side: 'server',
      revalidate: true,
    });

    const services = selector(PrepareServices);
    services.forEach(service => {
      console.log(service);

      const s = service()(axios);
      if (typeof s === 'function') return s()(axios);
      return s;
    });
  } catch (error) {
    console.log(error);

    throw servicesErrors(error);
  }
}

// serverRevalidate(v => [v.account({ id: 5 }, v => ({ ...v, id: 6 }))]);
// serverRevalidate(v => [v.account({ id: 5 }, { id: 9 })]);
