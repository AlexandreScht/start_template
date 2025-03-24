import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import PrepareServices from '@/services';
import AxiosInstance from './axiosIntance';

export default async function serverService<U extends Services.Config.ServerServiceOption = Services.Config.ServerServiceOption, R = any>(
  selector: Services.serverService.ServerServiceSelector<R>,
  options?: U,
): Promise<Services.serverService.response<R>> {
  try {
    const axios = AxiosInstance({ ...options, side: 'server' });
    const data = await selector(PrepareServices)(axios);
    return { data };
  } catch (error) {
    return { error: servicesErrors(error) };
  }
}
