import { readFileSync } from "fs";
import path from "path";
import { GameAction, PlayerState, RoomState, TerritoryState, TileState } from "@color-wars/shared/src/types/RoomState";
import { PLAYER } from "@color-wars/shared/src/config/game";
import { Client, Room } from "colyseus";
import { StatusEffect } from "@color-wars/shared/src/types/RoomState";
import { StatusEffectID } from "@color-wars/shared/src/types/effectId";
import { RewardService } from "./rewardService";
import { RewardConfig } from "@color-wars/shared/src/types/rewardConfig";
import { MAPS } from "@color-wars/shared/src/maps";
import { type TileType, DICE_TRACK, TileConfig } from "@color-wars/shared/src/config/diceTrack"


export class GameEngine {
  private roomClock?: {
    setTimeout: (callback: () => void, delay: number) => any;
  };

  constructor(private readonly state: RoomState) { }

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
      player.money = 2000;
      player.position = 0;
      player.hasRolled = false;
    }

    this.state.game.diceTrack.clear();
    for (const tileConfig of DICE_TRACK) {
      this.state.game.diceTrack.push(new TileState(tileConfig.type, tileConfig.amount, tileConfig.label));
    }

    this.state.game.activePlayerId = this.state.game.playerOrder.at(0);
    this.state.pushAction('UPDATE_ACTIVE_PLAYER', this.state.game.activePlayerId, { playerId: this.state.game.playerOrder.at(0) });
    this.state.game.turnPhase = "awaiting-roll";
  }

  handleRoll(client: Client) {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const roll = die1 + die2;

    this.state.pushAction("ROLL_DICE", client.sessionId, { die1, die2 });

    const player = this.state.game.players.get(client.sessionId)!;
    const fromTile = player.position;
    const toTile = (fromTile + roll) % this.state.game.diceTrack.length;

    const destTileConfig = this.state.game.diceTrack[toTile];

    player.position = toTile;
    this.state.pushAction("MOVE_PLAYER", client.sessionId, { fromTile, toTile, tokenId: client.sessionId });

    this.handleTileEffect(destTileConfig, player)

    player.hasRolled = true;
    if (this.state.game.turnPhase === 'awaiting-roll') this.state.game.turnPhase = 'awaiting-end-turn'
  }

  handleTileEffect(tileConfig: TileConfig | TileState, player: PlayerState) {
    switch (tileConfig.type) {
      case 'INCOME': {
        const amount = tileConfig.amount!
        player.backpack.money += amount
        this.state.pushAction('INCR_MONEY', player.id, { playerId: player.id, amount: amount })
        break;
      }
      case 'TAX': {
        const amount = tileConfig.amount!
        player.backpack.money -= amount
        this.state.pushAction('DECR_MONEY', player.id, { playerId: player.id, amount: amount })
        break;
      }
      case 'REWARD': {
        const amount = this.getRandomNumberWithStep(1000, 10000, 1000)
        player.money += amount
        this.state.pushAction('INCR_MONEY', player.id, { playerId: player.id, amount: amount })
        break;
      }
      case 'PENALTY': {
        const amount = this.getRandomNumberWithStep(1000, 10000, 1000)
        player.money -= amount
        this.state.pushAction('DECR_MONEY', player.id, { playerId: player.id, amount: amount })
        break;
      }
      case 'SURPRISE': {
        const generatedCardConfigs = RewardService.generateOptions({ count: 3, allowDuplicates: false });
        // temporarily store the selected configs in state by serializing them, or simply storing the indices of the pool.
        // For simplicity now, we can just pack the JSON string to the client.
        const packedIds = generatedCardConfigs.map(c => JSON.stringify(c));
        this.state.game.turnPhase = 'resolving-draft'
        this.state.game.generatedCardIDs.push(...packedIds)
        this.state.pushAction("DRAW_3_REWARD_CARDS", player.id, { playerId: player.id, cardIds: packedIds });
        break;
      }
      case 'SAFE':
      case 'NEUTRAL':
      case 'START': { break; }
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

    this.state.pushAction('BUY_TERRITORY', player.id, { playerId: player.id, territoryID, amount: cost })

    player.money -= cost;
    this.state.game.territoryOwnership.set(territoryID, new TerritoryState(player.id))
  }

  sellTerritory(client: Client, territoryID: string) {
    const player = this.state.game.players.get(client.sessionId)!

    const territorySize = MAPS[this.state.mapID].map.territories.find((t) => t.id === territoryID)!.hexes.length

    const economy = MAPS[this.state.mapID].getTerritoryEconomy(territorySize)

    const cost = economy.BASE.capEx / 2

    this.state.pushAction('SELL_TERRITORY', player.id, { playerId: player.id, territoryID, amount: cost })

    player.money += cost;
    this.state.game.territoryOwnership.delete(territoryID)
  }

  selectCard(client: Client, encodedConfig: string) {
    const player = this.state.game.players.get(client.sessionId)!;
    this.state.game.generatedCardIDs.clear();

    // Attempt to decode the config pushed from DRAW_3_REWARD_CARDS
    const config = JSON.parse(encodedConfig) as RewardConfig;
    this.state.pushAction('SELECT_CARD', player.id, { selectedCardId: encodedConfig });

    // apply card effect
    if (config.type === "INSTANT_CASH") {
      const amount = this.getRandomNumberWithStep(config.min, config.max, config.step);
      player.money += amount;
      this.state.pushAction('INCR_MONEY', player.id, { playerId: player.id, amount });
    } else if (config.type === "CARD") {
      player.backpack.cards.push(config.cardId);
      this.state.pushAction('ADD_CARD', player.id, { playerId: player.id, cardId: config.cardId });
    }

    this.state.game.turnPhase = 'awaiting-end-turn';
  }

  generateNextTile(): TileConfig {
    const round = this.state.game.currentRound;
    const incomeWeight = Math.max(10, 50 - round * 2);
    const safeWeight = Math.max(5, 30 - round);
    const taxWeight = Math.min(40, 5 + round * 2);
    const penaltyWeight = Math.min(30, round);
    const surpriseWeight = 10;
    const rewardWeight = 5;

    const pool = [
      { type: 'INCOME', weight: incomeWeight },
      { type: 'SAFE', weight: safeWeight },
      { type: 'TAX', weight: taxWeight },
      { type: 'PENALTY', weight: penaltyWeight },
      { type: 'SURPRISE', weight: surpriseWeight },
      { type: 'REWARD', weight: rewardWeight },
    ];

    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    let selectedType: TileType = 'SAFE';
    for (const item of pool) {
      if (random < item.weight) {
        selectedType = item.type as TileType;
        break;
      }
      random -= item.weight;
    }

    let amount = undefined;
    if (selectedType === 'INCOME') {
      amount = this.getRandomNumberWithStep(500, 2000, 500);
    } else if (selectedType === 'TAX') {
      amount = this.getRandomNumberWithStep(100, 1000, 100);
    }

    return { type: selectedType, amount };
  }

  endTurn() {
    const currentIdx = this.state.game.playerOrder.indexOf(this.state.game.activePlayerId);

    const nextIdx = (currentIdx + 1) % this.state.game.playerOrder.length;
    this.state.game.activePlayerId = this.state.game.playerOrder[nextIdx];

    if (nextIdx === 0) {
      this.state.game.currentRound += 1;
      for (const [, player] of this.state.game.players) {
        player.hasRolled = false;
        if (player.position >= 1) {
          player.position -= 1;
        }
      }
      
      const newTileConfig = this.generateNextTile();
      this.state.game.diceTrack.splice(1, 1);
      this.state.game.diceTrack.push(new TileState(newTileConfig.type, newTileConfig.amount, newTileConfig.label));
      
      this.state.pushAction('SHIFT_TRACK', this.state.game.activePlayerId, { newTile: newTileConfig });
      this.state.game.turnPhase = 'resolving-shift';
    } else {
      this.state.game.turnPhase = "awaiting-roll";
    }
    this.state.pushAction('UPDATE_ACTIVE_PLAYER', this.state.game.activePlayerId, { playerId: this.state.game.playerOrder[nextIdx] });
  }
}

// server/logic/TurnProcessor.ts (inline for reference/completeness based on previous codebase)
export function processStatusEffects(state: RoomState, playerId: string) {
  const player = state.game.players.get(playerId)!;

  // Iterate backwards to allow safe removal
  for (let i = player.statusEffects.length - 1; i >= 0; i--) {
    const effect = player.statusEffects[i];

    switch (effect.id as StatusEffectID) {
      case "DEBT":
        player.money -= 100;
        break;
      case "INCOME":
        player.money += 100;
        break;
      case "SHIELD_ACTIVE":
        // Shield active logic handled when attacked.
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