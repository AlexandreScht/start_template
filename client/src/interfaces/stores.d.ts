export type SetStoreState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
export type GetStoreState<T> = () => T;

export interface UserStoreType {
  pseudo: {
    name: string | undefined;
    setName: (x?: string) => void;
  };
}

export interface SubStoreType {
  subscribe: {
    trigger: (eventName: string, payload?: any) => void;
    observer: (eventName: string, callback: (payload: any) => void) => () => void;
    unsubscribe: (eventName: string) => void;
  };
}
