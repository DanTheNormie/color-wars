import { create } from "zustand";
import type { GameMap } from "@/types/map-types";
import { subscribeWithSelector } from "zustand/middleware";
import { devtools, combine } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { MAPS, type MapID } from "@color-wars/shared";
 
interface territoryEconomy {
    BASE:{
        capEx: number;
        opEx: number;
        revenue: number;
        minHexes: number | undefined;
    };
    CITY: {
        capEx: number;
        opEx: number;
        revenue: number;
        minHexes: number | undefined;
    };
    FACTORY: {
        capEx: number;
        opEx: number;
        revenue: number;
        minHexes: number | undefined;
    };
    MISSILE_SILO: {
        capEx: number;
        opEx: number;
        revenue: number;
        minHexes: number | undefined;
    };
    CAPITAL: {
        capEx: number;
        opEx: number;
        revenue: number;
        minHexes: number | undefined;
    }
}


interface MapState {
  //currentMap: GameMap | null;
  isLoading: boolean;
  error: string | null;
  hoveredTerritoryId: string | null;
  selectedTerritoryId: string | null;
  colorMap: Map<string, string>;
  current_map: GameMap;
  current_mapID: MapID;
  // Actions
  fetchMap: (url: string) => Promise<GameMap | null>;
  setHoveredTerritory: (id: string | null) => void;
  setSelectedTerritory: (id: string | null) => void;
  setTerritoryColor: (id: string, color: string) => void;
  removeTerritoryColor: (id: string) => void;
  setMapID: (mapID: MapID) => void;
  getEconomyData: () => territoryEconomy | never;
  reset: () => void;
}
export const useMapStore = create<MapState>()(
  subscribeWithSelector(
    devtools(
      immer(
        combine(
          {
            //currentMap: null as GameMap | null,
            isLoading: false,
            error: null as string | null,
            hoveredTerritoryId: null as string | null,
            selectedTerritoryId: null as string | null,
            colorMap: new Map<string, string>(),
            current_map: MAPS.INDIA.map as GameMap,
            current_mapID: MAPS.INDIA.id as MapID
          },
          (set, get) => ({
            fetchMap: async (url: string) => {
              set((state) => {
                state.isLoading = true;
                state.error = null;
              });
              try {
                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to fetch map");
                const data: GameMap = await response.json();

                // Basic validation could go here
                if (!data.hexes || !data.territories) throw new Error("Invalid map format");

                set((state) => {
                  //state.currentMap = data;
                  state.isLoading = false;
                });
                return data;
              } catch (err) {
                console.error(err);
                set((state) => {
                  state.error = (err as Error).message;
                  state.isLoading = false;
                });
                return null;
              }
            },
            setHoveredTerritory: (id: string | null) => {
              set((state) => {
                if (state.hoveredTerritoryId === id) return;
                state.hoveredTerritoryId = id;
              });
            },
            setSelectedTerritory: (id: string | null) => {
              set((state) => {
                state.selectedTerritoryId = id;
              });
            },
            setTerritoryColor: (territoryID: string, color: string) => {
              set((s) => {
                s.colorMap = new Map(s.colorMap);
                s.colorMap.set(territoryID, color);
              });
            },
            removeTerritoryColor: (territoryID: string) => {
              set((s) => {
                s.colorMap = new Map(s.colorMap);
                s.colorMap.set(territoryID, '#555555');
              });
            },
            reset: () => {
              set(useMapStore.getInitialState());
            },
            setMapID: (mapID) => {
              set((s) => {
                s.current_map = MAPS[mapID].map;
              });
            },
            getEconomyData: () => {
              const mapID = get().current_mapID
              
              const current_map = get().current_map
              
              const territoryID = get().selectedTerritoryId
              
              const selectedTerritory = current_map.territories.find((t)=>t.id == territoryID)
              if(!selectedTerritory) throw new Error(`territory ID invalid, map:${mapID}, territory:${territoryID}`)
              const territorySize = selectedTerritory?.hexes.length
              
              const economy = MAPS[mapID].getTerritoryEconomy(territorySize)
              
              return economy              
            },
          }),
        ),
      ),
      { name: "mapStateStore" },
    ),
  ),
);
