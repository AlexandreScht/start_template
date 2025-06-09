'use client';
import { ClientException } from '@/exceptions/errors';
import { type SubStoreType } from '@/interfaces/stores';
import prepareStore, { type AppStore } from '@/stores';
import React, { createContext, type ReactNode, useCallback, useContext, useMemo, useRef } from 'react';
import { type StoreApi, useStore as useZustandStore } from 'zustand';

const StoreContext = createContext<StoreApi<AppStore> | undefined>(undefined);

export function StoreProvider({
  children,
  initialState = {},
}: {
  children: ReactNode;
  initialState: Partial<AppStore>;
}) {
  const storeRef = useRef<StoreApi<AppStore>>();
  if (!storeRef.current) {
    storeRef.current = prepareStore(initialState);
  }

  const contextValue = useMemo(() => storeRef.current!, []);

  return <StoreContext.Provider value={contextValue}>{children}</StoreContext.Provider>;
}

export function useStore<T>(selector: (state: Omit<AppStore, 'subscribe'>) => T): T {
  const store = useContext(StoreContext);
  if (!store) {
    throw new ClientException(404, 'useAppStore must be used within a <StoreProvider>');
  }

  const selectorWithoutSubscribe = useCallback(
    (state: AppStore) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { subscribe, ...stateWithoutSubscribe } = state;
      return selector(stateWithoutSubscribe as Omit<AppStore, 'subscribe'>);
    },
    [selector],
  );

  return useZustandStore(store, selectorWithoutSubscribe);
}

export function useListenerStore(): SubStoreType['subscribe'] {
  const store = useContext(StoreContext);
  if (!store) {
    throw new ClientException(404, 'useListenerStore must be used within a <StoreProvider>');
  }

  const trigger = useCallback(
    (key: string, value?: any) => {
      const { subscribe } = store.getState();
      subscribe.trigger(key, value);
    },
    [store],
  );

  const observer = useCallback(
    (key: string, callback: (value: any) => void) => {
      const { subscribe } = store.getState();
      return subscribe.observer(key, callback);
    },
    [store],
  );

  const unsubscribe = useCallback(
    (key: string) => {
      const { subscribe } = store.getState();
      subscribe.unsubscribe(key);
    },
    [store],
  );

  return useMemo(
    () => ({
      trigger,
      observer,
      unsubscribe,
    }),
    [trigger, observer, unsubscribe],
  );
}
