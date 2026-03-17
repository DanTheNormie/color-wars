# Color Wars: Master Game Design Document (GDD)

## 1. Game Overview
**Color Wars** is a high-tension, real-time multiplayer board game combining territory conquest, economy management, and cutthroat social mechanics. Players roll dice to move around a track, buy territories on a map, construct upgrades to generate wealth, and ultimately race to build a massive **Capital Monument** while extorting each other to avoid bankruptcy.

---

## 2. Core Pillars
1.  **High Tension & The Bleed:** Players are constantly losing money just by existing. The map is toxic until tamed. The tension comes from staying solvent.
2.  **Spectacle & Chaos:** "Tinder-swipe" trading, mugging animations, and massive Missiles generate immediately shareable, viral "TikTok" moments.
3.  **No Safe Harbors (Except the Account):** The Backpack system ensures every player is a walking loot pinata until they cross the START tile. 
4.  **Deterministic "Checkmate" Endgame:** Randomness gets players to the late game, but the actual win condition (The Capital) forces blatant strategic investment and temporary 3v1 alliances.

---

## 3. The Revised Economy Mathematics

*The previous economy had massive spikes via RNG Drops that overshadowed Territory investments. This revised economy tightens the math so that Territories are mandatory for victory, while the Shop provides a massive money-sink.*

### 3.1 Territory Upgrades (Dynamic Sizing)
The base unit of economy is the `territorySize`.
*   `basePricePerSize = $100`
*   Example: A standard Size 30 territory acquisitions cost = **$3,000**.

| Tier | Build Cost | Maintenance / Round | Revenue / Round | Net Yield | Goal |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BASE** (Empty) | $3,000 (Acquisition) | `0.2x` ($600) + **Empire Tax** | $0 | **-$600** | Map control. Highly dangerous to hoard. |
| **CITY** | `0.5x` ($1,500) | `0.7x` ($2,100) | `0.7x` ($2,100) | **$0** | Stop the bleed. Very safe, no profit. |
| **FACTORY**| `1.5x` ($4,500) | `1.2x` ($3,600) | `1.7x` ($5,100) | **+$1,500** | Real income, but massive maintenance if Income is blocked by a Penalty effect. |

**The Empire Tax (Anti-Snowball)**
Every Base Territory owned *after* the first one adds a stacking `+5%` (0.05x) maintenance leak to ALL Base Territories. Hoarders claiming the board without building Cities will plunge into insurmountable debt in 3 rounds.

### 3.2 The Flat-Rate Structures
These structures are designed to be massive macroeconomic events. Their cost *does not* scale with territory size.

1.  **Missile Silo (The Nuke):**
    *   **Build Cost:** $25,000
    *   **Maintenance:** $15,000 / round (A fast track to bankruptcy if left active)
    *   **Constraint:** Can only be built on a Medium or Large territory.
2.  **The Capital (The Win Condition):**
    *   **Requires:** 'Capital Blueprint' + 'Missile Card' + 'Shield Card' + Existing City/Factory.
    *   **Build Cost:** $100,000
    *   **Maintenance:** $50,000 / round (Creates unbelievable panic during the final "survive one round" phase).

### 3.3 The Shop (Taming the RNG)
Permits are required to build Upgrades. They can be drawn on `SURPRISE` tiles for free, or bought in the Shop for an exorbitant "Convenience Tax".
*   **City Permit:** $3,000
*   **Industrial (Factory) Permit:** $8,000
*   **Military (Silo) Permit:** $15,000
*   **Capital Blueprint:** $100,000 (Exactly 1 is in the shop, creating a race condition).

### 3.4 Dice Track Adjustments (Nerfing the Slot Machine)
Previously, a `$55,000` average Reward drop equaled 36 rounds of Factory profit, completely destroying map strategy.
*   **INCOME Tile:** $1,500 to $3,000 (Just enough to fund a City Permit or counter some maintenance).
*   **TAX Tile:** -$1,500 to -$3,000.
*   **REWARD Tile:** $2,000 to $15,000. (An amazing windfall, but it won't buy you the Capital instantly. You still need territories).
*   **PENALTY Tile:** -$2,000 to -$15,000.

---

## 4. Key Systems & Features

### 4.1 The Banking System & Initial Capital
*   **Formulaic Starting Capital:** To prevent a Day-1 bankruptcy caused by a massive penalty roll on turn 1, players start with `Safe Account Starting Capital = Max(All Base Taxes, Lowest Possible Penalty Range)`. E.g., Starting Capital = $10,000.
*   **The Backpack:** All tile payouts, trade incomes, and territory revenues generated during a round go straight into the **Backpack** (carrying risk).
*   **The Safe Account:** All tile penalties, trade payouts, and territory maintenance are deducted from the **Safe Account**. When a player crosses START, Backpack funds are securely moved to the Safe Account.
*   **The Kill:** Landing on another player steals their Backpack. 
*   **Safe Zones:** Players are immune to Kills when standing on the **START** tile or any **SAFE** tile.

### 4.2 Asynchronous "Tinder" Trading
*   Players can propose trades instantly to any player at any time.
*   UI should take up the screen with massive "ACCEPT" or "REJECT" buttons.
*   **Extortion Loop Example:** Player A draws a *Military Clearance (Missile Silo) Permit*. They only have $1,000. Player B is about to build the Capital. Player A sends a trade to Player C: *"Give me $20k and I'll give you this Permit to nuke Player B."*

### 4.3 Viral Spectacle Triggers 
*   **Panic Mode:** The moment the Capital is built, the board lighting changes, red sirens pulse, and a massive target illuminates on the Capital hex.
*   **Global Emotes:** Players have a 1-second cooldown button to spawn drifting floating emojis (e.g., ☠️) over a targeted hex, immediately celebrating/mocking another player's bankruptcy or Penalty hit.
*   **Mugging Overlays:** Big textual "SLAM" animations across the screen when a backpack is stolen.

### 4.4 Dynamic Track Decay (The Enrage Timer)
*   **The Mechanic:** To prevent indefinite stalemates and increase late-game tension, the Dice Track shifts by one tile after every full round of turns. A new tile replaces the shifted one.
*   **Progressive Toxicity:** The track begins benign (Income, Reward, Safe). Over time, the injected tiles become heavily weighted toward Taxes and Penalties, acting as a deflationary pressure-cooker.
*   **The Forecast Queue:** To maintain player agency and avoid frustrating RNG deaths, the UI displays a "Forecast Queue" showing the next 3-5 tiles preparing to enter the track. This allows players to brace for impact by managing their Backpack/Safe Account ratios or acquiring mitigation cards.
*   **Mitigation Tools:** Players can burn Shield cards to negate track penalties, use Movement cards to carefully navigate the toxic late-game track, or use the "City Council" Shop action to spend money to alter the track.
*   **The Salvation Mechanic:** Building the Capital Monument serves as the ultimate salvation from this decay. Once built, the Capital projects a "Safe Zone" aura, significantly elevating its strategic necessity against the rotting board.

---

## 5. End Game States

### Path A: The Capital (Primary)
The first player to build the Capital triggers Checkmate/Panic Mode. They must survive exactly one rotation around the dice track until their turn starts again. If they don't go Bankrupt and the Capital is not destroyed by a Missile, they win.

### Path B: Elimination (Secondary)
If a player's Account + Backpack drops below 0, they suffer Bankruptcy and their lands are forfeited. If 3 out of 4 players are bankrupt, the remaining solvent player is the winner. This heavily leans on the map's maintenance "Empire Tax" bleeding out over-zealous players.
