export type SetStoreState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
export type GetStoreState<T> = () => T;

export interface UserStoreType {
  pseudo: {
    name: string | undefined;
    setName: (x?: string) => void;
  };
}
