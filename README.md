# Color Wars

> A high-tension, real-time multiplayer board game of territory conquest, economic management, and cutthroat social mechanics built with React, PixiJS, and Colyseus.

## Why This Exists

Monopoly and Risk are great, but they lack the fast-paced, real-time tension of modern multiplayer games. Color Wars solves this by introducing "The Bleed"—a constant economic drain that forces players to expand, build, and extort each other to survive. With a deterministic endgame and asynchronous trading, it's designed to generate viral, highly interactive gameplay moments.

## Quick Start

The fastest way to get Color Wars running locally.

```bash
# 1. Install dependencies across the monorepo
npm install

# 2. Start the dev servers (Server: localhost:2567, Client: localhost:5173)
npm run dev
```

Open your browser to `http://localhost:5173`. Create a room, share the join code with friends, and start rolling.

## Tech Stack

Color Wars uses a modern, authoritative-server architecture:
- **Server**: Node.js, Express, **Colyseus** (strict state synchronization)
- **Client**: React 19, Vite 7, TypeScript, **PixiJS 8** (WebGL rendering), GSAP (animations), Zustand
- **Shared**: Monorepo packages for exact type, validation, and schema definitions.

## The Core Loop

1. **Roll & Move**: On your turn, roll the dice and move your token on the 34-tile circular track.
2. **Resolve Tiles**: Land on Income, Tax, Reward, Penalty, or Surprise tiles to gain or lose Backpack money.
3. **Cross START**: Secure your Backpack money into your Safe Account. Avoid getting landed on by other players, or they will steal your Backpack!
4. **Develop & Extort**: Buy empty map territories, construct Cities/Factories to generate income, or buy a Missile Silo to nuke your enemies. 

## Development Status

The game engine is currently in an **MVP state**:
- ✅ Room lifecycle, Dice rolling, Tile Effects, Territory purchasing, and Card Drafting are implemented.
- 🚧 Dynamic Economy (Empire Tax, Upgrades), Endgames (The Capital structure, Bankruptcy), and asynchronous Trading are currently in development.

## Contributing

We have a shared types structure in `@color-wars/shared`. Make sure any rules or schemas are updated there first! 
To format code and fix lint errors, use:
```bash
npm run format && npm run lint:fix
```

## License
MIT © Color Wars Team
