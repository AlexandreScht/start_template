import { Services } from "@/interfaces/services";
import PrepareServices from "@/services";

type ServiceSelector = (services: typeof PrepareServices) => (axios: Services.Axios.instance) => Promise<any>;

type BrandedServiceSelector = {
  __brand: 'ServiceSelector';
  fn: (axios: Services.Axios.instance) => Promise<any>;
};

export default function serviceSelector(fnService: ServiceSelector) {
  return { __brand: 'ServiceSelector', fn: fnService(PrepareServices) } as BrandedServiceSelector;
}
  