import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import axiosInstance from '@/libs/revalidateInstance';
import PrepareServices from '@/services';
import { revalidateTag } from 'next/cache';

export default async function useServerRevalidate(
  selector: (services: Services.serverRevalidate.MutationServices<typeof PrepareServices>) => Array<any>,
  options?: Services.Config.serverCache,
): Promise<void | Error> {
  try {
    const axios = axiosInstance(options);

    const services = selector(PrepareServices);
    services.forEach(async service => {
      const s = service(axios);
      if (typeof s === 'function') {
        revalidateService(await s(axios));
        return;
      }
      revalidateService(await s);
      return;
    });
  } catch (error) {
    console.log(error);

    throw servicesErrors(error);
  }
}

function revalidateService(res: Services.Axios.AxiosRevalidateResponse) {
  const { xTags } = res;
  if (!xTags) {
    return;
  }
  if (Array.isArray(xTags)) {
    xTags.forEach(v => revalidateTag(v));
  } else {
    revalidateTag(xTags);
  }
}

// serverRevalidate(v => [v.account({ id: 5 }, v => ({ ...v, id: 6 }))]);
// serverRevalidate(v => [v.account({ id: 5 }, { id: 9 })]);
