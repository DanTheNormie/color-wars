import { readFileSync } from "fs";
import path from "path";
import { PlayerState, RoomState, TerritoryState, TileState } from "@color-wars/shared/src/types/RoomState";
import { PLAYER } from "@color-wars/shared/src/config/game";
import { Client, Room } from "colyseus";
import { StatusEffect } from "@color-wars/shared/src/types/RoomState";
import { StatusEffectID } from "@color-wars/shared/src/types/effectId";
import { RewardService } from "./rewardService";
import { RewardConfig } from "@color-wars/shared/src/types/rewardConfig";
import { MAPS, income, maintenanceCost } from "@color-wars/shared/src/maps";
import { type TileType, DICE_TRACK, TileConfig } from "@color-wars/shared/src/config/diceTrack"
import { type DevelopmentType } from "@color-wars/shared/src/types/economyTypes";


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
      player.money = 20000;
      player.position = 0;
      player.hasRolled = false;
    }

    this.state.game.diceTrack.clear();
    for (const tileConfig of DICE_TRACK) {
      this.state.game.diceTrack.push(new TileState(tileConfig.type, tileConfig.amount, tileConfig.label));
    }

    this.state.game.activePlayerId = this.state.game.playerOrder.at(0);
    this.state.queueAction('UPDATE_ACTIVE_PLAYER', { playerId: this.state.game.playerOrder.at(0) })
    // this.state.pushAction('UPDATE_ACTIVE_PLAYER', this.state.game.activePlayerId, { playerId: this.state.game.playerOrder.at(0) });
    this.state.game.turnPhase = "awaiting-roll";
  }

  handleRoll(client: Client) {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const roll = die1 + die2;
    this.state.game.diceState.rollTo.clear();
    this.state.game.diceState.rollTo.push(die1, die2);
    this.state.queueAction('ROLL_DICE', { die1, die2 })
    // this.state.pushAction("ROLL_DICE", client.sessionId, { die1, die2 });

    const player = this.state.game.players.get(client.sessionId)!;
    const fromTile = player.position;
    const toTile = (fromTile + roll) % this.state.game.diceTrack.length;

    const destTileConfig = this.state.game.diceTrack[toTile];

    player.position = toTile;
    this.state.queueAction('MOVE_PLAYER', { fromTile, toTile, tokenId: client.sessionId })
    // this.state.pushAction("MOVE_PLAYER", client.sessionId, { fromTile, toTile, tokenId: client.sessionId });

    if ((fromTile + roll) >= this.state.game.diceTrack.length) {
      this.bankBackpack(client.sessionId);
    }

    this.handleTileEffect(destTileConfig, player)

    this.updateFinancialStatus(client.sessionId)

    player.hasRolled = true;
    if (this.state.game.turnPhase === 'awaiting-roll') this.state.game.turnPhase = 'awaiting-end-turn'
  }

  updateFinancialStatus(playerId: string) {
    const player = this.state.game.players.get(playerId)!;
    if((player.backpack.money >= 0 ) && player.financialStatus !== "healthy"){
      player.financialStatus = "healthy"
      this.state.queueAction('UPDATE_FINANCIAL_STATUS', { playerId: player.id, financialStatus: "healthy" })
      // this.state.pushAction("UPDATE_FINANCIAL_STATUS", player.id, { playerId: player.id, financialStatus: "healthy" })
    }else if((player.backpack.money < 0) && player.financialStatus !== "in-debt"){
      player.financialStatus = "in-debt"
      this.state.queueAction('UPDATE_FINANCIAL_STATUS', { playerId: player.id, financialStatus: "in-debt" })
      // this.state.pushAction("UPDATE_FINANCIAL_STATUS", player.id, { playerId: player.id, financialStatus: "in-debt" })
    }
  }
    

  payOffDebt(client: Client) {
    const player = this.state.game.players.get(client.sessionId)!;
    const debt = player.backpack.money;
    if (debt < 0) {
      player.money += debt;
      player.backpack.money = 0;
      this.updateFinancialStatus(client.sessionId)
      this.state.queueAction('PAY_OFF_DEBT', { playerId: client.sessionId, amount: debt })
      // this.state.pushAction("PAY_OFF_DEBT", client.sessionId, { playerId: client.sessionId, amount: debt });

    }
  }

  bankBackpack(playerId: string) {
    const player = this.state.game.players.get(playerId)!;
    const backpackMoney = player.backpack.money;
    const backpackCards = [...player.backpack.cards];
    
    // Calculate territory income/maintenance
    let territoryNet = 0;
    this.state.game.territoryOwnership.forEach((tState, tId) => {
      if (tState.ownerId === playerId) {
        const territory = MAPS[this.state.mapID].map.territories.find(t => t.id === tId);
        if (territory) {
          const size = territory.hexes.length;
          const economy = MAPS[this.state.mapID].economy;
          
          const inc = income(size, tState.buildingType as DevelopmentType, economy);
          const maint = maintenanceCost(size, tState.buildingType as DevelopmentType, economy);
          territoryNet += (inc - maint);
        }
      }
    });

    if (backpackMoney > 0 || backpackCards.length > 0 || territoryNet !== 0) {
      const netAmount = backpackMoney + territoryNet;
      player.money += netAmount;
      player.cards.push(...backpackCards);
      
      player.backpack.money = 0;
      player.backpack.cards.clear();
      
      this.state.queueAction('BANK_BACKPACK_ITEMS', { playerId: playerId, money: netAmount, cards: backpackCards })
    }
  }

  handleTileEffect(tileConfig: TileConfig | TileState, player: PlayerState) {
    switch (tileConfig.type) {
      case 'INCOME': {
        const amount = tileConfig.amount!
        player.backpack.money += amount
        this.state.queueAction('INCR_MONEY', { playerId: player.id, amount: amount })
        // this.state.pushAction('INCR_MONEY', player.id, { playerId: player.id, amount: amount })
        break;
      }
      case 'TAX': {
        const amount = tileConfig.amount!
        player.backpack.money -= amount
        this.state.queueAction('DECR_MONEY', { playerId: player.id, amount: amount })
        // this.state.pushAction('DECR_MONEY', player.id, { playerId: player.id, amount: amount })
        break;
      }
      case 'REWARD': {
        const amount = this.getRandomNumberWithStep(1000, 10000, 1000)
        player.backpack.money += amount
        this.state.queueAction('INCR_MONEY', { playerId: player.id, amount: amount })
        // this.state.pushAction('INCR_MONEY', player.id, { playerId: player.id, amount: amount })
        break;
      }
      case 'PENALTY': {
        const amount = this.getRandomNumberWithStep(1000, 10000, 1000)
        player.backpack.money -= amount
        this.state.queueAction('DECR_MONEY', { playerId: player.id, amount: amount })
        // this.state.pushAction('DECR_MONEY', player.id, { playerId: player.id, amount: amount })
        break;
      }
      case 'SURPRISE': {
        const generatedCardConfigs = RewardService.generateOptions({ count: 3, allowDuplicates: false });
        // temporarily store the selected configs in state by serializing them, or simply storing the indices of the pool.
        // For simplicity now, we can just pack the JSON string to the client.
        const packedIds = generatedCardConfigs.map(c => JSON.stringify(c));
        this.state.game.turnPhase = 'resolving-draft'
        this.state.game.generatedCardIDs.push(...packedIds)
        this.state.queueAction('DRAW_3_REWARD_CARDS', { playerId: player.id, cardIds: packedIds })
        // this.state.pushAction("DRAW_3_REWARD_CARDS", player.id, { playerId: player.id, cardIds: packedIds });
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

    this.state.queueAction('BUY_TERRITORY', { playerId: player.id, territoryID, amount: cost })
    // this.state.pushAction('BUY_TERRITORY', player.id, { playerId: player.id, territoryID, amount: cost })

    player.money -= cost;
    this.state.game.territoryOwnership.set(territoryID, new TerritoryState(player.id))
  }

  sellTerritory(client: Client, territoryID: string) {
    const player = this.state.game.players.get(client.sessionId)!

    const territorySize = MAPS[this.state.mapID].map.territories.find((t) => t.id === territoryID)!.hexes.length

    const economy = MAPS[this.state.mapID].getTerritoryEconomy(territorySize)

    const cost = economy.BASE.capEx / 2

    this.state.queueAction('SELL_TERRITORY', { playerId: player.id, territoryID, amount: cost })
    // this.state.pushAction('SELL_TERRITORY', player.id, { playerId: player.id, territoryID, amount: cost })

    player.money += cost;
    this.state.game.territoryOwnership.delete(territoryID)
  }

  upgradeTerritory(client: Client, territoryID: string, buildingType: DevelopmentType) {
    const player = this.state.game.players.get(client.sessionId)!;
    const territory = MAPS[this.state.mapID].map.territories.find((t) => t.id === territoryID)!;
    const size = territory.hexes.length;
    const economy = MAPS[this.state.mapID].getTerritoryEconomy(size);
    const cost = (economy as any)[buildingType].capEx;

    player.money -= cost;
    const territoryState = this.state.game.territoryOwnership.get(territoryID)!;
    territoryState.buildingType = buildingType;

    this.state.queueAction('UPGRADE_TERRITORY', { playerId: player.id, territoryID, buildingType, amount: cost });
  }

  downgradeTerritory(client: Client, territoryID: string) {
    const player = this.state.game.players.get(client.sessionId)!;
    const territoryState = this.state.game.territoryOwnership.get(territoryID)!;
    const currentBuilding = territoryState.buildingType;
    
    const territory = MAPS[this.state.mapID].map.territories.find((t) => t.id === territoryID)!;
    const size = territory.hexes.length;
    const economy = MAPS[this.state.mapID].getTerritoryEconomy(size);
    
    const refund = Math.floor(((economy as any)[currentBuilding].capEx) * 0.5);

    player.money += refund;
    territoryState.buildingType = "BASE";

    this.state.queueAction('DOWNGRADE_TERRITORY', { playerId: player.id, territoryID, amount: refund });
  }

  selectCard(client: Client, encodedConfig: string) {
    const player = this.state.game.players.get(client.sessionId)!;
    this.state.game.generatedCardIDs.clear();

    // Attempt to decode the config pushed from DRAW_3_REWARD_CARDS
    const config = JSON.parse(encodedConfig) as RewardConfig;
    this.state.queueAction('SELECT_CARD', { selectedCardId: encodedConfig })
    // this.state.pushAction('SELECT_CARD', player.id, { selectedCardId: encodedConfig });

    // apply card effect
    if (config.type === "INSTANT_CASH") {
      const amount = this.getRandomNumberWithStep(config.min, config.max, config.step);
      player.backpack.money += amount;
      this.state.queueAction('INCR_MONEY', { playerId: player.id, amount })
      // this.state.pushAction('INCR_MONEY', player.id, { playerId: player.id, amount });
    } else if (config.type === "CARD") {
      player.backpack.cards.push(config.cardId);
      this.state.queueAction('ADD_CARD', { playerId: player.id, cardId: config.cardId })
      // this.state.pushAction('ADD_CARD', player.id, { playerId: player.id, cardId: config.cardId });
    }

    this.state.game.turnPhase = 'awaiting-end-turn';
  }

  declareBankruptcy(client: Client) {
    const player = this.state.game.players.get(client.sessionId)!;
    player.financialStatus = "bankrupt"
    
    // 1. Lose all money
    player.money = 0;
    player.backpack.money = 0;
    player.backpack.cards.clear();
    
    // 2. Lose all territories
    this.state.game.territoryOwnership.forEach((territoryState, territoryId) => {
      if (territoryState.ownerId === player.id) {
        this.state.game.territoryOwnership.delete(territoryId);
      }
    });

    // 3. Update status
    this.state.queueAction('UPDATE_FINANCIAL_STATUS', { playerId: player.id, financialStatus: player.financialStatus })
    // this.state.pushAction("UPDATE_FINANCIAL_STATUS", player.id, { playerId: player.id, financialStatus: player.financialStatus });
    this.state.queueAction('UPDATE_PLAYER_MONEY', { playerId: player.id, amount: 0 })
    // this.state.pushAction("UPDATE_PLAYER_MONEY", player.id, { playerId: player.id, amount: 0 });
    this.state.queueAction('UPDATE_PLAYER_BACKPACK_MONEY', { playerId: player.id, amount: 0 })
    // this.state.pushAction("UPDATE_PLAYER_BACKPACK_MONEY", player.id, { playerId: player.id, amount: 0 });

    // 4. Pass turn if it's their turn
    if (this.state.game.activePlayerId === player.id) {
      this.endTurn();
    } else {
      this.checkGameOver();
    }
  }

  checkGameOver() {
    const activePlayers = Array.from(this.state.game.players.values()).filter(p => p.financialStatus !== "bankrupt");
    
    // If only one player is left, they win
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      this.state.game.turnPhase = "game-over";
      this.state.queueAction('GAME_OVER', { winnerId: winner.id })
      // this.state.pushAction("GAME_OVER", winner.id, { winnerId: winner.id });
    }
  }

  generateNextTile(): TileConfig {
    const round = this.state.game.currentRound;

    // INCOME: dip in mid, rise again late
    const incomeWeight = Math.max(
      15,
      Math.min(60, 50 - round * 2 + round * round * 0.08)
    );

    // SAFE: steadily dies
    const safeWeight = Math.max(3, 30 - round * 1.5);

    // TAX: ramps hard
    const taxWeight = Math.min(50, 5 + round * 2.5);

    // PENALTY: ramps too
    const penaltyWeight = Math.min(40, round * 1.5);

    // keep these
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
      const max = 5000 + round * 200;
      amount = this.getRandomNumberWithStep(1000, max, 1000);
    }

    if (selectedType === 'TAX') {
      const max = 2500 + round * 150;
      amount = this.getRandomNumberWithStep(500, max, 500);
    }

    return { type: selectedType, amount };
  }

  shiftTrack(direction: "forward" | "backward", count: number = 1) {
    const newTiles: TileConfig[] = [];
    
    for (let i = 0; i < count; i++) {
      const newTileConfig = this.generateNextTile();
      newTiles.push(newTileConfig);
      
      if (direction === 'forward') {
        this.state.game.diceTrack.splice(1, 1);
        this.state.game.diceTrack.push(new TileState(newTileConfig.type, newTileConfig.amount, newTileConfig.label));
      } else {
        this.state.game.diceTrack.pop();
        this.state.game.diceTrack.unshift(new TileState(newTileConfig.type, newTileConfig.amount, newTileConfig.label));
        this.state.game.diceTrack.move((cards)=>{
          [cards[0], cards[1]] = [cards[1], cards[0]]
        })
      }
    }
    newTiles.reverse();

    const playersToBank: string[] = [];

    // Update player positions
    for (const [, player] of this.state.game.players) {
      if (player.position >= 1) {
        if (direction === 'forward') {
          player.position = Math.max(0, player.position - count);
        } else {
          const newPosition = player.position + count;
          if(newPosition > this.state.game.diceTrack.length - 1){
            player.position = 0;
            playersToBank.push(player.id);
          } else {
            player.position = newPosition;
          }
        }
      }
    }
    
    this.state.queueAction('SHIFT_TRACK', { newTiles, shiftDirection: direction, diceTrack: Array.from(this.state.game.diceTrack) })
    // this.state.pushAction('SHIFT_TRACK', this.state.game.activePlayerId, { newTiles, shiftDirection: direction, diceTrack: Array.from(this.state.game.diceTrack) });
    
    for (const playerId of playersToBank) {
      this.bankBackpack(playerId);
    }

    this.state.game.turnPhase = 'resolving-shift';
  }

  endTurn() {
    const currentIdx = this.state.game.playerOrder.indexOf(this.state.game.activePlayerId);
    let nextIdx = (currentIdx + 1) % this.state.game.playerOrder.length;

    // Skip bankrupt players
    let attempts = 0;
    while (
      this.state.game.players.get(this.state.game.playerOrder[nextIdx])?.financialStatus === "bankrupt" &&
      attempts < this.state.game.playerOrder.length
    ) {
      nextIdx = (nextIdx + 1) % this.state.game.playerOrder.length;
      attempts++;
    }

    // Check if the game is over (only one player left)
    //this.checkGameOver();
    if (this.state.game.turnPhase === "game-over") {
      return;
    }

    this.state.game.activePlayerId = this.state.game.playerOrder[nextIdx];

    if (nextIdx === 0) {
      this.state.game.currentRound += 1;
      for (const [, player] of this.state.game.players) {
        if (player.financialStatus !== "bankrupt") {
          player.hasRolled = false;
        }
      }
      this.shiftTrack('backward', this.state.game.currentRound);
    } else {
      this.state.game.turnPhase = "awaiting-roll";
    }
    this.state.queueAction('UPDATE_ACTIVE_PLAYER', { playerId: this.state.game.activePlayerId })
    //this.state.pushAction('UPDATE_ACTIVE_PLAYER', this.state.game.activePlayerId, { playerId: this.state.game.activePlayerId });
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