import { type TileConfig } from "../config/diceTrack";
import { type TileState, type FinancialStatus } from "./RoomState";
import { DevelopmentType } from "./economyTypes";

export const TURN_ACTION_REGISTRY = {
  MOVE_PLAYER: {} as { fromTile: number, toTile: number, tokenId: string },
  ROLL_DICE: {} as { die1: number, die2: number },
  INCR_MONEY: {} as { playerId: string, amount: number },
  DECR_MONEY: {} as { playerId: string, amount: number },
  DRAW_3_REWARD_CARDS: {} as { playerId: string, cardIds: string[] },
  SELECT_CARD: {} as { selectedCardId: string },
  ADD_CARD: {} as { playerId: string, cardId: string },
  BUY_TERRITORY: {} as { playerId: string, territoryID: string, amount: number },
  SELL_TERRITORY: {} as { playerId: string, territoryID: string, amount: number },
  SHIFT_TRACK: {} as { newTiles: TileConfig[], shiftDirection: "forward" | "backward", diceTrack: TileState[] },
  UPDATE_ACTIVE_PLAYER: {} as { playerId: string },
  BANK_BACKPACK_ITEMS: {} as { playerId: string, money: number, cards: string[] },
  UPDATE_FINANCIAL_STATUS: {} as { playerId: string, financialStatus: FinancialStatus},
  PAY_OFF_DEBT: {} as { playerId: string, amount: number },
  UPDATE_PLAYER_MONEY: {} as { playerId: string, amount: number },
  UPDATE_PLAYER_BACKPACK_MONEY: {} as { playerId: string, amount: number },
  GAME_OVER: {} as { winnerId: string },
  UPGRADE_TERRITORY: {} as { territoryId: string, buildingType: DevelopmentType },
  DOWNGRADE_TERRITORY: {} as { territoryId: string },

} as const;

export type ActionType = keyof typeof TURN_ACTION_REGISTRY;

export type ActionData = {
  [K in ActionType]: {
    id: number;
    timestamp: number;
    type: K;
    payload: (typeof TURN_ACTION_REGISTRY)[K];
  };
}[ActionType];

export const ACTION_TYPES = Object.keys(
  TURN_ACTION_REGISTRY
) as readonly ActionType[];

export function isActionType(v: string): v is ActionType {
  return ACTION_TYPES.includes(v as ActionType);
}