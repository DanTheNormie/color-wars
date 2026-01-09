import type { Message, PlainStateOf, RoomState } from "../types/RoomState";

import { MAPS } from "../maps";

// 1. Define the Shapes (The requirements)
// Every action context in your app seems to have a playerId
interface WithPlayer {
  senderId: string;
}

interface WithTerritoryID extends WithPlayer {
  territoryID: string
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

export const requireTerritoryVacant = (s: PlainStateOf<RoomState>, ctx: WithTerritoryID) => {
  const territoryState = s.game.territoryOwnership[ctx.territoryID]
  if(territoryState) throw new Error(`Territory with id: ${ctx.territoryID}, is not vacant`)
}

export const requireTerritoryOwnerShip = (s: PlainStateOf<RoomState>, ctx: WithTerritoryID) => {
  const territoryState = s.game.territoryOwnership[ctx.territoryID]
  if(!territoryState || (territoryState.ownerId != ctx.senderId)) throw new Error(`Player does not own territory with id: ${ctx.territoryID}`)
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
