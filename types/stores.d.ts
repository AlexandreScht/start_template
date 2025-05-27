export interface UserStoreType {
  pseudo: {
    name: string | undefined;
    setName: (x?: string) => void;
  };
}
