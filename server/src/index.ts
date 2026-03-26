import { listen } from "@colyseus/tools";
import { env } from "./config/env.js";
import { colyseusConfig } from "./app.config.js";

listen(colyseusConfig, env.port);
