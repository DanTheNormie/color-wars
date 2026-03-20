import { animateCoinConfetti, animateUnitHop } from "@/animation/registry/anim";
import { BaseAction } from "./core";
import { ActionHandle } from "@/animation/driver/AnimationHandle";
import { pixiTargetLocator } from "@/animation/target-locator";
import { PlayerSprite } from "@/components/NewGameBoard/pixi/units/playerSprite";
import { Sprite } from "pixi.js";
import { TRACK_COORDINATES } from "@/components/NewGameBoard/config/dice-track-config";
import { useDiceTrackStore } from "@/stores/diceTrackStore";
import { useStore } from "@/stores/sessionStore";
import { PIXIGameBoard } from "@/components/NewGameBoard/pixi/engine";
import { useCardStore } from "@/stores/cardSelectionStore";
import { useMapStore } from "@/stores/mapStateStore";
import type { PIXIVFXLayer } from "@/components/vfxOverlayLayer/pixi/vfxEngine";
import { DiceTrackLayer } from "@/components/NewGameBoard/pixi/layers/DiceTrackLayer";
import { TokenLayer } from "@/components/NewGameBoard/pixi/layers/TokenLayer";
import { buildTrackShiftAnimation } from "../animation/registry/anim";
import gsap from "@/lib/gsap";

export class HexHop extends BaseAction<"MOVE_PLAYER"> {
  execute(): ActionHandle {
    const { fromTile, toTile, tokenId } = this.payload;
    const unit = pixiTargetLocator.get<PlayerSprite>(tokenId);
    if (!unit) throw Error("unit is not valid");

    const pathSprites: Sprite[] = [];
    const totalTiles = TRACK_COORDINATES.length;

    // 1. Calculate the number of clockwise steps needed
    // If to >= from: Simple difference (e.g., 5 to 10 = 5 steps)
    // If to < from: Wrap around difference (e.g., 30 to 2 with size 34 = 4 + 2 = 6 steps)
    const stepCount = toTile >= fromTile ? toTile - fromTile : totalTiles - fromTile + toTile;

    // 2. Build the path using modulo (%) to handle the array wrap

    for (let i = 0; i <= stepCount; i++) {
      // This ensures that when we hit index 34, it wraps back to 0
      const currentIndex = (fromTile + i) % totalTiles;

      const id = `track-tile-${currentIndex}`;
      const tile = pixiTargetLocator.get<Sprite>(id);

      if (tile) {
        pathSprites.push(tile);
      } else {
        console.warn(`Tile sprite missing for index ${currentIndex} (ID: ${id})`);
      }
    }

    unit.isAnimating = true;
    useDiceTrackStore.getState().setActiveToken(null);
    const newHopAction = animateUnitHop(unit, pathSprites);

    const actionHandle = ActionHandle.attachCallBack(newHopAction, async () => {
      const finalTileId = pathSprites.at(pathSprites.length - 1)!.label;
      unit.currentTileId = finalTileId;
      unit.isAnimating = false;
      useDiceTrackStore.getState().upsertToken({ id: unit.id, tileId: finalTileId });
      useDiceTrackStore.getState().setActiveToken(unit.id);
      this.logAction(useStore.getState().state.game.activePlayerId);
    });
    return actionHandle;
  }
}

export class RollDice extends BaseAction<"ROLL_DICE"> {
  execute(): ActionHandle {
    const { die1, die2 } = this.payload;
    useStore.getState().rollDiceTo(die1, die2);
    return new ActionHandle(
      new Promise<void>((resolve) => {
        setTimeout(() => {
          this.logAction(useStore.getState().state.game.activePlayerId);
          resolve()
        }, 2500)
      }),
      () => { },
      () => { },
    );
  }
}

export class UpdateActivePlayer extends BaseAction<"UPDATE_ACTIVE_PLAYER"> {
  execute(): ActionHandle {
    const { playerId } = this.payload;
    return new ActionHandle(
      new Promise<void>((resolve) => {
        useStore.getState().setActionState('idle')
        useDiceTrackStore.getState().setActiveToken(playerId)
        useStore.getState().setActivePlayer(playerId)
        resolve();
      }),
      () => { },
      () => { },
    );
  }
}

export class IncrMoney extends BaseAction<"INCR_MONEY"> {
  execute(): ActionHandle {
    const { playerId, amount } = this.payload;

    const unit = pixiTargetLocator.get<PlayerSprite>(playerId);
    if (!unit) throw new Error("PlayerSprite unit not found for IncrMoney animation");

    const tileID = unit.currentTileId;
    if (!tileID) throw new Error("PlayerSprite has no currentTileId for IncrMoney animation");
    const tile = pixiTargetLocator.get<Sprite>(tileID)!;

    const ele = document.getElementById(`player-backpack-money-${playerId}`);
    if (!ele) throw new Error("Target DOM element for money transfer not found");



    const vfxLayer = pixiTargetLocator.get("vfx-engine") as PIXIVFXLayer;
    const gameBoard = pixiTargetLocator.get("game-board-engine") as PIXIVFXLayer;
    if (!vfxLayer) throw new Error("PixiEngine not found in target locator");
    const vfxApp = vfxLayer.getApp()!;
    const boardApp = gameBoard.getApp()!;
    if (!vfxApp) throw new Error("Pixi Application not found in engine");

    // const anim = animateCoinConfettiToDom(tile!, ele, app, 50);
    //const anim  = vfxLayer.animateCoinConfettiOverlay(tile, ele, boardApp, vfxApp, 10)
    const anim2 = vfxLayer.animateSpritesheetConfettiOverlay(tile, ele, boardApp, vfxApp, 10)

    this.logAction(playerId);

    return ActionHandle.attachCallBack(anim2, async () => {
      useStore.getState().updatePlayerBackpackMoney(playerId, useStore.getState().state.game.players[playerId].backpack.money + amount);
      console.log("IncrMoney animation complete");
    });
  }
}

export class DecrMoney extends BaseAction<"DECR_MONEY"> {
  execute(): ActionHandle {
    const { playerId, amount } = this.payload;

    const unit = pixiTargetLocator.get<PlayerSprite>(playerId);
    if (!unit) throw new Error("PlayerSprite unit not found for DecrMoney animation");
    const tileID = unit.currentTileId;
    if (!tileID) throw new Error("PlayerSprite has no currentTileId for DecrMoney animation");
    const tile = pixiTargetLocator.get<Sprite>(tileID);
    const engine = pixiTargetLocator.get("game-board-engine") as PIXIGameBoard;
    if (!engine) throw new Error("PixiEngine not found in target locator");

    const app = engine.getApp()!;
    if (!app) throw new Error("Pixi Application not found in engine");

    const anim = animateCoinConfetti(tile!, app, 50);

    this.logAction(playerId);

    return ActionHandle.attachCallBack(anim, async () => {
      useStore.getState().updatePlayerBackpackMoney(playerId, useStore.getState().state.game.players[playerId].backpack.money - amount);
      console.log("IncrMoney animation complete");
    });
  }
}

export class AddCard extends BaseAction<"ADD_CARD"> {
  execute(): ActionHandle {
    const { playerId, cardId } = this.payload;

    const unit = pixiTargetLocator.get<PlayerSprite>(playerId);
    if (!unit) throw new Error("PlayerSprite unit not found for AddCard animation");

    const tileID = unit.currentTileId;
    if (!tileID) throw new Error("PlayerSprite has no currentTileId for AddCard animation");
    const tile = pixiTargetLocator.get<Sprite>(tileID)!;

    const ele = document.getElementById(`player-backpack-cards-${playerId}`);
    if (!ele) throw new Error("Target DOM element for card counter not found");

    const vfxLayer = pixiTargetLocator.get("vfx-engine") as PIXIVFXLayer;
    const gameBoard = pixiTargetLocator.get("game-board-engine") as PIXIVFXLayer;
    if (!vfxLayer) throw new Error("PixiEngine not found in target locator");
    const vfxApp = vfxLayer.getApp()!;
    const boardApp = gameBoard.getApp()!;
    if (!vfxApp) throw new Error("Pixi Application not found in engine");

    // 1 "card" particle flying to the backpack counter
    const anim = vfxLayer.animateCoinConfettiOverlay(tile, ele, boardApp, vfxApp, 4);

    this.logAction(playerId);

    return ActionHandle.attachCallBack(anim, async () => {
      useStore.getState().addBackpackCard(playerId, cardId);
      console.log("AddCard animation complete – card added to backpack:", cardId);
    });
  }
}

// --- Action 1: Draw Cards ---
export class DrawCardsAction extends BaseAction<"DRAW_3_REWARD_CARDS"> {
  execute(): ActionHandle {
    this.logAction(this.payload.playerId);
    // Wrap the store interaction and waiting logic in a Promise
    const drawAnimationTask = new Promise<void>((resolve) => {
      // 1. Trigger the UI to mount and start animating
      useCardStore.getState().setupDraw(this.payload.cardIds);

      // 2. Wait for the entrance animation to complete (phase becomes 'interacting')
      const unsubscribe = useCardStore.subscribe(
        (state) => state.phase,
        (phase) => {
          if (phase === "interacting") {
            unsubscribe();
            resolve();
          }
        },
      );
    });

    // Return the ActionHandle with empty cancel/fast-forward callbacks for now
    return new ActionHandle(
      drawAnimationTask,
      () => { },
      () => { },
    );
  }
}

// --- Action 2: Resolve Selection ---
export class ResolveSelectionAction extends BaseAction<"SELECT_CARD"> {
  execute(): ActionHandle {
    const { selectedCardId } = this.payload;
    this.logAction(useStore.getState().state.game.activePlayerId);

    const resolveAnimationTask = new Promise<void>((resolve) => {
      // 1. Trigger the UI to start the exit/resolution animation
      useCardStore.getState().resolveSelection(selectedCardId);

      // 2. Wait for the exit animation to complete and cleanup (phase becomes 'idle')
      const unsubscribe = useCardStore.subscribe(
        (state) => state.phase,
        (phase) => {
          if (phase === "idle") {
            unsubscribe();
            console.log("Card exit animation complete");
            resolve();
          }
        },
      );
    });

    return new ActionHandle(
      resolveAnimationTask,
      () => { },
      () => { },
    );
  }
}

export class BuyTerritoryAction extends BaseAction<"BUY_TERRITORY"> {
  execute(): ActionHandle {
    const { playerId, territoryID, amount } = this.payload;
    this.logAction(playerId);

    const playerColor = useStore.getState().state.game.players[playerId].color;

    useMapStore.getState().setTerritoryColor(territoryID, playerColor);
    useStore.getState().updatePlayerMoney(playerId, useStore.getState().state.game.players[playerId].money - amount);
    useStore.getState().updateTerritoryOwnership(territoryID, playerId);

    return new ActionHandle(
      new Promise<void>((resolve) => resolve()),
      () => { },
      () => { },
    );
  }
}

export class SellTerritoryAction extends BaseAction<"SELL_TERRITORY"> {
  execute(): ActionHandle {
    const { playerId, territoryID, amount } = this.payload;
    this.logAction(playerId);

    useMapStore.getState().removeTerritoryColor(territoryID);
    useStore.getState().updatePlayerMoney(playerId, useStore.getState().state.game.players[playerId].money + amount);
    useStore.getState().updateTerritoryOwnership(territoryID, null);

    return new ActionHandle(
      new Promise<void>((resolve) => resolve()),
      () => { },
      () => { },
    );
  }
}

export class ShiftTrackAction extends BaseAction<"SHIFT_TRACK"> {
  execute(): ActionHandle {
    const { newTiles, shiftDirection, diceTrack } = this.payload;
    const trackLayer = pixiTargetLocator.get<DiceTrackLayer>("diceTrackLayer");
    const tokenLayer = pixiTargetLocator.get<TokenLayer>("tokenLayer");
    const engine = pixiTargetLocator.get("game-board-engine") as any;

    if (!trackLayer || !tokenLayer || !engine) throw new Error("Missing dependencies for SHIFT_TRACK");
    const app = engine.getApp();

    this.logAction("");
    //TODO: find out side effects of upsertToken
    return new ActionHandle(
      (async () => {
        const tl = buildTrackShiftAnimation(trackLayer, tokenLayer, newTiles, shiftDirection, app);
        await tl.play();
        const count = newTiles.length;
        useStore.getState().setDiceTrack(diceTrack);
        Object.values(useDiceTrackStore.getState().tokens).forEach((token) => {
          const tileId = token.tileId;
          if (tileId && tileId.startsWith("track-tile-")) {
            const idx = parseInt(tileId.split("-")[2]);
            if (idx >= 1) {
              const numTiles = trackLayer.getTrackSprites().length;
              let targetIdx = idx;
              if (shiftDirection === 'forward') {
                targetIdx = Math.max(0, idx - count);
              } else {
                const newPosition = idx + count;
                if(newPosition > numTiles - 1){
                  targetIdx = 0;
                } else {
                  targetIdx = newPosition;
                }
              }
              const targetTileId = `track-tile-${targetIdx}`;
              useDiceTrackStore.getState().upsertToken({
                id: token.id,
                tileId: targetTileId,
              });
            }
          }
        });
      })(),
      () => {},
      () => {}
    );
  }
}

export class BankBackpackItemsAction extends BaseAction<"BANK_BACKPACK_ITEMS"> {
  execute(): ActionHandle {
    const { playerId, money, cards } = this.payload;

    if (money === 0 && cards.length === 0) {
      return new ActionHandle(Promise.resolve(), () => {}, () => {});
    }

    // 1. Update backpack state to empty (optimistic frontend update)


    const backpackMoneyEle = document.getElementById(`player-backpack-money-${playerId}`);
    const safeMoneyEle = document.getElementById(`player-money-${playerId}`);
    const backpackCardsEle = document.getElementById(`player-backpack-cards-${playerId}`);
    const safeCardsEle = document.getElementById(`player-cards-${playerId}`);

    const vfxLayer = pixiTargetLocator.get("vfx-engine") as PIXIVFXLayer;
    const gameBoard = pixiTargetLocator.get("game-board-engine") as PIXIVFXLayer;

    if (!vfxLayer || !gameBoard) {
       throw new Error ('Missing pixi engine')
    }

    const vfxApp = vfxLayer.getApp()!;
    const boardApp = gameBoard.getApp()!;
    const master = gsap.timeline({ paused: true });
    const promise = new Promise<void>((resolve) => {

      if (money > 0 && backpackMoneyEle && safeMoneyEle) {
        useStore.getState().updatePlayerBackpackMoney(playerId, 0);
        const tl = vfxLayer.animateCoinConfettiOverlay(backpackMoneyEle, safeMoneyEle, boardApp, vfxApp, 1);
        tl.eventCallback("onComplete", () => {
          useStore.getState().updatePlayerMoney(playerId, useStore.getState().state.game.players[playerId].money + money);
        });
        master.add(tl);
      }

      if (cards.length > 0 && backpackCardsEle && safeCardsEle) {
        useStore.getState().clearPlayerBackpackCards(playerId);
        const tl = vfxLayer.animateCoinConfettiOverlay(backpackCardsEle, safeCardsEle, boardApp, vfxApp, 1);
        tl.eventCallback("onComplete", () => {
          useStore.getState().addPlayerCards(playerId, cards);
        });
        master.add(tl);
      }

      master.eventCallback("onComplete", () => {
        resolve();
      });
      master.play();
    });

    this.logAction(playerId);
    return new ActionHandle(promise, () => { }, () => { });
  }
}

export class UpdateFinancialStatusAction extends BaseAction<"UPDATE_FINANCIAL_STATUS"> {
  execute(): ActionHandle {
    const { playerId, financialStatus } = this.payload;
    useStore.getState().updatePlayerFinancialStatus(playerId, financialStatus);
    return new ActionHandle(Promise.resolve(), () => { }, () => { });
  }
}

export class PayOffDebtAction extends BaseAction<"PAY_OFF_DEBT"> {
  execute(): ActionHandle {
    const { playerId, amount } = this.payload;
    useStore.getState().updatePlayerMoney(playerId, useStore.getState().state.game.players[playerId].money + amount);
    useStore.getState().updatePlayerBackpackMoney(playerId, 0);
    this.logAction(playerId);
    return new ActionHandle(Promise.resolve(), () => { }, () => { });
  }
}
