import {defineRoom, defineServer} from "colyseus";
import { monitor } from "@colyseus/monitor";
import express from "express";
import path from "path";
import { existsSync } from "fs";
import { GameRoom } from "./rooms/GameRoom.js";
import { createMatchmakingRouter } from "./routes/matchmakingRoutes.js";
import { logger } from "./utils/logger.js";
import { DEFAULT_ROOM_TYPE } from "@color-wars/shared";
import { env } from "./config/env.js";

const registerClientBuild = (app: express.Express) => {
  const buildDir = env.clientBuildPath;
  console.log("buildDir",buildDir);
  const indexFile = path.join(buildDir, "index.html");

  if (!existsSync(buildDir) || !existsSync(indexFile)) {
    logger.warn("client_build_unavailable", { buildDir, indexFile });
    return;
  }

  app.use(express.static(buildDir, { index: false }));

  // Handle client-side routing - serve index.html for all non-API routes
  app.get("*", (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    // Don't intercept API routes
    const disallowedPrefixes = ["/matchmaking", "/monitor", "/health", "/api"];
    if (disallowedPrefixes.some((prefix) => req.path.startsWith(prefix))) {
      return next();
    }

    // Serve index.html for all client routes (including /room/:roomId)
    res.sendFile(indexFile, (error) => {
      if (error) {
        next(error);
      }
    });
  });

  logger.info("serving_client_build", { buildDir });
};

// export const colyseusConfig = config({
//   initializeGameServer: (gameServer) => {
//     gameServer.define(DEFAULT_ROOM_TYPE, GameRoom).enableRealtimeListing().sortBy({ clients: -1 });
//   },

//   initializeExpress: (app) => {
//     app.use(express.json());

//     app.use("/matchmaking", createMatchmakingRouter());

//     app.use("/monitor", monitor());

//     app.get("/health", (_req, res) => {
//       res.json({ status: "ok" });
//     });

//     if (env.nodeEnv === "production") {
//       registerClientBuild(app);
//     }
//   },

//   beforeListen: () => {
//     logger.info("color-wars server listening", { port: env.port });
//   },
// });

export const colyseusConfig = defineServer({
  rooms: {
    [DEFAULT_ROOM_TYPE]: defineRoom(GameRoom),
  }
})
  


