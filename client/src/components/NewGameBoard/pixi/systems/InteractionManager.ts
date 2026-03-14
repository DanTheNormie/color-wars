import { PIXIGameBoard } from "../engine";
import { useMapStore } from "@/stores/mapStateStore";
import { useTooltipStore } from "@/stores/tooltipStore";
import type { Hex } from "@/types/map-types";
import { FederatedPointerEvent } from "pixi.js";

export class InteractionManager {
  private engine: PIXIGameBoard;
  private hexLookup = new Map<string, string>();
  private hexSize = 0;
  private isDragging = false;

  constructor(engine: PIXIGameBoard) {
    this.engine = engine;

    const viewport = engine.getViewport();
    if (viewport) {
      viewport.on("pointertap", this.onPointerTap);

      // Prevent click triggers while panning
      viewport.on("drag-start", () => {
        this.isDragging = true;
      });
      viewport.on("drag-end", () => {
        setTimeout(() => (this.isDragging = false), 0);
      });
    }
  }

  public initMap(hexes: Hex[], size: number) {
    this.hexSize = size;
    this.hexLookup.clear();
    hexes.forEach((h) => {
      if (h.territoryID) this.hexLookup.set(`${h.q},${h.r}`, h.territoryID);
    });
  }

  private onPointerTap = (e: FederatedPointerEvent) => {
    if (this.isDragging) return;

    const terrain = this.engine.getTerrain();
    if (!terrain) return;
    const localPoint = terrain.toLocal(e.global);
    const hex = this.engine.worldToAxial(localPoint.x, localPoint.y, this.hexSize);
    const territoryID = this.hexLookup.get(`${hex.q},${hex.r}`) || null;

    useMapStore.getState().setSelectedTerritory(territoryID);

    if (territoryID) {
      // Convert canvas-relative coords to viewport-relative coords
      const canvas = this.engine.getApp()?.canvas;
      const rect = canvas?.getBoundingClientRect();
      const screenX = e.global.x + (rect?.left ?? 0);
      const screenY = e.global.y + (rect?.top ?? 0);
      useTooltipStore.getState().openTooltip(screenX, screenY, territoryID);
    } else {
      useTooltipStore.getState().closeTooltip();
    }
  };

  public destroy() {
    const viewport = this.engine.getViewport();
    if (viewport) {
      viewport.off("pointertap", this.onPointerTap);
    }
  }
}
