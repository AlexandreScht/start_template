import type { ExampleSlice, ExampleStoreSlice } from '@/stores/score';

export type SetStoreState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
export type GetStoreState<T> = () => T;

export interface GlobalState extends ExampleStoreSlice {
  user: any;
  cartItems: any[];
}

export type StoreState = ExampleSlice;
