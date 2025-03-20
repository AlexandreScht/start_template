import type { Services } from '@/interfaces/services';
import AxiosInstance from '@/libs/axiosIntance';
import { AccountService } from './users';

const PrepareServices = (arg?: Services.prepareArg) => {
  const axios = AxiosInstance(arg);
  return {
    //* users
    account: AccountService({ axios }),
  };
};

export default PrepareServices;
