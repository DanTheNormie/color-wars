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
