import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import type { ActionType, TURN_ACTION_REGISTRY } from "./turnActionRegistry";
import type { QueuedAction } from "../protocol";
import { type MapID } from "../maps";
import type { DevelopmentType } from "./economyTypes";
import type { TileType } from "../config/diceTrack";

export type RoomPhase = "lobby" | "active" | "finished";
export type RoomVisibility = "private" | "public";
export type TradeStatus = "pending" | "accepted" | "rejected";
export type TurnPhase = "awaiting-roll" | "resolving-draft" | "resolving-bankruptcy" | "awaiting-end-turn" | "game-over" | "resolving-shift";

export class TileState extends Schema {
  @type("string") type: TileType;
  @type("number") amount?: number;
  @type("string") label?: string;

  constructor(type: TileType, amount?: number, label?: string) {
    super();
    this.type = type;
    if (amount !== undefined) this.amount = amount;
    if (label !== undefined) this.label = label;
  }
}

export class TerritoryState extends Schema {
  @type("string") ownerId: string;
  @type("string") buildingType: DevelopmentType = "BASE";

  constructor(playerID: string) {
    super();
    this.ownerId = playerID
  }
}

export class StatusEffect extends Schema {
  @type("string") id: string; // Cast to StatusEffectID
  @type("number") duration: number; // e.g. number of rounds remaining

  constructor(id: string, duration: number) {
    super();
    this.id = id;
    this.duration = duration;
  }
}

export class BackPack extends Schema {
  @type("number") money: number = 0;
  @type(["string"]) cards: ArraySchema<string> = new ArraySchema<string>();
}

export type FinancialStatus = "healthy" | "in-debt" | "bankrupt";
export type PlayerStatus = "active" | "bankrupt" | "spectator";

export class PlayerState extends Schema {
  @type("string") id: string;
  @type("string") name: string;
  @type("number") money: number = 0;
  @type("string") icon: string = "";
  @type("number") round: number = 0;
  @type("string") color: string = "";
  @type("number") position: number = 0;
  @type("boolean") ready: boolean = false;
  @type("boolean") connected: boolean = true;
  @type("boolean") hasRolled: boolean = true;
  @type("string") financialStatus: FinancialStatus = "healthy";
  @type(["string"]) cards: ArraySchema<string> = new ArraySchema<string>();
  @type([StatusEffect]) statusEffects: ArraySchema<StatusEffect> = new ArraySchema<StatusEffect>();
  @type(BackPack) backpack = new BackPack()
  constructor(id: string, name: string) {
    super();
    this.name = name;
    this.id = id;
  }
}

export class Room extends Schema {
  @type("string") id: string;
  @type("int8") maxPlayers = 4;
  @type("string") mapId: string = "";
  @type("string") joinCode: string = "";
  @type("string") leaderId: string = "";
  @type("uint16") startingCash = 1500;
  @type("string") phase: RoomPhase = "lobby";
  @type("string") visibility: RoomVisibility = "private";

  constructor(id: string) {
    super();
    this.id = id;
  }
}

export class TradeOffer extends Schema {
  @type("number") playerAGivesCash: number;
  @type("number") playerBGivesCash: number;
  @type(["string"]) playerAGivesCards: ArraySchema<string>;
  @type(["string"]) playerBGivesCards: ArraySchema<string>;
  @type(["string"]) playerAGivesTerritories: ArraySchema<string>;
  @type(["string"]) playerBGivesTerritories: ArraySchema<string>;

  constructor(
    playerAGivesCash: number,
    playerBGivesCash: number,
    playerAGivesCards: ArraySchema<string>,
    playerBGivesCards: ArraySchema<string>,
    playerAGivesTerritories: ArraySchema<string>,
    playerBGivesTerritories: ArraySchema<string>,
  ) {
    super();
    this.playerAGivesCash = playerAGivesCash;
    this.playerBGivesCash = playerBGivesCash;
    this.playerAGivesCards = playerAGivesCards;
    this.playerBGivesCards = playerBGivesCards;
    this.playerAGivesTerritories = playerAGivesTerritories;
    this.playerBGivesTerritories = playerBGivesTerritories;
  }
}

export class Trade extends Schema {
  @type("string") id: string;
  @type("string") playerAId: string;
  @type("string") playerBId: string;
  @type(TradeOffer) offer: TradeOffer;
  @type("string") currentProposerId: string;
  @type("string") status: TradeStatus = "pending";

  constructor(id: string, playerAId: string, playerBId: string, offer: TradeOffer) {
    super();
    this.id = id;
    this.offer = offer;
    this.playerAId = playerAId;
    this.playerBId = playerBId;
    this.currentProposerId = playerAId;
  }
}

export type DiceStateMode = "ACCELERATING" | "RAGDOLLING" | "ROLLINGTOFACE" | "IDLE";

export class DiceState extends Schema {
  @type("string") mode: DiceStateMode;
  @type(["number"]) rollTo: ArraySchema<number> = new ArraySchema<number>();

  constructor(mode: DiceStateMode = "IDLE", rollTo?: number[]) {
    super();
    this.mode = mode;
    if (rollTo) this.rollTo = new ArraySchema<number>(...rollTo);
  }
}

export class GameAction extends Schema {
  @type("number") id: number;
  @type("string") type: string;
  @type("string") payload: string;
  @type("string") playerId: string;
  @type("number") timestamp: number;

  constructor(type: string, playerId: string, payload: string, timeStamp: number, id: number) {
    super();
    this.id = id;
    this.type = type;
    this.payload = payload;
    this.playerId = playerId;
    this.timestamp = timeStamp;
  }
}



export class GameState extends Schema {
  @type("string") activePlayerId: string = "";
  @type("string") turnPhase: TurnPhase = "awaiting-roll";

  //Map <tradeID, trade>
  @type({ map: Trade }) activeTrades = new MapSchema<Trade>();

  @type(DiceState) diceState: DiceState = new DiceState();

  //Map <playerID, playerState>
  @type({ map: PlayerState }) players: MapSchema<PlayerState> = new MapSchema<PlayerState>();

  //Map <territoryID, territoryState>
  @type({ map: TerritoryState }) territoryOwnership: MapSchema<TerritoryState> = new MapSchema<TerritoryState>();
  @type(["string"]) playerOrder: ArraySchema<string> = new ArraySchema<string>();
  @type("number") currentRound: number = 0;
  @type(["string"]) trackOrder = new ArraySchema<string>();
  @type(["string"]) generatedCardIDs = new ArraySchema<string>();
  @type([TileState]) diceTrack = new ArraySchema<TileState>();
}

export class RoomState extends Schema {
  private _nextActionId: number = 0;
  public _pendingActions: QueuedAction[] = [];
  @type(Room) room: Room;
  @type({ map: "number" }) playersPings = new MapSchema<number>();
  @type(GameState) game = new GameState();
  @type(GameState) turnCheckpoint: GameState | null = null;
  @type([GameAction]) turnActionHistory = new ArraySchema<GameAction>();
  @type('string') mapID: MapID = 'INDIA'

  constructor(roomId: string) {
    super();
    this.room = new Room(roomId);
  }

  createSnapshot() {
    this.turnCheckpoint = this.game.clone();
  }

  pushAction<T extends ActionType>(type: T, playerId: string, payload: typeof TURN_ACTION_REGISTRY[T]) {
    const action = new GameAction(type as string, playerId, JSON.stringify(payload), Date.now(), this._nextActionId++);
    this.turnActionHistory.push(action);
  }

  queueAction<T = unknown>(type: string, payload: T, checksum: string) {
    const action: QueuedAction = {
      type: type as string,
      payload,
      serverTimestamp: 0,
      sequence: 0,
      checksum,
    };
    this._pendingActions.push(action);
  }

  clearTurnHistory() {
    this.turnActionHistory.clear();
    this._nextActionId = 0;
    this._pendingActions = [];
  }
}

export type Message = {
  senderId: string;
  content: string;
  timeStamp: number;
};

export type PlainStateOf<K extends Schema> = ReturnType<K["toJSON"]>;
