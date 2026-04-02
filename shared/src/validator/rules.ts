import type { Message, PlainStateOf, RoomState } from "../types/RoomState.js";

import { MAPS } from "../maps/index.js";

// 1. Define the Shapes (The requirements)
// Every action context in your app seems to have a playerId
interface WithPlayer {
  senderId: string;
}

interface WithTerritoryID extends WithPlayer {
  territoryID: string
}
interface WithCardID extends WithPlayer {
  cardID: string
}
interface WithUpgrade extends WithTerritoryID {
  buildingType: string;
}
interface WithVictimID extends WithPlayer {
  victimId: string;
}
interface WithProposeTrade extends WithPlayer {
  targetPlayerId: string;
  offer: {
    playerAGivesCash: number;
    playerBGivesCash: number;
    playerAGivesCards: string[];
    playerBGivesCards: string[];
    playerAGivesTerritories: string[];
    playerBGivesTerritories: string[];
  };
}
interface WithTradeId extends WithPlayer {
  tradeId: string;
}
interface WithMissileLaunch extends WithPlayer {
  fromTerritoryID: string;
  targetTerritoryID: string;
}

export const requireOwnsFromTerritory = (s: PlainStateOf<RoomState>, ctx: WithMissileLaunch) => {
  const territoryState = s.game.territoryOwnership[ctx.fromTerritoryID];
  if (!territoryState || territoryState.ownerId !== ctx.senderId) {
    throw new Error("You do not own the launch territory");
  }
};

export const requireMissileSiloOnTerritory = (s: PlainStateOf<RoomState>, ctx: WithMissileLaunch) => {
  const territoryState = s.game.territoryOwnership[ctx.fromTerritoryID];
  if (!territoryState || (territoryState as any).buildingType !== "MISSILE_SILO") {
    throw new Error("Launch territory does not have a Missile Silo");
  }
};

export const requireHasNotLaunchedMissile = (s: PlainStateOf<RoomState>, ctx: WithPlayer) => {
  const player = s.game.players[ctx.senderId];
  if (player && (player as any).hasLaunchedMissileThisRound) {
    throw new Error("You can only launch one missile per round");
  }
};

export const requireNotBuiltThisRound = (s: PlainStateOf<RoomState>, ctx: WithPlayer) => {
  const player = s.game.players[ctx.senderId];
  if (player && (player as any).missileSiloBuiltRound >= s.game.currentRound) {
    throw new Error("Cannot launch a missile the same round the silo was built");
  }
};

export const requireTargetIsAdjacent = (s: PlainStateOf<RoomState>, ctx: WithMissileLaunch) => {
  const mapID = s.mapID;
  const adjacencies = (MAPS[mapID].map as any).adjacencies;
  if (!adjacencies) throw new Error("Map has no adjacency data");
  const neighbors: string[] = adjacencies[ctx.fromTerritoryID] || [];
  if (!neighbors.includes(ctx.targetTerritoryID)) {
    throw new Error("Target territory is not adjacent to the launch site");
  }
};

export const requireTargetIsOwned = (s: PlainStateOf<RoomState>, ctx: WithMissileLaunch) => {
  const territoryState = s.game.territoryOwnership[ctx.targetTerritoryID];
  if (!territoryState) {
    throw new Error("Target territory is not owned by anyone");
  }
};

export const requireTargetNotSelf = (s: PlainStateOf<RoomState>, ctx: WithMissileLaunch) => {
  const territoryState = s.game.territoryOwnership[ctx.targetTerritoryID];
  if (territoryState && territoryState.ownerId === ctx.senderId) {
    throw new Error("You cannot fire a missile at your own territory");
  }
};

export const requireVictimOnSameTile = (s: PlainStateOf<RoomState>, ctx: WithVictimID) => {
  const attacker = s.game.players[ctx.senderId];
  const victim = s.game.players[ctx.victimId];
  if (!victim) throw new Error("Victim does not exist");
  if (attacker.position !== victim.position) {
    throw new Error("Victim must be on the same tile as you");
  }
};

export const requireVictimIsNotSelf = (s: PlainStateOf<RoomState>, ctx: WithVictimID) => {
  if (ctx.senderId === ctx.victimId) {
    throw new Error("You cannot sabotage yourself");
  }
};

export const requireVictimNotBankrupt = (s: PlainStateOf<RoomState>, ctx: WithVictimID) => {
  const victim = s.game.players[ctx.victimId];
  if (victim && victim.status === "bankrupt") {
    throw new Error("You cannot sabotage a bankrupt player");
  }
};

export const requireHasNotSabotaged = (s: PlainStateOf<RoomState>, ctx: WithPlayer) => {
  const player = s.game.players[ctx.senderId];
  if (player && player.hasSabotagedThisRound) {
    throw new Error("You can only sabotage once per turn");
  }
};

export const requireTileNotSafe = (s: PlainStateOf<RoomState>, ctx: WithPlayer) => {
  const player = s.game.players[ctx.senderId];
  if (!player) return;
  const tile = s.game.diceTrack[player.position];
  if (tile && (tile.type === "SAFE" || tile.type === "START")) {
    throw new Error("You cannot sabotage on a safe tile");
  }
};

export const requireAwaitingEndTurnPhase = (s: PlainStateOf<RoomState>) => {
  if (s.game.turnPhase !== "awaiting-end-turn") {
    throw new Error("You can only sabotage after rolling but before ending your turn");
  }
};

export const requireTerritoryExists = (s: PlainStateOf<RoomState>, ctx: WithTerritoryID) => {
  const mapID = s.mapID
  const territoryExists = MAPS[mapID].map.territories.some((t)=>t.id == ctx.territoryID)
  if(!territoryExists) throw new Error(`Territory with id: ${ctx.territoryID}, does not exist`)
  }

export const requireEnoughMoneyToBuyTerritory = (s: PlainStateOf<RoomState>, ctx: WithTerritoryID) => {
  const mapID = s.mapID;
  const territory = MAPS[mapID].map.territories.find((t)=>t.id == ctx.territoryID)!
  const territorySize = territory?.hexes.length
  const economy = MAPS[mapID].getTerritoryEconomy(territorySize)

  const player = s.game.players[ctx.senderId]
  
  if(player.money < economy.BASE.capEx) throw new Error("Player does not have enough money to make this purchase")
}

export const requirePlayerInDebt = (s: PlainStateOf<RoomState>, ctx: WithPlayer) => {
  const player = s.game.players[ctx.senderId]
  if(player.money >= 0) throw new Error("Player is not in debt")
}

export const requireEnoughMoneyToPayOffDebt = (s: PlainStateOf<RoomState>, ctx: WithPlayer) => {
  const player = s.game.players[ctx.senderId]
  if(player.money < 0) throw new Error("Player does not have enough money to pay off debt")
}

export const requireTerritoryVacant = (s: PlainStateOf<RoomState>, ctx: WithTerritoryID) => {
  const territoryState = s.game.territoryOwnership[ctx.territoryID]
  if(territoryState) throw new Error(`Territory with id: ${ctx.territoryID}, is not vacant`)
}

export const requireTerritoryOwnerShip = (s: PlainStateOf<RoomState>, ctx: WithTerritoryID) => {
  const territoryState = s.game.territoryOwnership[ctx.territoryID]
  if(!territoryState || (territoryState.ownerId != ctx.senderId)) throw new Error(`Player does not own territory with id: ${ctx.territoryID}`)
}

export const requireResolvingDraftState = (s: PlainStateOf<RoomState>, ctx: WithCardID) => {
  if(s.game.turnPhase !== 'resolving-draft') throw new Error(`Turn phase is not "resolving-draft"`)
}

export const requireDrawnCards = (s: PlainStateOf<RoomState>, ctx: WithCardID) => {
  if(s.game.generatedCardIDs.length !== 3) throw new Error (`No cards were drawn to choose from`)
}

export const requireValidSelectedCard = (s: PlainStateOf<RoomState>, ctx: WithCardID) => {
  if(!s.game.generatedCardIDs.some((c) => ctx.cardID == c)) throw new Error (`Selected cardID: ${ctx.cardID} was not found in the generated cards list`)
}

export const requireAdjacentOwnership = (s: PlainStateOf<RoomState>, ctx: WithTerritoryID) => {
  const mapID = s.mapID;
  const adjacencies = (MAPS[mapID].map as any).adjacencies;
  if (!adjacencies) return; // If no adjacencies defined, skip rule (or throw if required)
  
  const neighbors = adjacencies[ctx.territoryID] || [];
  for (const neighborId of neighbors) {
    const ownership = s.game.territoryOwnership[neighborId];
    if (!ownership || ownership.ownerId !== ctx.senderId) {
      throw new Error(`You must own all adjacent territories to upgrade. Missing: ${neighborId}`);
    }
  }
}

export const requireEnoughMoneyToUpgrade = (s: PlainStateOf<RoomState>, ctx: WithUpgrade) => {
  const mapID = s.mapID;
  const territory = MAPS[mapID].map.territories.find((t) => t.id === ctx.territoryID)!;
  const size = territory.hexes.length;
  const economy = MAPS[mapID].getTerritoryEconomy(size);
  const cost = (economy as any)[ctx.buildingType]?.capEx || 0;
  
  const player = s.game.players[ctx.senderId];
  if (player.money < cost) {
    throw new Error(`Insufficient funds to upgrade to ${ctx.buildingType}. Need ${cost}, have ${player.money}`);
  }
}

export const requireValidUpgradeChoice = (s: PlainStateOf<RoomState>, ctx: WithUpgrade) => {
  const territoryState = s.game.territoryOwnership[ctx.territoryID];
  if (!territoryState) throw new Error("Territory is not owned");
  
  const currentBuilding = (territoryState as any).buildingType || "BASE";

  // CAPITAL can only be built on a CITY
  if (ctx.buildingType === "CAPITAL") {
    if (currentBuilding !== "CITY") {
      throw new Error(`Capital can only be built on a City. Currently: ${currentBuilding}`);
    }
    return;
  }

  // All other upgrades require BASE
  if (currentBuilding !== "BASE") {
    throw new Error(`Territory must be downgraded to BASE before switching building types. Currently: ${currentBuilding}`);
  }
}

export const requireIsUpgraded = (s: PlainStateOf<RoomState>, ctx: WithTerritoryID) => {
  const territoryState = s.game.territoryOwnership[ctx.territoryID];
  if (!territoryState) throw new Error("Territory is not owned");
  
  const currentBuilding = (territoryState as any).buildingType || "BASE";
  if (currentBuilding === "BASE") {
    throw new Error("Territory is already at BASE level; cannot downgrade.");
  }
}

// 2. The Rules
// notice we don't reference specific Actions here, just data shapes.

export const requirePlayerExists = (s: PlainStateOf<RoomState>, c: WithPlayer) => {
  if (!s.game.players || !s.game.players[c.senderId]) {
    throw new Error("Player does not exist");
  }
};

export const requirePlayersTurn = (s: PlainStateOf<RoomState>, c: WithPlayer) => {
  if (s.game.activePlayerId !== c.senderId) {
    throw new Error("Not your turn");
  }
};

export const requireNonEmptyMessage = (s: PlainStateOf<RoomState>, c: Message) => {
  if (c.content.trim().length === 0) {
    throw new Error("Message is Empty");
  }
};

export const requireLeader = (s: PlainStateOf<RoomState>, c: WithPlayer) => {
  if (s.room.leaderId != c.senderId) {
    throw new Error("You are not the leader");
  }
};

export const requireLobbyPhase = (s: PlainStateOf<RoomState>) => {
  if(s.room.phase !== 'lobby'){
    throw new Error('Room is not in Lobby Phase')
  }
}

export const requireActivePhase = (s: PlainStateOf<RoomState>) => {
  if(s.room.phase !== 'active'){
    throw new Error('Room is not in Active Phase')
  }
}

export const requireHasRolledDice = (s: PlainStateOf<RoomState>, c: WithPlayer) => {
  const player = s.game.players[c.senderId];
  if (!player || !player.hasRolled) {
    throw new Error("Player has not rolled dice yet");
  }
};

export const requireHasNotRolledDice = (s: PlainStateOf<RoomState>, c: WithPlayer) => {
  const player = s.game.players[c.senderId];
  if (!player || player.hasRolled) {
    throw new Error("Player has already rolled dice this turn");
  }
};

export const requireValidProposeTrade = (s: PlainStateOf<RoomState>, ctx: WithProposeTrade) => {
  if (ctx.senderId === ctx.targetPlayerId) {
    throw new Error("Cannot trade with yourself");
  }
  const sender = s.game.players[ctx.senderId];
  if (!sender) throw new Error("Sender does not exist");
  const target = s.game.players[ctx.targetPlayerId];
  if (!target) throw new Error("Target player does not exist");
  
  if (sender.money < (ctx.offer.playerAGivesCash || 0)) {
    throw new Error("You don't have enough cash for this trade");
  }

  const senderCards = new Set(sender.cards);
  for (const card of (ctx.offer.playerAGivesCards || [])) {
    if (!senderCards.has(card)) throw new Error("You don't own the offered card");
  }

  for (const territoryId of (ctx.offer.playerAGivesTerritories || [])) {
    if (s.game.territoryOwnership[territoryId]?.ownerId !== ctx.senderId) {
       throw new Error(`You don't own territory ${territoryId}`);
    }
  }
};

export const requireTradeExists = (s: PlainStateOf<RoomState>, ctx: WithTradeId) => {
  if (!s.game.activeTrades[ctx.tradeId]) throw new Error("Trade does not exist");
};

export const requireTradeReceiver = (s: PlainStateOf<RoomState>, ctx: WithTradeId) => {
  const trade = s.game.activeTrades[ctx.tradeId];
  if (trade && trade.playerBId !== ctx.senderId) {
    throw new Error("You are not the receiver of this trade");
  }
};

export const requireTradeSender = (s: PlainStateOf<RoomState>, ctx: WithTradeId) => {
  const trade = s.game.activeTrades[ctx.tradeId];
  if (trade && trade.playerAId !== ctx.senderId) {
    throw new Error("You are not the sender of this trade");
  }
};

export const requireValidAcceptTrade = (s: PlainStateOf<RoomState>, ctx: WithTradeId) => {
  const trade = s.game.activeTrades[ctx.tradeId];
  if (!trade) return;

  const playerA = s.game.players[trade.playerAId];
  const playerB = s.game.players[trade.playerBId];

  // Verify Player A still has their side
  if (playerA.money < (trade.offer.playerAGivesCash || 0)) throw new Error("Proposer no longer has enough cash");
  const playerACards = new Set(playerA.cards);
  for (const card of (trade.offer.playerAGivesCards || [])) {
    if (!playerACards.has(card)) throw new Error("Proposer no longer has the offered cards");
  }
  for (const territoryId of (trade.offer.playerAGivesTerritories || [])) {
    if (s.game.territoryOwnership[territoryId]?.ownerId !== trade.playerAId) {
       throw new Error("Proposer no longer owns the offered territories");
    }
  }

  // Verify Player B has their side
  if (playerB.money < (trade.offer.playerBGivesCash || 0)) throw new Error("You don't have enough cash for this trade");
  const playerBCards = new Set(playerB.cards);
  for (const card of (trade.offer.playerBGivesCards || [])) {
    if (!playerBCards.has(card)) throw new Error("You don't own the required cards");
  }
  for (const territoryId of (trade.offer.playerBGivesTerritories || [])) {
    if (s.game.territoryOwnership[territoryId]?.ownerId !== trade.playerBId) {
       throw new Error(`You don't own the required territory ${territoryId}`);
    }
  }
};
