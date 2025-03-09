import AxiosInstance from '@/libs/axiosIntance';
import { AccountService } from './users';

const PrepareServices = (arg: any) => {
  const axios = AxiosInstance(arg);
  return {
    //* users
    account: AccountService({ axios }),
  };
};

export default PrepareServices;
