export type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? (T[K] extends null ? string : DeepStringify<T[K]>) : string;
};
