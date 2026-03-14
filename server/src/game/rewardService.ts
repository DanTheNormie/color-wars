import { type Tier, TIER_WEIGHTS } from "@color-wars/shared/src/types/tier";

import { RewardConfig } from "@color-wars/shared/src/types/rewardConfig";

interface DrawOptions {
  count?: number;
  allowDuplicates?: boolean;
}

export class RewardService {
  // Grouped by tier for O(1) reward access
  public static readonly REWARD_POOL: Record<Tier, RewardConfig[]> = {
    common: [
      {
        type: "INSTANT_CASH", min: 300, max: 700, step: 100,
        ui: { title: "Cash Bonus", subtitle: "Instant random cash", colorTheme: "Emerald Green" }
      }
    ],
    uncommon: [
      {
        type: "INSTANT_CASH", min: 1000, max: 2500, step: 500,
        ui: { title: "Massive Deposit", subtitle: "Instant random cash", colorTheme: "Gold / Yellow" }
      },
      {
        type: "CARD", cardId: "KILL",
        ui: { title: "Kill Permit", subtitle: "Option to kill a player on the same tile", colorTheme: "Crimson Red" }
      }
    ],
    rare: [
      {
        type: "CARD", cardId: "SHIELD",
        ui: { title: "Shield", subtitle: "Protection against 1 kill attempt (expires after 1 round)", colorTheme: "Royal Blue" }
      },
      {
        type: "CARD", cardId: "PERMIT_CITY",
        ui: { title: "City Permit", subtitle: "Grants ability to construct a City", colorTheme: "Industrial Gray" }
      }
    ],
    epic: [
      {
        type: "CARD", cardId: "PERMIT_FACTORY",
        ui: { title: "Factory Permit", subtitle: "Grants ability to construct a Factory", colorTheme: "Industrial / Warning" }
      },
      {
        type: "CARD", cardId: "PERMIT_MISSILE_SILO",
        ui: { title: "Missile Silo Permit", subtitle: "Grants ability to construct a Silo", colorTheme: "Industrial / Warning" }
      }
    ],
    legendary: [
      {
        type: "CARD", cardId: "BLUEPRINT_CAPITAL",
        ui: { title: "Capital Blueprint", subtitle: "Required to construct the Capital building", colorTheme: "Gold" }
      }
    ],
  };

  static generateOptions({ count = 3, allowDuplicates = false }: DrawOptions = {}): RewardConfig[] {
    const results: RewardConfig[] = [];

    // Create a local copy ONLY if we need to ensure uniqueness
    const workingPool: Record<Tier, RewardConfig[]> = allowDuplicates 
        ? this.REWARD_POOL 
        : JSON.parse(JSON.stringify(this.REWARD_POOL));

    for (let i = 0; i < count; i++) {
      const selectedTier = this.pickTierWeighted(workingPool);
      if (!selectedTier) break;

      const tierArray = workingPool[selectedTier];
      const randomIndex = Math.floor(Math.random() * tierArray.length);

      if (allowDuplicates) {
        // Just pick, don't remove
        results.push(tierArray[randomIndex]);
      } else {
        // Pick and remove (ensure uniqueness)
        const [rewardConfig] = tierArray.splice(randomIndex, 1);
        results.push(rewardConfig);
      }
    }

    return results;
  }

  private static pickTierWeighted(currentPool: Record<Tier, RewardConfig[]>): Tier | null {
    const availableTiers = (Object.keys(currentPool) as Tier[]).filter((t) => currentPool[t].length > 0);

    if (availableTiers.length === 0) return null;

    const totalWeight = availableTiers.reduce((sum, t) => sum + TIER_WEIGHTS[t], 0);

    let random = Math.random() * totalWeight;

    for (const tier of availableTiers) {
      random -= TIER_WEIGHTS[tier];
      if (random <= 0) return tier;
    }

    return availableTiers[0];
  }
}
