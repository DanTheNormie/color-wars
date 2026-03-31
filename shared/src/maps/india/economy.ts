import { DEVELOPMENT_TYPES, type EconomyConfig } from "../../types/economyTypes.js";

export const INDIA_ECONOMY: EconomyConfig = {
  basePricePerSize: 50,
  baseMaintenanceMultiplier: 0,

  developments: {
    [DEVELOPMENT_TYPES.BASE]: {
      buildMultiplier: 1,
      maintenanceMultiplier: 0,
      incomeMultiplier: 0,
    },
    [DEVELOPMENT_TYPES.CITY]: {
      buildMultiplier: 0.5,
      maintenanceMultiplier: 0,
      incomeMultiplier: 0.2,
    },
    [DEVELOPMENT_TYPES.FACTORY]: {
      buildMultiplier: 2,
      maintenanceMultiplier: 0,
      incomeMultiplier: 1,
    },
    [DEVELOPMENT_TYPES.MISSILE_SILO]: {
      buildMultiplier: 3.0,
      maintenanceMultiplier: 0.5,
      incomeMultiplier: 0,
    },
    [DEVELOPMENT_TYPES.CAPITAL]: {
      buildMultiplier: 10,
      maintenanceMultiplier: 1,
      incomeMultiplier: 0,
    },
  },
};
