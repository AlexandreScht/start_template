import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import { unstable_cache } from 'next/cache';
import { v7 as uuid } from 'uuid';
import AxiosInstance from './axiosIntance';

export default async function serverService<
  U extends Services.Config.ServerServiceOption = Services.Config.ServerServiceOption,
  R = any,
>(selector: Services.serverService.ServerServiceSelector<R>, options?: U): Promise<Services.serverService.response<R>> {
  try {
    // const axios = AxiosInstance({ ...options, side: 'server' });
    // const data = await selector(PrepareServices)(axios);

    //! options?.cache?.lifeTime
    //! options?.cache?.persist

    const xTag = uuid();
    const axios = AxiosInstance({ ...options, side: 'server', xTag });
    const res = await selector(PrepareServices)(axios);
    const data = await unstable_cache(
      async () => {
        return res;
      },
      [xTag],
      {
        revalidate: 180, // 3 min
        tags: [xTag],
      },
    )();

    return { data };
  } catch (error) {
    return { error: servicesErrors(error) };
  }
}
