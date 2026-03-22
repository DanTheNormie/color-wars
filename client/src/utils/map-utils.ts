import type { GameMap } from "@/types/map-types";


export const getAdjacent = (territoryId: any, currentMap: GameMap | null) => {
  if (!territoryId || !currentMap || !currentMap.adjacencies) return [];
  const neighbors = currentMap.adjacencies[`${territoryId}`];
  return neighbors || [];
};

export const getAdjacentOwnedByPlayer = (
  playerID: string | undefined,
  territoryId: any,
  currentMap: GameMap | null,
  territoryOwnership: any
) => {
  const neighbors = getAdjacent(territoryId, currentMap);
  if (!neighbors || neighbors.length === 0 || !territoryOwnership || !playerID) return [];
  const ownerIds = neighbors.filter(
    (neighborId: any) => territoryOwnership[neighborId]?.ownerId == playerID
  );
  return ownerIds;
};