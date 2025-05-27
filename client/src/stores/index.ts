import { type GetStoreState, type SetStoreState } from '@/interfaces/stores';
import { createStore, type StoreApi } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import scoreSlice from './score';

const configureStores = (set: SetStoreState<object>, get: GetStoreState<object>, api: StoreApi<object>) => ({
  ...scoreSlice(set, get, api),
});

const storage =
  typeof window !== 'undefined'
    ? createJSONStorage(() => localStorage)
    : createJSONStorage(() => ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }));

export type AppStore = ReturnType<typeof configureStores>;

const stripFunctions = (obj: any): Record<string, any> => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(stripFunctions) as any;

  const result = Object.keys(obj).reduce(
    (acc, key) => {
      const value = (obj as any)[key];
      if (typeof value !== 'function') {
        acc[key] = stripFunctions(value);
      }
      return acc;
    },
    {} as Record<string, any>,
  );
  return result;
};

const mergeDeep = (current: any, persisted: any): any =>
  Object.keys(persisted).reduce(
    (acc, key) => {
      const persistedVal = persisted[key];
      if (typeof persistedVal === 'object' && persistedVal !== null && !Array.isArray(persistedVal)) {
        acc[key] = mergeDeep(acc[key] ?? {}, persistedVal);
      } else {
        acc[key] = persistedVal;
      }
      return acc;
    },
    { ...current },
  );

export default function prepareStore(initialState?: Record<string, any>): StoreApi<AppStore> {
  return createStore<AppStore>()(
    persist(
      subscribeWithSelector(
        immer((set, get, api) => {
          const baseState: Record<string, any> = {};
          const mergedState = initialState ? { ...baseState, ...initialState } : baseState;
          return {
            ...mergedState,
            ...configureStores(set, get, api),
          };
        }),
      ),
      {
        name: 'app-store',
        storage,
        partialize: state => stripFunctions(state),
        merge: (persistedState: any, currentState: AppStore): AppStore => {
          return mergeDeep(currentState, persistedState);
        },
        onRehydrateStorage: () => state => {
          console.log('Rehydration complete', state);
          return state;
        },
      },
    ),
  );
}
