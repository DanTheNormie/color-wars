# Color Wars Development Tasks

## Specification Summary
**Original Requirements**: Implement the dynamic economy (Empire Tax, Upgrades), the definitive endgame "The Capital", the asynchronous trading system, Card applying effects, and the Bankruptcy elimination rule.
**Technical Stack**: Node.js, Colyseus (Server), React 19, PixiJS 8, GSAP, Zustand (Client), Monorepo Types (Shared).
**Target Timeline**: MVP completion (Focus on economy bleed, basic upgrades, and bankruptcy).

## Development Tasks

### [ ] Task 1: Empire Tax Implementation
**Description**: Implement the "Empire Tax" maintenance penalty for hoarding base territories.
**Acceptance Criteria**:
- Server calculates `0.2x` base maintenance for the first territory.
- Server applies a stacking `+5%` (0.05x) maintenance leak to ALL Base Territories for each owned empty territory beyond the first.
- Maintenance is deducted from the player's Safe Account at the start of their turn or end of round.

**Files to Create/Edit**:
- `shared/src/maps/index.ts` (Economy math)
- `server/src/game/GameEngine.ts`

**Reference**: GDD Section 3.1

### [ ] Task 2: City & Factory Upgrades
**Description**: Allow players to upgrade territories to Cities and Factories if they own the respective Permit.
**Acceptance Criteria**:
- `UPGRADE_TERRITORY` schema action created.
- Client UI (TerritoryDrawer) shows Upgrade buttons with correct pricing.
- Server validates player has Permit & Funds.
- City upgrades stop the bleed, Factories generate profit.

**Files to Create/Edit**:
- `shared/src/protocol.ts`
- `server/src/game/GameEngine.ts`
- `client/src/components/TerritoryInfo.tsx`

**Reference**: GDD Section 3.1, Rulebook Section 4

### [ ] Task 3: Permit Shop & Card Effects Integration
**Description**: Implement the UI and server logic to buy permits from the Shop, and apply card effects (like `GET_2000_CASH` or `KILL`).
**Acceptance Criteria**:
- Players can purchase City, Industry, Military permits, and the lone Capital Blueprint from a Shop UI.
- `SELECT_CARD` action properly resolves and invokes the `rewardService.ts` to grant the effect, resolving the current `TODO`.

**Files to Create/Edit**:
- `server/src/game/rewardService.ts`
- `client/src/components/ShopModal.tsx` (New)

**Reference**: GDD Section 3.3, LLM Context Section 9 (Card effects).

### [ ] Task 4: Bankruptcy & Elimination rules
**Description**: Implement Bankruptcy logic when a player's Account + Backpack drops below 0.
**Acceptance Criteria**:
- Force player to sell territories/upgrades if below $0.
- If $0 and 0 properties, player is eliminated. Territoies become neutral.
- If 3 out of 4 players are bankrupt, trigger win state.

**Files to Create/Edit**:
- `server/src/game/GameEngine.ts`
- `client/src/components/GameStatus.tsx`

**Reference**: Rulebook Section 6, GDD Section 5

### [ ] Task 5: The Capital (Win Condition)
**Description**: Implement the ability to construct 'The Capital' monument and the 1-round Panic Mode.
**Acceptance Criteria**:
- Requires Capital Blueprint, Missile Card, Shield Card, City/Factory, and $100k.
- Changes game state to "Panic Mode" (UI red sirens).
- If player survives a full track rotation without getting bankrupt/destroyed, player wins.

**Files to Create/Edit**:
- `server/src/game/GameEngine.ts`
- `client/src/components/NewGameBoard/vfxOverlayLayer/`

**Reference**: GDD Section 3.2, Section 5

### [ ] Task 6: Asynchronous Trading System
**Description**: Implement Tinder-swipe style trading between players.
**Acceptance Criteria**:
- Ability to propose trades (Cash, Cards, Territories) to any player at any time.
- Big ACCEPT/REJECT UI overlay for the recipient.
- Server correctly swaps assets upon ACCEPT.

**Files to Create/Edit**:
- `shared/src/types/RoomState.ts`
- `client/src/components/TradeOverlay.tsx`

**Reference**: GDD Section 4.2

## Quality Requirements
- [ ] Ensure `shared/src/validator/rules.ts` pure functions are used for all new actions.
- [ ] Turn actions must be pushed via `turnActionHistory` so the client `ActionQueue` animates them correctly.
- [ ] Visual Spectacle requires GSAP/PixiJS feedback for big events (e.g., Nuke, Capital built).
