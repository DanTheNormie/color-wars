# Color Wars — LLM Context

## 1. Project Overview

**Color Wars** is a real-time, multiplayer, territory-conquest board game. Think Monopoly meets Risk on a hex-grid map. Players join a room, roll dice, move around a circular dice track, earn/lose money from tile effects, buy/sell hex-based territories, draw reward/penalty cards, and compete to dominate the map.

The game is played in a browser. The server is authoritative — all game state mutations happen server-side and are replicated to clients via Colyseus's schema-based state synchronization.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | npm workspaces (`client`, `server`, `shared`) |
| **Server** | Node.js, Express, **Colyseus** (authoritative multiplayer framework) |
| **Client** | React 19, Vite 7, TypeScript, **PixiJS 8** (2D WebGL game board renderer), **GSAP** (animation), Zustand (state management), TailwindCSS 4 |
| **Shared** | TypeScript types, Colyseus `@colyseus/schema` state definitions, game config, validation rules, map data |
| **Networking** | WebSocket via Colyseus. Typed client↔server message protocol. |
| **Rendering** | PixiJS for the game board canvas (hex map + dice track + VFX layers). React DOM for UI (lobby, player panels, turn controls, card overlays). |

---

## 3. Repository Structure

```
color-wars/
├── package.json              # Root monorepo config (workspaces: client, server, shared)
├── eslint.config.js          # Shared ESLint config
├── prettier.config.cjs       # Prettier config
│
├── shared/                   # @color-wars/shared — shared types, config, maps
│   └── src/
│       ├── protocol.ts       # Client↔Server message type definitions
│       ├── types/
│       │   ├── RoomState.ts  # Colyseus schema: RoomState, GameState, PlayerState, etc.
│       │   ├── turnActionRegistry.ts  # Turn action type registry (ROLL_DICE, MOVE_PLAYER, etc.)
│       │   ├── economyTypes.ts        # Economy/development type definitions
│       │   ├── effectId.ts            # Reward, penalty, card, and status effect IDs
│       │   └── tier.ts
│       ├── config/
│       │   ├── game.ts       # Game constants (colors, icons, starting cash, track length)
│       │   ├── diceTrack.ts  # 34-tile dice track layout with tile types and amounts
│       │   └── room.ts       # Room defaults (max players, room type)
│       ├── maps/
│       │   ├── index.ts      # Map registry (INDIA, TEST), economy calculation functions
│       │   ├── india/        # India map JSON data + economy config
│       │   └── test/         # Test map JSON data + economy config
│       └── validator/
│           ├── index.ts      # validateOrThrow() — runs rules before server executes an action
│           └── rules.ts      # Validation rules (requirePlayersTurn, requireEnoughMoney, etc.)
│
├── server/                   # @color-wars/server — Colyseus game server
│   └── src/
│       ├── index.ts          # Server entry point
│       ├── app.config.ts     # Colyseus app configuration
│       ├── rooms/
│       │   └── GameRoom.ts   # Main Colyseus Room — lifecycle hooks, message handlers
│       ├── game/
│       │   ├── GameEngine.ts # Core game logic (roll, move, tile effects, buy/sell, end turn)
│       │   ├── DiceTrack.ts  # Dice track utilities
│       │   ├── Map.ts        # Map utilities
│       │   └── rewardService.ts  # Reward/effect application logic
│       ├── matchmaking/      # Room manager for matchmaking
│       ├── config/           # Server-specific config
│       ├── routes/           # Express HTTP routes
│       └── utils/            # Server utilities
│
├── client/                   # @color-wars/client — React + PixiJS frontend
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx           # Router setup (LobbyPage, RoomPage)
│       ├── main.tsx          # React entry point
│       ├── pages/
│       │   ├── LobbyPage.tsx # Join/create game lobby
│       │   └── RoomPage.tsx  # Main game view (PixiCanvas + UI overlays)
│       ├── stores/           # Zustand state stores
│       │   ├── sessionStore.ts    # Primary game store (room state, player, actions)
│       │   ├── mapStateStore.ts   # Map/territory visual state
│       │   ├── diceTrackStore.ts  # Dice track token positions
│       │   ├── cardSelectionStore.ts  # Card draft overlay state machine
│       │   ├── chatStore.ts       # In-game chat messages
│       │   ├── networkStore.ts    # Network connection state
│       │   ├── animStore.ts       # Animation speed control
│       │   ├── contextStore.ts    # UI context state
│       │   ├── timeSyncStore.ts   # Time synchronization
│       │   └── InfoDrawerStore.ts # Territory info drawer UI state
│       ├── actions/          # Client-side action/animation system
│       │   ├── core.ts       # BaseAction, ActionQueue, IExecutable interface
│       │   ├── actions.ts    # Concrete actions (HexHop, RollDice, IncrMoney, DrawCards, etc.)
│       │   ├── ActionFactory.ts   # Maps action types to action classes
│       │   └── ActionContext.ts   # Action context types
│       ├── animation/        # Animation infrastructure
│       │   ├── driver/
│       │   │   └── AnimationHandle.ts  # Promise-based animation handle (cancel/complete)
│       │   ├── registry/     # Animation implementations (unit hop, coin confetti, etc.)
│       │   └── target-locator.ts  # PixiJS sprite registry for animation targeting
│       ├── lib/
│       │   ├── managers/
│       │   │   ├── network.ts      # Network singleton (Colyseus client, action history playback)
│       │   │   ├── GameEventBus.ts  # Type-safe event bus (decouples network from stores)
│       │   │   ├── zustandSync.ts   # Bridges GameEventBus → Zustand stores
│       │   │   ├── gameBootstrap.ts # Game initialization
│       │   │   ├── sound.ts         # Sound manager
│       │   │   └── toast.ts         # Toast notification manager
│       │   ├── colyseusClient.ts    # Colyseus client instance
│       │   ├── serverConfig.ts      # Server URL config
│       │   ├── cardOverlay.tsx      # Card selection overlay component
│       │   ├── diceConfig.ts        # Dice rendering config
│       │   ├── diceMath.ts          # Dice face rotation math
│       │   ├── rotationCalculator.ts  # 3D rotation helpers
│       │   ├── gsap.ts             # GSAP initialization
│       │   └── utils.ts            # General utilities
│       ├── components/
│       │   ├── NewGameBoard/       # PixiJS game board
│       │   │   ├── pixi/
│       │   │   │   ├── engine.ts   # PIXIGameBoard class (app init, layers, render loop)
│       │   │   │   ├── layers/     # Rendering layers (hex map, dice track, etc.)
│       │   │   │   ├── systems/    # ECS-style systems
│       │   │   │   └── units/      # Player sprite / token classes
│       │   │   ├── components/     # React wrappers for PixiJS canvas
│       │   │   └── config/         # Board layout config (dice track coordinates, etc.)
│       │   ├── vfxOverlayLayer/    # PixiJS VFX overlay (coin confetti, energy transfer)
│       │   ├── TurnControls.tsx    # Roll dice / end turn buttons
│       │   ├── ActionArea.tsx      # Turn action area with dice roll message display
│       │   ├── BetterDice.tsx      # 3D CSS dice component
│       │   ├── DiceHoldButton.tsx  # Dice hold/release interaction
│       │   ├── Player.tsx          # Player info panel
│       │   ├── Counter.tsx         # Animated money counter
│       │   ├── TerritoryInfo.tsx   # Territory info drawer
│       │   ├── LobbyActions.tsx    # Lobby controls (start game, kick player)
│       │   ├── GameStatus.tsx      # Game status bar
│       │   ├── MobileChat/        # Chat UI
│       │   ├── Toast/             # Toast components
│       │   └── ui/                # shadcn/ui primitives (Button, Select, etc.)
│       ├── hooks/            # Custom React hooks
│       ├── types/            # Client-specific type definitions
│       ├── maps/             # Client-side map generation utilities
│       ├── utils/            # Client utilities (color conversion, etc.)
│       └── assets/           # Static assets
│
└── helpers/                  # Development helpers
    ├── hex-map-editor/       # Standalone hex map editor tool
    └── svg-*.html            # SVG prototyping files
```

---

## 4. Architecture & Data Flow

### 4.1 Server Authority Pattern

```
Client Input → WebSocket Message → Server Validation → State Mutation → Schema Sync → Client Playback
```

1. **Client sends a typed message** (e.g., `ROLL_DICE`, `BUY_TERRITORY`) via `network.send()`.
2. **Server validates** the action using `validateOrThrow()` which runs composable rule functions (e.g., `requirePlayersTurn`, `requireEnoughMoney`).
3. **`GameEngine`** mutates the authoritative `RoomState` (Colyseus schema).
4. **Server pushes `GameAction`s** to `turnActionHistory` (an ArraySchema), which acts as a replicated action log.
5. **Client receives** schema changes and new actions via Colyseus state sync.
6. **Client's `Network.handleActionHistory()`** decodes each action, checks playback timing, and enqueues it as an `IExecutable` into the `ActionQueue`.
7. **`ActionQueue`** processes actions sequentially, each returning an `ActionHandle` (a Promise wrapper with cancel/complete).
8. **Actions trigger animations** (PixiJS sprite movement, GSAP tweens, coin particles) and then update Zustand stores.

### 4.2 Client Architecture Layers

```
┌─────────────────────────────────────────────────┐
│  React UI  (pages, components, TailwindCSS)     │
├─────────────────────────────────────────────────┤
│  Zustand Stores  (sessionStore, mapStateStore,  │
│  diceTrackStore, cardSelectionStore, etc.)       │
├─────────────────────────────────────────────────┤
│  ZustandSyncManager  (GameEventBus → Stores)    │
├─────────────────────────────────────────────────┤
│  GameEventBus  (typed pub/sub decoupling layer) │
├─────────────────────────────────────────────────┤
│  Network Manager  (Colyseus client, action      │
│  history playback, ActionQueue)                 │
├─────────────────────────────────────────────────┤
│  Action System  (ActionFactory, BaseAction,     │
│  ActionQueue, ActionHandle)                     │
├─────────────────────────────────────────────────┤
│  PixiJS Renderer  (PIXIGameBoard, layers,       │
│  units, VFX overlay, target-locator)            │
└─────────────────────────────────────────────────┘
```

### 4.3 Event Flow Example: Rolling Dice

1. Player clicks "Roll Dice" → `sessionStore.sendDiceMode("roll")` → `network.send("ROLL_DICE", {})`
2. Server `GameRoom` → `onAction("ROLL_DICE")` → `GameEngine.handleRoll(client)`
3. `GameEngine` generates `die1`, `die2`, calculates new position, pushes `ROLL_DICE` and `MOVE_PLAYER` actions to `turnActionHistory`, handles tile effects (may push `INCR_MONEY`, `DECR_MONEY`, `DRAW_3_REWARD_CARDS`, etc.)
4. Colyseus syncs `turnActionHistory` to client
5. Client `network.handleActionHistory()` → decodes → `ActionFactory.create()` → enqueues into `ActionQueue`
6. `RollDice` action: updates dice state in store (triggers CSS dice animation, ~2.5s)
7. `HexHop` action: animates player sprite hopping along track tiles via GSAP
8. `IncrMoney`/`DecrMoney` action: plays coin confetti VFX, then updates player money in store

---

## 5. Game Mechanics

### 5.1 Game Flow

```
LOBBY → ACTIVE → FINISHED
```

- **Lobby**: Players join, leader can configure map, kick players, start game.
- **Active**: Turn-based gameplay. Each turn:
  1. `awaiting-roll` → Player rolls dice (2d6)
  2. Player token moves clockwise on the 34-tile dice track
  3. Tile effect resolves (income, tax, reward, penalty, surprise, safe, neutral)
  4. `awaiting-end-turn` → Player can buy/sell territories, then ends turn
  5. If `SURPRISE` tile: `resolving-draft` → Player picks 1 of 3 revealed cards
  6. Next player's turn. When a full cycle completes, round counter increments.

### 5.2 Dice Track

A circular track of 34 tiles. Each tile has a type:
- **START**: Starting position
- **INCOME**: Gain a fixed amount of money
- **TAX**: Lose a fixed amount of money
- **REWARD**: Gain a random amount (10k–100k in 10k steps)
- **PENALTY**: Lose a random amount (10k–100k in 10k steps)
- **SURPRISE**: Draw 3 reward cards, pick 1
- **SAFE / NEUTRAL**: No effect

### 5.3 Territory System

- Hex-grid map divided into named territories (e.g., India map)
- Players buy/sell territories using money
- **Economy** is size-based: cost = `territorySize × basePricePerSize`
- **Development tiers**: BASE → CITY → FACTORY → MISSILE_SILO (each has build cost, maintenance, and income multipliers)
- Territory ownership stored in `GameState.territoryOwnership` (MapSchema<TerritoryState>)

### 5.4 Cards & Effects

- **Reward cards**: `GET_500_CASH`, `GET_2000_CASH`, `GET_KILL_CARD`, `GET_SHIELD_CARD`
- **Penalty types**: `INSTANT_LOSE_CASH_500`, `INSTANT_LOSE_CASH_2000`, `LOSE_ALL_CARDS`, `LOSE_RANDOM_CARD`
- **Card types**: `KILL`, `SHIELD`, `MISSILE`
- **Status effects**: `DEBT` (lose money per turn), `INCOME` (gain money per turn), with duration

### 5.5 Trade System (defined but not fully wired)

- `Trade` schema supports cash + cards + territories exchange between two players
- `TradeOffer` contains what each player gives/receives
- Status: pending → accepted/rejected

---

## 6. Shared State Schema (Colyseus)

```
RoomState
├── room: Room (id, maxPlayers, mapId, joinCode, leaderId, phase, visibility)
├── game: GameState
│   ├── activePlayerId: string
│   ├── turnPhase: TurnPhase
│   ├── players: MapSchema<PlayerState>
│   │   └── PlayerState (id, name, money, icon, color, position, ready, connected,
│   │                     hasRolled, cards, statusEffects, backpack)
│   ├── territoryOwnership: MapSchema<TerritoryState>
│   │   └── TerritoryState (ownerId, buildingType)
│   ├── activeTrades: MapSchema<Trade>
│   ├── diceState: DiceState (mode, rollTo)
│   ├── playerOrder: ArraySchema<string>
│   ├── currentRound: number
│   ├── trackOrder: ArraySchema<string>
│   └── generatedCardIDs: ArraySchema<string>
├── turnActionHistory: ArraySchema<GameAction>
├── turnCheckpoint: GameState | null
├── playersPings: MapSchema<number>
└── mapID: MapID
```

---

## 7. Client↔Server Protocol

### Client → Server Messages
| Message | Payload | Description |
|---|---|---|
| `ROLL_DICE` | `{}` | Request dice roll |
| `END_TURN` | `{}` | End current turn |
| `BUY_TERRITORY` | `{ territoryID }` | Buy a territory |
| `SELL_TERRITORY` | `{ territoryID }` | Sell a territory |
| `SELECT_CARD` | `{ cardID }` | Pick a card from draft |
| `START_GAME` | `{}` | Leader starts the game |
| `KICK_PLAYER` | `{ playerId, reason? }` | Leader kicks a player |
| `CHANGE_MAP` | `{ mapID }` | Change game map |
| `ACCELERATE_DICE` | `{}` | Dice animation: accelerate |
| `RAGDOLL_DICE` | `{}` | Dice animation: ragdoll |
| `SEND_MESSAGE` | `{ senderId, content, timeStamp }` | Chat message |
| `PONG` | `{ serverT1, clientT2 }` | Ping response |

### Server → Client Messages
| Message | Payload |
|---|---|
| `PING` | `{ serverT1 }` |
| `PING_PONG` | `{ serverT1, clientT2, serverT3 }` |
| `ACCELERATE_DICE` | `{}` |
| `RAGDOLL_DICE` | `{}` |
| `RELAY_MESSAGE` | `{ senderId, content, timeStamp }` |

### Turn Action Types (via `turnActionHistory` state sync)
| Action | Payload |
|---|---|
| `ROLL_DICE` | `{ die1, die2 }` |
| `MOVE_PLAYER` | `{ fromTile, toTile, tokenId }` |
| `INCR_MONEY` | `{ playerId, amount }` |
| `DECR_MONEY` | `{ playerId, amount }` |
| `DRAW_3_REWARD_CARDS` | `{ playerId, cardIds }` |
| `SELECT_CARD` | `{ selectedCardId }` |
| `BUY_TERRITORY` | `{ playerId, territoryID, amount }` |
| `SELL_TERRITORY` | `{ playerId, territoryID, amount }` |

---

## 8. Key Patterns & Conventions

### 8.1 Server-Side Validation
All client messages pass through `validateOrThrow()` before execution. Rules are composable pure functions:
```ts
// shared/validator/rules.ts
requirePlayerExists(state, ctx)
requirePlayersTurn(state, ctx)
requireEnoughMoneyToBuyTerritory(state, ctx)
requireTerritoryVacant(state, ctx)
// etc.
```

### 8.2 Action/Animation Queue
The client processes server actions through a sequential queue. Each action is a class extending `BaseAction<TPayload>` that returns an `ActionHandle` (Promise + cancel/complete). This enables:
- **Sequential playback**: Actions play animations one-by-one
- **Catch-up**: If client is behind, actions play at 2× speed; if heavily desynced, animations are skipped entirely
- **Cancellable**: Queue can be cleared (kill or complete all)

### 8.3 GameEventBus
A type-safe pub/sub singleton that decouples the network layer from Zustand stores. The `ZustandSyncManager` subscribes to events and forwards them to the appropriate stores. This prevents circular dependencies and allows the network layer to remain framework-agnostic.

### 8.4 PixiJS Target Locator
A global registry (`pixiTargetLocator`) maps string IDs to PixiJS display objects (sprites, containers). Actions use it to find animation targets (e.g., `pixiTargetLocator.get<PlayerSprite>(playerId)`).

### 8.5 State Sync Strategy
- On initial connection: full state snapshot (`FULL_SEND`) populates all Zustand stores
- During gameplay: Colyseus schema callbacks (`.listen()`, `.onAdd()`, `.onRemove()`) emit events through `GameEventBus`
- Turn actions arrive via `turnActionHistory.onAdd()` and are played back through the `ActionQueue`
- `turnCheckpoint` stores a pre-turn snapshot for potential rollback

---

## 9. Current State & TODOs

### Implemented
- ✅ Room lifecycle (lobby → active → finished)
- ✅ Dice rolling with 3D CSS dice animation
- ✅ Player movement along dice track with hop animation
- ✅ Tile effects (income, tax, reward, penalty, surprise)
- ✅ Territory purchase/sale with economy calculations
- ✅ Card drafting (draw 3, pick 1) with overlay UI
- ✅ Money animations (coin confetti VFX)
- ✅ In-game chat
- ✅ Player kick/leave/reconnect (10s window)
- ✅ Map selection (INDIA, TEST)
- ✅ Validation engine with composable rules
- ✅ Desync recovery (catch-up playback, skip mode)

### Partially Implemented / WIP
- 🔧 Card effects are not yet applied after selection (`selectCard` has a `TODO: apply card effect`)
- 🔧 Trade system: schemas defined but no UI or message handlers
- 🔧 Status effects: processing function exists but not integrated into turn flow
- 🔧 Development upgrades: economy math exists but no upgrade message/UI
- 🔧 Reward effects: handler map is empty stubs
- 🔧 Ping/latency tracking: commented out in several places
- 🔧 Spectator mode: `isSpectator` flag exists but no logic

---

## 10. Development Commands

```bash
# Start both server and client in dev mode
npm run dev

# Lint
npm run lint
npm run lint:fix

# Format
npm run format

# Build all workspaces
npm run build

# Clean reinstall
npm run reset
```

- Server runs via `nodemon` (auto-restart on changes)
- Client runs via `vite` dev server
- Shared package is consumed directly via workspace references (no build needed for dev)
