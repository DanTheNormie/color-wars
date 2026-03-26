import type { CardID } from "./effectId.js";

export type InstantCashConfig = {
  type: "INSTANT_CASH";
  min: number;
  max: number;
  step: number;
  ui: { title: string; subtitle: string; colorTheme: string };
};

export type CardRewardConfig = {
  type: "CARD";
  cardId: CardID;
  ui: { title: string; subtitle: string; colorTheme: string };
};

export type RewardConfig = InstantCashConfig | CardRewardConfig;
