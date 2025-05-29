'use client';

import { ClientException } from '@/exceptions/errors';
import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import AxiosInstance from '@/libs/axiosIntance';
import { useCallback, useContext, useMemo } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { CallServicesContext } from './ServiceProvider';

const axiosInstanceCache = new Map<string, Services.Axios.instance>();

export function useService<U extends Services.Config.ServiceOption = Services.Config.ServiceOption, R = any>(
  selector: Services.Provider.ServiceSelector<R>,
  options?: U,
): SWRResponse<R, Services.Error.messageReturn> & Services.useService.ExtractMiddlewareFromConfig<U> {
  const callServices = useContext(CallServicesContext);
  if (!callServices) {
    throw new ClientException('useService doit être utilisé dans un ServiceProvider');
  }
  const { cache, headers, isDisabled } = options || {};

  const axiosInstance = useMemo(() => {
    const cacheKey = JSON.stringify(headers || {});

    if (axiosInstanceCache.has(cacheKey)) {
      return axiosInstanceCache.get(cacheKey)!;
    }

    const instance = AxiosInstance({ headers, side: 'client' });
    axiosInstanceCache.set(cacheKey, instance);

    setTimeout(() => axiosInstanceCache.delete(cacheKey), 300000); // 5 minutes
    return instance;
  }, [headers]);

  const { key, fetcher } = useMemo(() => selector(callServices), [callServices, selector]);
  const swrKey = isDisabled ? null : key;

  const fetcherFn = useCallback(async () => {
    try {
      return await fetcher(axiosInstance);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Service error:', error);
      }
      throw servicesErrors(error);
    }
  }, [axiosInstance, fetcher]);

  const swrOptions = useMemo(
    () => ({
      dedupingInterval: 2000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      ...cache,
    }),
    [cache],
  );

  return useSWR<R, Services.Error.messageReturn>(swrKey, fetcherFn, swrOptions) as SWRResponse<
    R,
    Services.Error.messageReturn
  > &
    Services.useService.ExtractMiddlewareFromConfig<U>;
}
