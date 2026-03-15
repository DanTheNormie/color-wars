import { create } from "zustand";
import { devtools, combine } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { ActionType } from "@color-wars/shared/src/types/turnActionRegistry";

export interface GameLogEntry {
  id: number;
  type: ActionType;
  playerId: string;
  payload: Record<string, any>;
  timestamp: number;
}

interface GameLogStore {
  entries: GameLogEntry[];
}

export const useGameLogStore = create(
  devtools(
    immer(
      combine(
        {
          entries: [],
        } as GameLogStore,
        (set) => ({
          addEntry: (
            id: number,
            type: ActionType,
            playerId: string,
            payload: Record<string, any>,
            timestamp: number
          ) => {
            set((state) => {
              // Ignore duplicate actions from replay
              if (state.entries.some((e) => e.id === id)) return;

              state.entries.push({
                id,
                type,
                playerId,
                payload,
                timestamp,
              });
            });
          },
          reset: () => {
            set(useGameLogStore.getInitialState());
          },
        })
      )
    ),
    { name: "gameLogStore" }
  )
);
