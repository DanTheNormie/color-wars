// shared/game/rules/economyTypes.ts
export type EconomyConfig = {
  basePricePerSize: number
  baseMaintenanceMultiplier: number

  developments: Record<Exclude<DevelopmentType, 'NONE'>, DevelopmentConfig>
}

export type DevelopmentConfig = {
  buildMultiplier: number
  maintenanceMultiplier: number
  incomeMultiplier: number
  minHexes?: number
}

export const DEVELOPMENT_TYPES = {
  BASE: "BASE",
  CITY: "CITY",
  FACTORY: "FACTORY",
  MISSILE_SILO: "MISSILE_SILO",
  CAPITAL: "CAPITAL",
} as const;

export type DevelopmentType = typeof DEVELOPMENT_TYPES[keyof typeof DEVELOPMENT_TYPES];

