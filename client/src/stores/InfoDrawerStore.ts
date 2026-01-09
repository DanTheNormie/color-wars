import { create } from "zustand";
import { devtools, combine } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useInfoDrawerStore = create(
  devtools(
    immer(
      combine(
        {
          territoryInfoDrawerOpen: false,
        },
        (set) => ({
          setTerritoryInfoDrawerOpen: (open: boolean) => set({ territoryInfoDrawerOpen: open }),
          reset: ()=>{set(useInfoDrawerStore.getInitialState())}
        }),
      ),
    ),
  ),
);

