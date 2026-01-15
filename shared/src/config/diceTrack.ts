export const TILE_TYPES = {
  START: "START",
  SAFE: "SAFE",
  INCOME: 'INCOME',
  TAX: 'TAX',
  REWARD: "REWARD",
  PENALTY: "PENALTY",
  SURPRISE: "SURPRISE",
  NEUTRAL: "NEUTRAL"
} as const;

export type TileType = (typeof TILE_TYPES)[keyof typeof TILE_TYPES];

export type TileConfig = {
  type: TileType,
  amount? : number,
  label? : string
}

export const DICE_TRACK: TileConfig[] = [
  {type:"START"},
  {type:"SURPRISE"},
  {type:"TAX", amount: 200},
  {type:"INCOME", amount:250},
  {type:"SAFE"},
  {type:"INCOME", amount: 500},
  {type:"NEUTRAL"},
  {type:"INCOME", amount: 600},
  {type:"REWARD"},
  {type:"TAX", amount: 800},
  {type:"SURPRISE"},
  {type:"REWARD"},
  {type:"INCOME", amount: 1000},
  {type:"NEUTRAL"},
  {type:"SAFE"},
  {type:"REWARD"},
  {type:"INCOME", amount: 1500},
  {type:"PENALTY"},
  {type:"INCOME", amount: 1800},
  {type:"NEUTRAL"},
  {type:"SAFE"},
  {type:"INCOME", amount: 2000},
  {type:"NEUTRAL"},
  {type:"TAX", amount: 2000},
  {type:"REWARD"},
  {type:"SAFE"},
  {type:"INCOME", amount: 2500},
  {type:"SURPRISE"},
  {type:"NEUTRAL"},
  {type:"INCOME", amount: 3000},
  {type:"TAX", amount: 3000},
  {type:"INCOME", amount: 3500},
  {type:"REWARD"},
  {type:"PENALTY"},
] as const;
