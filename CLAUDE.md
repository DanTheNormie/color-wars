# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup
```bash
# Install dependencies across all workspaces
npm install

# Start development servers (server: localhost:2567, client: localhost:5173)
npm run dev
```

### Formatting and Linting
```bash
# Format all code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Fix lint errors
npm run lint:fix
```

### Building
```bash
# Build all packages
npm run build

# Build client only
npm run build --workspace=client

# Build server only
npm run build --workspace=server
```

### Cleaning
```bash
# Remove node_modules and lockfiles from all workspaces
npm run reset
```

### Testing
```bash
# Run all tests (Vitest)
npm test

# Run server tests only
npm run test --workspace=server

# Run tests in watch mode
npm test -- --watch

# Run a specific test file
npx vitest run path/to/test-file.test.ts
```

## Code Architecture

### Monorepo Structure
Color Wars uses a monorepo with three main packages managed by npm workspaces:
- `client`: React/Vite frontend with PixiJS rendering
- `server`: Colyseus authoritative game server (Node.js/TypeScript)
- `shared`: Common TypeScript types, schemas, and game logic shared between client and server

### Core Architecture Patterns

#### Client-Side (React + PixiJS)
- **State Management**: Zustand stores for game state (diceTrackStore, mapStateStore, etc.)
- **Rendering**: PixiJS 8 for WebGL-based game board rendering with React integration
- **Networking**: Colyseus.js client for real-time synchronization with server
- **UI Components**: Radix UI primitives styled with Tailwind CSS
- **Animations**: GSAP for smooth transitions and effects
- **Routing**: React Router DOM for navigation

#### Server-Side (Colyseus)
- **Game Logic**: Authoritative server maintaining RoomState with all game mechanics
- **Real-time Sync**: Colyseus framework for deterministic state synchronization
- **Persistence**: In-memory game state (designed for short-lived game sessions)
- **Transport**: WebSocket + HTTP fallback via Colyseus transports
- **Monitoring**: Built-in admin dashboard and playground

#### Shared Logic
- **Type Safety**: Shared TypeScript interfaces and schemas ensuring client/server consistency
- **Game Schema**: Colyseus-defined RoomState structure with all game entities
- **Validation**: Shared validation rules for game actions
- **Configuration**: Game constants, tile configurations, and map definitions

### Key Game Systems
1. **Dice Track System**: Circular 34-tile board with various tile types (Income, Tax, Reward, Penalty, Surprise)
2. **Territory Ownership**: Players can purchase territories on the map and build developments
3. **Economy System**: Money management with Backpack (liquid) vs Safe Account (secured) funds
4. **Turn Management**: Structured turn phases (roll → resolve → develop/extort → end turn)
5. **Trading System**: Asynchronous player-to-player resource exchange
6. **Bankruptcy**: Debt system and asset forfeiture mechanics
7. **Card Drafting**: Special ability cards that players can acquire and use

### Important Directories
- `client/src/components/`: React components (UI and game-specific)
- `client/src/components/NewGameBoard/pixi/`: PixiJS rendering layers and game visualization
- `client/src/stores/`: Zustand state management stores
- `client/src/lib/`: Client-side utilities and Colyseus connection
- `server/src/`: Colyseus room handlers and game logic implementation
- `server/tests/`: Server-side unit and integration tests
- `shared/src/`: Shared types, protocols, validators, and game configuration
- `shared/src/types/`: Core TypeScript interfaces (RoomState, PlayerState, etc.)
- `shared/src/protocol.ts`: Defines client-server message contracts
- `shared/src/validator/`: Validation rules for game actions
- `shared/src/maps/`: Map definitions and territory configurations
- `test/`: Additional test utilities and test servers

### Data Flow
1. User interacts with React UI → Updates Zustand stores
2. Stores trigger Colyseus actions → Sent to server via WebSocket
3. Server validates and processes action → Updates authoritative RoomState
4. Server broadcasts state changes → Clients receive and update local stores
5. UI re-renders based on updated store values

## Common Development Tasks

### Adding New Game Actions
1. Define action type in `shared/src/types/turnActionRegistry.ts`
2. Add message type to `shared/src/protocol.ts` (ClientMessages/ServerMessages)
3. Implement handler in server room logic (`server/src/` directory)
4. Create client-side action dispatcher (typically in relevant store or component)
5. Update Zustand stores if needed for client-side prediction

### Modifying Game Rules
1. Update shared configuration files in `shared/src/config/`
2. Adjust validation rules in `shared/src/validator/`
3. Modify server-side game logic implementation
4. Update client-side UI/components to reflect changes
5. Ensure corresponding TypeScript types are updated in `shared/src/types/`

### Working with Maps
- Map data is stored in `shared/src/maps/[mapName]/`
- Economy configurations define income/tax values for territories
- Map JSON files define territory geometry and adjacency
- Changes require updating both server logic and client rendering
- Use the map generator utilities in `client/src/maps/` for testing

### Debugging
- Server logs show game actions and state changes
- Colyseus monitor accessible at `http://localhost:2567/monitor` when server runs
- React DevTools for frontend state inspection
- PixiJS debugger available via `@pixi/devtools` package
- Test specific game scenarios using the test utilities in `test/`

## Code Review and Analysis Tools

This repository includes a code review knowledge graph tool for understanding code relationships:

```bash
# Build or update the code knowledge graph
npx code-review-graph:build-graph

# Review changes since last commit (token-efficient)
npx code-review-graph:review-delta

# Review a PR or branch diff
npx code-review-graph:review-pr <branch-name>

# Get impact radius of changed files
npx code-review-graph:get-impact-radius --changed-files="path/to/file.ts"

# Search for code entities semantically
npx code-review-graph:semantic-search --query="functionName"
```

## Conventions
- TypeScript strict mode enabled throughout
- Functional React components with hooks
- Zustand stores follow pattern: `[featureName]Store.ts`
- Server uses Colyseus RoomHandler pattern
- Shared interfaces use PascalCase, camelCase for properties
- Event-driven architecture via Colyseus message system
- Test files follow naming convention: `*.test.ts` or `*.test.tsx`
- Server tests located in `server/tests/`
- Client tests would be located alongside components or in `client/tests/` (when added)

## Development Workflow Tips
1. When implementing new features, start by updating shared types and protocols
2. Implement server-side logic first to ensure authoritative behavior
3. Add client-side stores and UI components last
4. Always run the full test suite before submitting changes
5. Use the code review graph tools to understand impact of changes
6. Keep the development servers running with `npm run dev` for instant feedback
7. When working with maps, test both server logic and client rendering