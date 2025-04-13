import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
// import { revalidateTag } from 'next/cache';
import { revalidateTag } from 'next/cache';
import axiosInstance from './revalidateInstance';

export default async function serverRevalidate(
  selector: (services: Services.serverRevalidate.MutationServices<typeof PrepareServices>) => Array<any>,
  options?: Services.Config.serverCache,
): Promise<void | Error> {
  try {
    const axios = axiosInstance(options);

    const services = selector(PrepareServices);
    services.forEach(async service => {
      const s = service(axios);
      if (typeof s === 'function') {
        s(axios);
        return;
      }
      const { data } = await s;

      if (data?.xTag) {
        revalidateTag(data?.xTag);
      }
      return;
    });
  } catch (error) {
    console.log(error);

    throw servicesErrors(error);
  }
}

// serverRevalidate(v => [v.account({ id: 5 }, v => ({ ...v, id: 6 }))]);
// serverRevalidate(v => [v.account({ id: 5 }, { id: 9 })]);
