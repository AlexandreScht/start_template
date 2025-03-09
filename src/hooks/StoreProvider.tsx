'use client';
import { ClientException } from '@/exceptions/errors';
import prepareStore, { AppStore } from '@/stores';
import React, { createContext, ReactNode, useContext, useRef } from 'react';
import { type StoreApi, useStore as useZustandStore } from 'zustand';

const StoreContext = createContext<StoreApi<AppStore> | undefined>(undefined);
export function StoreProvider({ children, initialState = {} }: { children: ReactNode; initialState: Partial<AppStore> }) {
  const storeRef = useRef<StoreApi<AppStore>>();
  if (!storeRef.current) {
    storeRef.current = prepareStore(initialState);
  }
  return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>;
}

export function useStore<T>(selector: (state: AppStore) => T): T {
  const store = useContext(StoreContext);
  if (!store) {
    throw new ClientException(404, 'useAppStore must be used within a <StoreProvider>');
  }
  return useZustandStore(store, selector);
}
