import { PIXIGameBoard } from "@/components/NewGameBoard/pixi/engine";
import { create } from "zustand";
import { devtools, combine } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type contextStore = {
  pixiEngine: PIXIGameBoard | null;
};

export const contextStore = create(
  devtools(
    immer(
      combine(
        {
          pixiEngine: null,
        } as contextStore,
        (set) => ({
          setPixiEngine: (pixiEngine: PIXIGameBoard) => {
            set({ pixiEngine });
          },
        }),
      ),
    ),
  ),
);
