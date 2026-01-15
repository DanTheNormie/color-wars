import { readFileSync } from "fs";
import path from "path";
import { GameAction, PlayerState, RoomState, TerritoryState } from "@color-wars/shared/src/types/RoomState";
import { PLAYER } from "@color-wars/shared/src/config/game";
import { Client, Room } from "colyseus";
import { StatusEffect } from "@color-wars/shared/src/types/RoomState";
import { RewardID, StatusEffectID } from "@color-wars/shared/src/types/effectId";
import { MAPS } from "@color-wars/shared/src/maps";
import { type TileType, DICE_TRACK, TileConfig} from "@color-wars/shared/src/config/diceTrack"


export class GameEngine {
  private roomClock?: {
    setTimeout: (callback: () => void, delay: number) => any;
  };

  constructor(private readonly state: RoomState) {}

  setRoomClock(clock: { setTimeout: (callback: () => void, delay: number) => any }) {
    this.roomClock = clock;
  }

  handlePlayerJoined(player: PlayerState) {
    this.state.game.playerOrder.push(player.id);

    const takenColors = new Set();
    const takenIcons = new Set();

    this.state.game.players.forEach((p) => {
      takenColors.add(p.color);
      takenIcons.add(p.icon);
    });

    for (const color of PLAYER.COLORS) {
      if (!takenColors.has(color)) {
        player.color = color;
        break;
      }
    }
    for (const icon of PLAYER.ICONS) {
      if (!takenIcons.has(icon)) {
        player.icon = icon;
        break;
      }
    }
  }

  startGame() {
    for (const playerID of this.state.game.playerOrder) {
      const player = this.state.game.players.get(playerID)!;
      player.money = 150000;
      player.position = 0;
      player.hasRolled = false;
    }

    this.state.game.activePlayerId = this.state.game.playerOrder.at(0);
    this.state.game.turnPhase = "awaiting-roll";
  }

  handleRoll(client: Client) {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const roll = die1 + die2;

    this.state.pushAction("ROLL_DICE", client.sessionId, { die1, die2 });

    const player = this.state.game.players.get(client.sessionId)!;
    const fromTile = player.position;
    const toTile = (fromTile + roll) % DICE_TRACK.length;

    const destTileConfig = DICE_TRACK[toTile]
    
    player.position = toTile;
    this.state.pushAction("MOVE_PLAYER", client.sessionId, { fromTile, toTile, tokenId: client.sessionId });
    
    this.handleTileEffect(destTileConfig, player)

    player.hasRolled = true;
  }

  handleTileEffect(tileConfig: TileConfig, player: PlayerState){
    switch(tileConfig.type){
      case 'INCOME': {
        const amount = tileConfig.amount!
        player.money += amount
        this.state.pushAction('INCR_MONEY', player.id, {playerId: player.id, amount: amount})
        break;
      }
      case 'TAX': {
        const amount = tileConfig.amount!
        player.money -= amount
        this.state.pushAction('DECR_MONEY', player.id, {playerId: player.id, amount: amount})
        break;
      }
      case 'REWARD':{
        const amount = this.getRandomNumberWithStep(10000, 100000, 10000)
        player.money += amount
        this.state.pushAction('INCR_MONEY', player.id, {playerId: player.id, amount: amount})
        break;
      }
      case 'PENALTY':{
        const amount = this.getRandomNumberWithStep(10000, 100000, 10000)
        player.money -= amount
        this.state.pushAction('DECR_MONEY', player.id, {playerId: player.id, amount: amount})
        break;
      }
      case 'SURPRISE':  {
        const generatedCardIDs = ["GET_500_CASH", "GET_2000_CASH", "GET_KILL_CARD"] as RewardID[]
        this.state.game.turnPhase = 'resolving-draft'
        this.state.game.generatedCardIDs.push(...generatedCardIDs)
        this.state.pushAction("DRAW_3_REWARD_CARDS", player.id, { playerId: player.id, cardIds: generatedCardIDs });
        break;
      }
      case 'SAFE':
      case 'START':  {break;}
      default: throw new Error('invalid/unhandled tile type')
    }
  }

  private getRandomNumberWithStep(min: number, max: number, step: number) {
    // Calculate the number of possible steps (including min)
    const steps = Math.floor((max - min) / step);
    // Get a random integer between 0 and `steps` (inclusive)
    const randomStep = Math.floor(Math.random() * (steps + 1));
    // Scale and shift the number
    return min + (randomStep * step);
}

  buyTerritory(client: Client, territoryID: string) {
    const player = this.state.game.players.get(client.sessionId)!

    const territorySize = MAPS[this.state.mapID].map.territories.find((t) => t.id === territoryID)!.hexes.length

    const economy = MAPS[this.state.mapID].getTerritoryEconomy(territorySize)

    const cost = economy.BASE.capEx
    
    this.state.pushAction('BUY_TERRITORY', player.id, {playerId: player.id, territoryID, amount: cost})
    
    player.money -= cost;
    this.state.game.territoryOwnership.set(territoryID, new TerritoryState(player.id))
  }

  sellTerritory(client: Client, territoryID: string) {
    const player = this.state.game.players.get(client.sessionId)!

    const territorySize = MAPS[this.state.mapID].map.territories.find((t) => t.id === territoryID)!.hexes.length

    const economy = MAPS[this.state.mapID].getTerritoryEconomy(territorySize)

    const cost = economy.BASE.capEx/2

    this.state.pushAction('SELL_TERRITORY', player.id, {playerId: player.id, territoryID, amount:cost})
    
    player.money += cost;
    this.state.game.territoryOwnership.delete(territoryID)
  }

  selectCard(client: Client, cardID: string) {

    this.state.game.generatedCardIDs.clear()
    this.state.pushAction('SELECT_CARD', client.sessionId, {selectedCardId: cardID})
  
    //TODO: apply card effect
  }

  endTurn() {
    const currentIdx = this.state.game.playerOrder.indexOf(this.state.game.activePlayerId);

    const nextIdx = (currentIdx + 1) % this.state.game.playerOrder.length;
    if (nextIdx === 0) {
      this.state.game.currentRound += 1;
      for (const [, player] of this.state.game.players) {
        player.hasRolled = false;
      }
    }
    this.state.game.activePlayerId = this.state.game.playerOrder[nextIdx];
    this.state.game.turnPhase = "awaiting-roll";
  }
}

// server/logic/EffectHandlers.ts
export interface EffectContext {
  state: RoomState;
  playerId: string;
}

export const RewardEffects: Record<RewardID, (ctx: EffectContext) => void> = {
  GET_500_CASH: (ctx: EffectContext) => {},
  GET_2000_CASH: (ctx: EffectContext) => {},
  GET_KILL_CARD: (ctx: EffectContext) => {},
  GET_SHIELD_CARD: (ctx: EffectContext) => {},
};

// server/logic/TurnProcessor.ts
export function processStatusEffects(state: RoomState, playerId: string) {
  const player = state.game.players.get(playerId)!;

  // Iterate backwards to allow safe removal
  for (let i = player.statusEffects.length - 1; i >= 0; i--) {
    const effect = player.statusEffects[i];

    switch (effect.id as StatusEffectID) {
      case "DEBT":
        // Example: Deduct money each turn
        player.money -= 100; // Deduct 100 as an example
        break;
      case "INCOME":
        // Example: Add money each turn
        player.money += 100; // Add 100 as an example
        break;
      default:
        break;
    }

    effect.duration -= 1;
    if (effect.duration <= 0) {
      player.statusEffects.splice(i, 1);
    }
  }
}