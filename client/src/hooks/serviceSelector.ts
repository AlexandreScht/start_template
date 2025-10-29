import { Services } from "@/interfaces/services";
import PrepareServices from "@/services";

type ServiceSelector<R = any> = (services: typeof PrepareServices) => (axios: Services.Axios.instance) => Promise<R>;

type BrandedServiceSelector<R = any> = {
  __brand: 'ServiceSelector';
  fn: (axios: Services.Axios.instance) => Promise<R>;
};

export default function serviceSelector<R>(fnService: ServiceSelector<R>): BrandedServiceSelector<R> {
  return { __brand: 'ServiceSelector', fn: fnService(PrepareServices) } as BrandedServiceSelector<R>;
}
  