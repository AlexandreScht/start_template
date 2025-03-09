import { SetStoreState } from '@/interfaces/stores';
import { StateCreator } from 'zustand';

function storeMarket(set: SetStoreState<object>) {
  return {
    scoreboard: {
      score: 0,
      increase: () =>
        set((state: storeMarketType) => {
          state.scoreboard.score += 1;
        }),
      resetScore: () =>
        set((state: storeMarketType) => {
          state.scoreboard.score = 0;
        }),
    },
  };
}

export type storeMarketType = ReturnType<typeof storeMarket>;

const scoreSlice: StateCreator<any, [], [], storeMarketType> = set => storeMarket(set);
export default scoreSlice;
