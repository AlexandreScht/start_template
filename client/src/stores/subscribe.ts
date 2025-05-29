import { type SubStoreType } from '@/interfaces/stores';
import { type StateCreator } from 'zustand';

function SubStore() {
  const listeners: Map<string, Array<(payload: any) => void>> = new Map();
  return {
    subscribe: {
      trigger: (eventName: string, payload?: any) => {
        const eventListeners = listeners.get(eventName);
        if (eventListeners) {
          eventListeners.forEach(callback => callback(payload));
        }
      },

      observer: (eventName: string, callback: (payload: any) => void) => {
        if (!listeners.has(eventName)) {
          listeners.set(eventName, []);
        }

        const eventListeners = listeners.get(eventName)!;
        eventListeners.push(callback);

        return () => {
          const currentListeners = listeners.get(eventName);
          if (currentListeners) {
            const index = currentListeners.indexOf(callback);
            if (index > -1) {
              currentListeners.splice(index, 1);

              if (currentListeners.length === 0) {
                listeners.delete(eventName);
              }
            }
          }
        };
      },

      unsubscribe: (eventName: string) => {
        listeners.delete(eventName);
      },
    },
  };
}

export type storeMarketType = ReturnType<typeof SubStore>;

const SubSlice: StateCreator<SubStoreType, [], [], storeMarketType> = () => SubStore();
export default SubSlice;
