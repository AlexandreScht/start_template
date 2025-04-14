import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
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

function revalidateService(res: { data: { xTags: string | string[] } }) {
  const { data } = res;
  if (!data?.xTags) {
    return;
  }
  const { xTags } = data;
  console.log(xTags);

  if (Array.isArray(xTags)) {
    xTags.forEach(v => revalidateTag(v));
  } else {
    revalidateTag(xTags);
  }
}

// serverRevalidate(v => [v.account({ id: 5 }, v => ({ ...v, id: 6 }))]);
// serverRevalidate(v => [v.account({ id: 5 }, { id: 9 })]);
