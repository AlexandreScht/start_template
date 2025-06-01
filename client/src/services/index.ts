import * as AuthServices from './auth';
import * as PerfServices from './perf';

const PrepareServices = {
  //* test
  ...PerfServices,
  ...AuthServices,
};

export default PrepareServices;
