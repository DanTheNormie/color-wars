export type RewardID = 
  | "INSTANT_CASH"
  | "CARD"; // Generic identifier when the reward is drawing a card

export type PenaltyID = 
  | "INSTANT_LOSE_CASH"
  | "LOSE_ALL_CARDS"
  | "LOSE_RANDOM_CARD";

export type CardID = 
  | "KILL" 
  | "SHIELD" 
  | "PERMIT_CITY"
  | "PERMIT_FACTORY"
  | "PERMIT_MISSILE_SILO"
  | "BLUEPRINT_CAPITAL";

export type StatusEffectID = 
  | "DEBT" 
  | "INCOME"
  | "SHIELD_ACTIVE"; // Added SHIELD_ACTIVE to track active shield cards