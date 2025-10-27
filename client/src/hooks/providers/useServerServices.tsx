import { serviceOptions } from '@/config/services';
import type { Services } from '@/interfaces/services';
import AxiosInstance from '@/libs/axiosInstance';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';

type BrandedServiceSelector = {
  __brand: 'ServiceSelector';
  fn: (axios: Services.Axios.instance) => Promise<any>;
};
type NotFunction<T> = T extends Function ? never : T;
type NonFunctionValue = NotFunction<string | number | boolean | Record<string, unknown> | unknown[] | null | undefined>;
type ServicesMap = Record<string, BrandedServiceSelector | NonFunctionValue | NonFunctionValue[]>;
type OptionsMap = {
  [K in string]?: Omit<Parameters<QueryClient['prefetchQuery']>[0], 'queryKey' | 'queryFn'>;
};

export default async function FetchServerSide({ 
  children, 
  services, 
  options = {},
}: { 
  children: React.ReactNode;
  services: ServicesMap;
  options?: OptionsMap;
}) {
  const queryClient = new QueryClient(serviceOptions);
  const serviceEntries = Object.entries(services) as [string, BrandedServiceSelector | NonFunctionValue][];
  const axiosInstance = AxiosInstance({ side: 'server' });

  await Promise.all(
    serviceEntries.map(([key, selectorOrValue]) => {
      const isBrandedSelector = 
        typeof selectorOrValue === 'object' && 
        selectorOrValue !== null && 
        '__brand' in selectorOrValue && 
        selectorOrValue.__brand === 'ServiceSelector';
      
      const fetchFn = () => isBrandedSelector ? (selectorOrValue as BrandedServiceSelector).fn(axiosInstance) : Promise.resolve(selectorOrValue)
      return queryClient.prefetchQuery({
        queryKey: [key],
        queryFn: fetchFn,
        ...options[key],
      });
    })
  );
  
  const dehydratedState = dehydrate(queryClient);
  return (
    <HydrationBoundary state={dehydratedState}>
      {children}
    </HydrationBoundary>
  );
}
