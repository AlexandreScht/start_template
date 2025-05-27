import type { Middlewares } from '@/interfaces/middlewares';
import { useCallback, useEffect, useRef } from 'react';
import type { SWRHook } from 'swr';

interface returnType {
  isLagging: boolean;
  resetLaggy: () => void;
}

export default function laggy(useSWRNext: SWRHook): Middlewares.swr.mw<returnType> {
  return <Data = any, Error = any>(...args: Parameters<Middlewares.swr.args<Data, Error>>) => {
    const laggyDataRef = useRef<Data | undefined>(undefined);

    const swr = useSWRNext(...args);

    useEffect(() => {
      if (swr.data !== undefined) {
        laggyDataRef.current = swr.data;
      }
    }, [swr.data]);

    const resetLaggy = useCallback(() => {
      laggyDataRef.current = undefined;
    }, []);

    const dataOrLaggyData = swr.data === undefined ? laggyDataRef.current : swr.data;

    const isLagging = swr.data === undefined && laggyDataRef.current !== undefined;

    return {
      ...swr,
      data: dataOrLaggyData,
      isLagging,
      resetLaggy,
    };
  };
}
