import { type SetStoreState, type UserStoreType } from '@/interfaces/stores';
import { type StateCreator } from 'zustand';

function UserStore(set: SetStoreState<UserStoreType>) {
  return {
    pseudo: {
      name: '',
      setName: (name: string) =>
        set(state => ({
          ...state,
          pseudo: {
            ...state.pseudo,
            name,
          },
        })),
    },
  };
}

export type storeMarketType = ReturnType<typeof UserStore>;

const UserSlice: StateCreator<UserStoreType, [], [], storeMarketType> = set => UserStore(set);
export default UserSlice;
