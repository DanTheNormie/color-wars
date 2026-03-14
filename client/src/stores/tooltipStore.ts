import { create } from "zustand";
import { devtools, combine } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface TooltipState {
  isOpen: boolean;
  x: number;
  y: number;
  territoryId: string | null;
}

export const useTooltipStore = create(
  devtools(
    immer(
      combine(
        {
          isOpen: false,
          x: 0,
          y: 0,
          territoryId: null as string | null,
        },
        (set) => ({
          openTooltip: (x: number, y: number, territoryId: string) =>
            set({ isOpen: true, x, y, territoryId }),
          closeTooltip: () =>
            set({ isOpen: false, territoryId: null }),
          reset: () =>
            set(useTooltipStore.getInitialState()),
        }),
      ),
    ),
    { name: "tooltipStore" },
  ),
);
