import { DEVELOPMENT_TYPES, type EconomyConfig } from "../../types/economyTypes";

export const INDIA_ECONOMY: EconomyConfig = {
  basePricePerSize: 100,
  baseMaintenanceMultiplier: 0.2,

  developments: {
    [DEVELOPMENT_TYPES.BASE]: {
      buildMultiplier: 1,
      maintenanceMultiplier: 0,
      incomeMultiplier: 0,
    },
    [DEVELOPMENT_TYPES.CITY]: {
      buildMultiplier: 0.5,
      maintenanceMultiplier: 0.7,
      incomeMultiplier: 0.7,
    },
    [DEVELOPMENT_TYPES.FACTORY]: {
      buildMultiplier: 1.5,
      maintenanceMultiplier: 0.5,
      incomeMultiplier: 1,
    },
    [DEVELOPMENT_TYPES.MISSILE_SILO]: {
      buildMultiplier: 3.0,
      maintenanceMultiplier: 2.5,
      incomeMultiplier: 0,
    },
  },
};
