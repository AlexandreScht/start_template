'use client';

import { ClientException } from '@/exceptions/errors';
import type { Services } from '@/interfaces/services';
import AxiosInstance from '@/libs/axiosInstance';
import { useContext, useEffect, useMemo } from 'react';
import { preload } from 'swr';
import { CallServicesContext } from './ServiceProvider';

export function usePrefetch<U extends Services.Config.ServiceOption = Services.Config.ServiceOption, R = any>(
  selector: Services.Provider.ServiceSelector<R>,
  options?: U,
): void {
  const callServices = useContext(CallServicesContext);
  if (!callServices) {
    throw new ClientException('usePrefetch doit être utilisé dans un ServiceProvider');
  }
  const { headers } = options || {};
  const axiosInstance = useMemo(() => AxiosInstance({ headers, side: 'client' }), [headers]);
  const { key, fetcher } = useMemo(() => selector(callServices), [callServices, selector]);

  useEffect(() => {
    preload(key, () => fetcher(axiosInstance));
  }, [axiosInstance, fetcher, key]);
}
