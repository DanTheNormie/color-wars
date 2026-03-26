import type { EconomyConfig } from "../types/economyTypes.js";
import { type DevelopmentType, DEVELOPMENT_TYPES } from "../types/economyTypes.js";
import INDIA from "./india/india.json" with { type: "json" };
import TEST from "./test/test.json" with { type: "json" };
import { INDIA_ECONOMY } from "./india/economy.js";
import { TEST_ECONOMY } from "./test/economy.js";

export const MAPS = {
  INDIA: {
    id: 'INDIA',
    map: INDIA,
    economy: INDIA_ECONOMY,
    getTerritoryEconomy: (territorySize: number) => { return getEconomy(territorySize, INDIA_ECONOMY)}
  },
  TEST: {
    id: 'TEST',
    map: TEST,
    economy: TEST_ECONOMY,
    getTerritoryEconomy: (territorySize: number) => { return getEconomy(territorySize, TEST_ECONOMY)}
  },
} as const;

const getEconomy = (territorySize: number, economy: EconomyConfig ) => {
  
  const data = {
    [DEVELOPMENT_TYPES.BASE]:{
      capEx: acquisitionCost(territorySize, economy),
      opEx: maintenanceCost(territorySize, DEVELOPMENT_TYPES.BASE, economy),
      revenue: income(territorySize, DEVELOPMENT_TYPES.BASE, economy)
    },
    [DEVELOPMENT_TYPES.CITY]: {
      capEx: buildCost(territorySize, DEVELOPMENT_TYPES.CITY, economy),
      opEx: maintenanceCost(territorySize, DEVELOPMENT_TYPES.CITY, economy),
      revenue: income(territorySize, DEVELOPMENT_TYPES.CITY, economy),
    },
    [DEVELOPMENT_TYPES.FACTORY]: {
      capEx: buildCost(territorySize, DEVELOPMENT_TYPES.FACTORY, economy),
      opEx: maintenanceCost(territorySize, DEVELOPMENT_TYPES.FACTORY, economy),
      revenue: income(territorySize, DEVELOPMENT_TYPES.FACTORY, economy)
    },
    [DEVELOPMENT_TYPES.MISSILE_SILO]: {
      capEx: buildCost(territorySize, DEVELOPMENT_TYPES.MISSILE_SILO, economy),
      opEx: maintenanceCost(territorySize, DEVELOPMENT_TYPES.MISSILE_SILO, economy),
      revenue: income(territorySize, DEVELOPMENT_TYPES.MISSILE_SILO, economy)
    }
  }

  return data
}

export type MapID = typeof MAPS[keyof typeof MAPS]['id'];
export type GameMap = (typeof MAPS)[MapID]["map"];

export function acquisitionCost(size: number, economy: EconomyConfig) {
  return niceRound(size * economy.basePricePerSize);
}

export function maintenanceCost(size: number, dev: DevelopmentType, economy: EconomyConfig) {
  const base = acquisitionCost(size, economy);
  if(dev == 'BASE') return niceRound(base * economy.baseMaintenanceMultiplier);
  return niceRound(base *  economy.developments[dev].maintenanceMultiplier);
}

export function buildCost(size: number, dev: DevelopmentType, economy: EconomyConfig) {
  if (dev === "BASE") return 0;
  return niceRound(acquisitionCost(size, economy) * economy.developments[dev].buildMultiplier);
}

export function income(size: number, dev: DevelopmentType, economy: EconomyConfig) {
  const base = acquisitionCost(size, economy);
  if(dev == 'BASE') return 0;
  return niceRound(base * economy.developments[dev].incomeMultiplier);
}

export function netYield(size: number, dev: DevelopmentType, economy: EconomyConfig) {
  return niceRound(income(size, dev, economy) - maintenanceCost(size, dev, economy));
}

const niceRound = (num:number) => {
  if(num == 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(Math.abs(num)));
  const step = magnitude / 2;
  return Math.round((num + Number.EPSILON) / step) * step;
};


