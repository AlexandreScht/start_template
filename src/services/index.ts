import { Services } from '@/interfaces/services';
import AxiosInstance from '@/libs/axiosIntance';
import { AccountService } from './users';

const PrepareServices = (arg?: Services.headerOption) => {
  const axios = AxiosInstance(arg);
  return {
    //* users
    account: AccountService({ axios }),
  };
};

export default PrepareServices;
