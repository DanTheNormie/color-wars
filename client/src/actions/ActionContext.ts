import { PIXIGameBoard } from "@/components/NewGameBoard/pixi/engine";
import { pixiTargetLocator } from "@/animation/target-locator";

export interface ActionContext {
  locator: typeof pixiTargetLocator;

  pixiEngine?: PIXIGameBoard;
}

export function requireEngine(ctx: ActionContext): PIXIGameBoard {
  if (!ctx.pixiEngine) {
    throw new Error("Action failed: PixiEngine is required but not found in context.");
  }
  return ctx.pixiEngine;
}
