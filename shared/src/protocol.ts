import { type MapID } from "./maps";
import { type DevelopmentType } from "./types/economyTypes";

export interface ClientMessages {
  BUY_TERRITORY: { territoryID: string; };
  SELL_TERRITORY: { territoryID: string };
  ROLL_DICE: {}; // Empty payload
  PONG: { serverT1: number; clientT2: number };
  START_GAME: {};
  ACCELERATE_DICE: {};
  RAGDOLL_DICE: {};
  KICK_PLAYER: {playerId: string, reason?: string}
  SEND_MESSAGE: {senderId: string, content: string, timeStamp: number}
  END_TURN: {};
  CHANGE_MAP: {mapID: MapID}
  SELECT_CARD: {cardID: string}
  PAY_OFF_DEBT: {};
   DECLARE_BANKRUPTCY: {};
  UPGRADE_TERRITORY: { territoryID: string; buildingType: DevelopmentType; };
  DOWNGRADE_TERRITORY: { territoryID: string; };
  SHIFT_TRACK: { direction: "forward" | "backward" };
}

export interface QueuedAction<TPayload = unknown> {
  type: string;
  payload: TPayload;
  serverTimestamp: number;
  sequence: number;
  checksum: string;
}

export interface ServerMessages {
  PING: { serverT1: number };
  PING_PONG: { serverT1: number; clientT2: number; serverT3: number };
  ACCELERATE_DICE: {};
  RAGDOLL_DICE: {};
  RELAY_MESSAGE: {senderId: string, content: string, timeStamp: number};
  action: QueuedAction;
}

// Helper Types
//export type ClientActionType = keyof ClientMessages;
export type ClientActionType = Extract<keyof ClientMessages, string>;
export type ServerActionType = Extract<keyof ServerMessages, string>;

// Context includes the payload + the player who sent it
export type ActionContext<K extends ClientActionType> = ClientMessages[K] & {
  senderId: string;
};

export type PlayerJoinPayload = { playerName: string };
