import { DEVELOPMENT_TYPES, type EconomyConfig } from "../../types/economyTypes.js";

export const TEST_ECONOMY: EconomyConfig = {
  basePricePerSize: 50,
  baseMaintenanceMultiplier: 0.05,
  developments: {
    [DEVELOPMENT_TYPES.BASE]: { buildMultiplier: 1,maintenanceMultiplier: 0,incomeMultiplier: 0 },
    [DEVELOPMENT_TYPES.CITY]: { buildMultiplier: 0.2, maintenanceMultiplier: 0, incomeMultiplier: 0 },
    [DEVELOPMENT_TYPES.FACTORY]: { buildMultiplier: 1, maintenanceMultiplier: 1, incomeMultiplier: 1 },
    [DEVELOPMENT_TYPES.MISSILE_SILO]: { buildMultiplier: 10, maintenanceMultiplier: 5, incomeMultiplier: 0, minHexes: 5 },
    [DEVELOPMENT_TYPES.CAPITAL]: { buildMultiplier: 10, maintenanceMultiplier: 1, incomeMultiplier: 0, minHexes: 10 },
  },
};
