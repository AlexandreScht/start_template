import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import axiosInstance from './revalidateInstance';

export default async function serverRevalidate(
  selector: (services: Services.serverRevalidate.MutationServices<typeof PrepareServices>) => Array<any>,
  options?: Services.Config.serverCache,
): Promise<void | Error> {
  try {
    const axios = axiosInstance(options);

    const services = selector(PrepareServices);
    services.forEach(service => {
      const s = service(axios);
      if (typeof s === 'function') return s(axios);
      return s;
    });
  } catch (error) {
    console.log(error);

    throw servicesErrors(error);
  }
}

// serverRevalidate(v => [v.account({ id: 5 }, v => ({ ...v, id: 6 }))]);
// serverRevalidate(v => [v.account({ id: 5 }, { id: 9 })]);
