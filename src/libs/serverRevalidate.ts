import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import AxiosInstance from './axiosIntance';

export default async function serverRevalidate(
  selector: (services: Services.serverRevalidate.MutationServices<typeof PrepareServices>) => Array<any>,
  defaultOption?: Services.Config.globalMutationOptions,
): Promise<void> {
  try {
    const axios = AxiosInstance({ ...options, side: 'server', revalidate: true });
    const data = await selector(PrepareServices)(axios);
    return { data };
  } catch (error) {
    return { error: servicesErrors(error) };
  }
}

// serverRevalidate(v => [v.account({ i})]);
