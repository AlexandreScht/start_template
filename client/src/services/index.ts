import * as AuthServices from './auth';
import { TestParamsService } from './users';

const PrepareServices = {
  //* test
  testParams: TestParamsService,
  ...AuthServices,
};

export default PrepareServices;
