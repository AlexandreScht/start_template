'use client';

import { ClientException } from '@/exceptions/errors';
import { servicesErrors } from '@/exceptions/messagers';
import type { Services } from '@/interfaces/services';
import AxiosInstance from '@/libs/axiosIntance';
import { useCallback, useContext, useMemo } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { CallServicesContext } from './ServiceProvider';

export function useService<U extends Services.Config.ServiceOption = Services.Config.ServiceOption, R = any>(
  selector: Services.Provider.ServiceSelector<R>,
  options?: U,
): SWRResponse<R, Services.Error.messageReturn> & Services.useService.ExtractMiddlewareFromConfig<U> {
  const callServices = useContext(CallServicesContext);
  if (!callServices) {
    throw new ClientException('useService doit être utilisé dans un ServiceProvider');
  }
  const { cache, headers, isDisabled } = options || {};
  const axiosInstance = useMemo(() => AxiosInstance({ headers, side: 'client' }), [headers]);

  const { key, fetcher } = useMemo(() => selector(callServices), [callServices, selector]);
  const swrKey = isDisabled ? null : key;

  const fetcherFn = useCallback(async () => {
    try {
      return await fetcher(axiosInstance);
    } catch (error) {
      throw servicesErrors(error);
    }
  }, [axiosInstance, fetcher]);

  return useSWR<R, Services.Error.messageReturn>(swrKey, fetcherFn, cache) as SWRResponse<R, Services.Error.messageReturn> &
    Services.useService.ExtractMiddlewareFromConfig<U>;
}
