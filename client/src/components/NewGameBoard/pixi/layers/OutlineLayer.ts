import * as PIXI from "pixi.js";
import gsap from "@/lib/gsap";
import type { GameMap, Hex } from "@/types/map-types";
import { MAP_BACKGROUND_COLOR, MAP_SECONDARY_COLOR } from "../engine";
import { useMapStore } from "@/stores/mapStateStore";
import { getAdjacent } from "@/utils/map-utils";
import { hexNumberToHexString } from "@/utils/color-utils";
import { useStore } from "@/stores/sessionStore";
import type { DevelopmentType } from "@color-wars/shared";
export class OutlineLayer extends PIXI.Container {
  private bordersContainer: PIXI.Container;
  private fillsContainer: PIXI.Container;
  private iconsContainer: PIXI.Container;

  // Storage for lookups
  private stateGraphics: Map<string, { border: PIXI.Graphics; fill: PIXI.Graphics }> = new Map();

  // Interaction State
  private activeHoverId: string | null = null;
  private activeSelectId: string | null = null;
  private pulseTweens: Map<string, gsap.core.Tween> = new Map();
  private territoryCenters: Map<string, { x: number; y: number, size: number }> = new Map();
  private buildingIcons: Map<string, PIXI.Sprite> = new Map();
  private unsubscribeStore: (() => void) | null = null;
  private capitalGlows: Map<string, PIXI.Graphics> = new Map();
  private capitalGlowsFill: Map<string, PIXI.Graphics> = new Map();

  constructor() {
    super();
    // Order matters: Fills at bottom, Borders on top
    this.fillsContainer = new PIXI.Container();
    this.fillsContainer.sortableChildren = true;
    this.bordersContainer = new PIXI.Container();
    this.bordersContainer.sortableChildren = true;
    this.iconsContainer = new PIXI.Container();

    this.addChild(this.fillsContainer);
    this.addChild(this.bordersContainer);
    this.addChild(this.iconsContainer);

    this.setupStoreSubscription();
  }

  private setupStoreSubscription() {
    this.unsubscribeStore = (useStore).subscribe(
      (state) => state.state?.game?.territoryOwnership,
      (ownership) => {
        if (ownership) {
          this.updateAllIcons(ownership);
        }
      }
    );
  }

  public destroy(options?: PIXI.DestroyOptions) {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }
    this.removeCapitalGlow();
    super.destroy(options);
  }

  private removeCapitalGlow() {
    this.capitalGlows.forEach((glow) => {
      gsap.killTweensOf(glow);
      glow.destroy();
    });
    this.capitalGlows.clear();
    this.capitalGlowsFill.forEach((glow) => {
      gsap.killTweensOf(glow);
      glow.destroy();
    });
    this.capitalGlowsFill.clear();
  }



  public build(map: GameMap) {
    this.fillsContainer.removeChildren();
    this.bordersContainer.removeChildren();
    this.iconsContainer.removeChildren();
    this.stateGraphics.clear();
    this.territoryCenters.clear();
    this.buildingIcons.clear();
    this.stopAllPulses();
    this.removeCapitalGlow();

    const { hexSize } = map.grid;
    const hexMap = new Map<string, string>();

    // 1. Map Hex -> State
    map.hexes.forEach((h) => {
      if (h.territoryID) hexMap.set(`${h.q},${h.r}`, h.territoryID);
    });

    // 2. Group Hexes by State
    const territories = new Map<string, Hex[]>();
    map.territories.forEach((t) => {
      territories.set(t.id, t.hexes);
    });

    // 3. Color Lookup
    // const colorMap = new Map<string, number>();
    // map.territories.forEach((s) => colorMap.set(s.id, hslStringToHex(s.displayColor)));

    // 4. Geometry Pre-calculation
    const width = hexSize * Math.sqrt(3);

    // Neighbor offsets (odd-r/pointy)
    const neighbors = [
      { q: 1, r: 0 },
      { q: 0, r: 1 },
      { q: -1, r: 1 },
      { q: -1, r: 0 },
      { q: 0, r: -1 },
      { q: 1, r: -1 },
    ];

    // Corner offsets
    const corners: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      corners.push({ x: hexSize * Math.cos(angle), y: hexSize * Math.sin(angle) });
    }

    territories.forEach((hexList, territoryID) => {
      const defaultTerritoryColor = MAP_SECONDARY_COLOR;

      // --- A. Create Outline Graphics ---
      const gBorder = new PIXI.Graphics();
      // --- B. Create Fill Graphics ---
      const gFill = new PIXI.Graphics();

      hexList.forEach((h) => {
        const cx = width * (h.q + h.r / 2);
        const cy = hexSize * 1.5 * h.r;

        // 1. Draw Fill (Simply draw a hex polygon for every cell)
        // We draw it slightly overlapping to prevent hairline cracks
        gFill.poly(corners.map((c) => ({ x: cx + c.x, y: cy + c.y })));

        // 2. Draw Borders (Only on edges)
        neighbors.forEach((offset, i) => {
          const nKey = `${h.q + offset.q},${h.r + offset.r}`;
          const nState = hexMap.get(nKey);

          if (nState !== territoryID) {
            const c1 = corners[i];
            const c2 = corners[(i + 1) % 6];
            gBorder.moveTo(cx + c1.x, cy + c1.y);
            gBorder.lineTo(cx + c2.x, cy + c2.y);
          }
        });
      });

      const { hex, distance } = this.findDeepestHex(hexList);
      const cx = width * (hex.q + hex.r / 2);
      const cy = hexSize * 1.5 * hex.r;

      this.territoryCenters.set(territoryID, { x: cx, y: cy, size: Math.max(distance * width, width * 0.6) });
      const ownership = useStore.getState().state?.game?.territoryOwnership[territoryID]
      const buildingType = ownership?.buildingType || 'BASE'
      
      // console.log('buildingType', buildingType)
      // if(buildingType === 'CAPITAL') {
      //   this.setCapitalPulse(territoryID, true)
      // }
      // const iconPath = this.getIconPath('CITY');
      // if (!iconPath) return;

      // const sprite = PIXI.Sprite.from(iconPath);
      // sprite.anchor.set(0.5);
      // sprite.x = cx;
      // sprite.y = cy;
      // sprite.width = this.buildingIconSize; // Adjust size as needed
      // sprite.height = this.buildingIconSize;

      // this.iconsContainer.addChild(sprite);

      //this.iconsContainer.addChild(new PIXI.Graphics().circle(cx, cy, distance*width).stroke({ color: 0xffffff, alpha: 1.0 }))

      // Finalize Styles

      // Fill Style: Solid color, no stroke
      gFill.fill({ color: 0xffffff, alpha: 1.0 });
      gFill.tint = defaultTerritoryColor
      // Border Style: Thick White
      gBorder.stroke({ width: 2, color: 0xffffff, alpha: 1, join: "round", cap: "round" });
      gBorder.tint = MAP_BACKGROUND_COLOR
      // Store references
      this.stateGraphics.set(territoryID, { border: gBorder, fill: gFill });

      this.fillsContainer.addChild(gFill);
      this.bordersContainer.addChild(gBorder);
      this.updateTerritoryIcon(territoryID, buildingType)
    });

    // Initial State:
    // Fills hidden (assuming we start zoomed in)
    // Borders hidden (until selected)
    this.fillsContainer.visible = true;

    // Actually, borders should probably be visible?
    // Or do you only want borders on hover?
    // Based on prompt: "outline on hover and select". So hide borders by default.
    this.bordersContainer.visible = true;
    this.bordersContainer.children.forEach((c) => (c.visible = true));

    useMapStore.getState().colorMap.forEach((color, territoryId) => {
      this.setTerritoryColor(territoryId, color);
    });
}

private findDeepestHex(hexes: Hex[]) {

  const dirs = [
    [1, 0], [1, -1], [0, -1],
    [-1, 0], [-1, 1], [0, 1],
  ];

  function isBoundary(hex: Hex, set: Set<string>) {
    return dirs.some(([dq, dr]) =>
      !set.has(`${hex.q + dq},${hex.r + dr}`)
    );
  }
  const key = (q: number, r: number) => `${q},${r}`;
  const set = new Set(hexes.map(h => key(h.q, h.r)));

  const dist = new Map<string, number>();
  const queue: Hex[] = [];

  // initialize boundary
  for (const h of hexes) {
    if (isBoundary(h, set)) {
      dist.set(key(h.q, h.r), 0);
      queue.push(h);
    }
  }

  // BFS inward
  while (queue.length) {
    const h = queue.shift()!;
    const d = dist.get(key(h.q, h.r))!;

    for (const [dq, dr] of dirs) {
      const nq = h.q + dq;
      const nr = h.r + dr;
      const nk = key(nq, nr);

      if (!set.has(nk)) continue;
      if (dist.has(nk)) continue;

      dist.set(nk, d + 1);
      queue.push({ q: nq, r: nr, s: 0, territoryID: null });
    }
  }

  // find max
  let best = hexes[0];
  let bestDist = -1;

  for (const h of hexes) {
    const d = dist.get(key(h.q, h.r))!;
    if (d > bestDist) {
      bestDist = d;
      best = h;
    }
  }

  return { hex: best, distance: bestDist };
}

  /**
   * LOD Switcher
   * mode = 'NEAR' -> Show Terrain (handled by Engine), Hide Fills
   * mode = 'FAR'  -> Hide Terrain (handled by Engine), Show Fills
   */
  public setLODMode(mode: "NEAR" | "FAR") {
    // If FAR, we show the solid fills (Political Map Mode)
    this.fillsContainer.visible = mode === "FAR";
  }

  public updateSelection(hoverId: string | null, selectId: string | null) {
    // Reset previous
    if (this.activeHoverId) this.toggleBorder(this.activeHoverId, false);
    if (this.activeSelectId) {
      this.toggleBorder(this.activeSelectId, false);
      this.toggleFill(this.activeSelectId, false);
    }

    // Stop all pulses before applying new selection
    this.stopAllPulses();

    // Set new
    if (hoverId) this.toggleBorder(hoverId, true, 0xffd700); // Gold hover
    if (selectId) {
      //this.toggleFill(selectId, true, 0xffffff); // White select
      this.toggleBorder(selectId, true, 0xffffff); // White select
      // Pulse neighbors
      const currentMap = useMapStore.getState().current_map;
      const neighbors = getAdjacent(selectId, currentMap);
      neighbors.forEach((neighborId) => {
        this.startPulse(neighborId);
      });
    }

    this.activeHoverId = hoverId;
    this.activeSelectId = selectId;
  }

  private startPulse(territoryID: string) {
    const obj = this.stateGraphics.get(territoryID);
    if (!obj) return;

    // Kill any existing pulse for this specific territory just in case
    if (this.pulseTweens.has(territoryID)) {
      this.pulseTweens.get(territoryID)?.kill();
    }
    obj.border.zIndex = 1;
    // Pulse the FILL tint between default and gold
    const tween = gsap.to(obj.border, {
      pixi: { tint: 0xffd700 }, // Gold
      duration: 1.0,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });


    this.pulseTweens.set(territoryID, tween);
  }

  private stopAllPulses() {
    this.pulseTweens.forEach((tween, id) => {
      tween.kill();
      const obj = this.stateGraphics.get(id);
      if (obj) {
        // Restore fill alpha and color
        obj.fill.alpha = 1.0;
        obj.border.zIndex = 0;
        const color = useMapStore.getState().colorMap.get(id);
        if (color) this.setTerritoryColor(id, color);
        else this.setTerritoryColor(id, hexNumberToHexString(MAP_SECONDARY_COLOR));

        // Restore border tint
        obj.border.tint = MAP_BACKGROUND_COLOR;
      }
    });
    this.pulseTweens.clear();
  }

  private toggleBorder(territoryID: string, isVisible: boolean, tint: number = MAP_BACKGROUND_COLOR) {
    const obj = this.stateGraphics.get(territoryID);
    if (!obj) return;

    //obj.border.visible = isVisible;
    if (isVisible) {
      obj.border.tint = tint;
      // Bring to top within its container
      this.bordersContainer.addChild(obj.border);
      obj.border.zIndex = 2;
    } else {
      obj.border.zIndex = 0;
      obj.border.tint = tint;
    }
  }

  private toggleFill(territoryID: string, isVisible: boolean, tint: number = MAP_SECONDARY_COLOR) {
    const obj = this.stateGraphics.get(territoryID);
    if (!obj) return;

    if (isVisible) {
      obj.fill.tint = tint;
      // Bring to top within its container
      this.fillsContainer.addChild(obj.fill);
    } else {
      const color = useMapStore.getState().colorMap.get(territoryID);
      if (color) {
        this.setTerritoryColor(territoryID, color);
      } else {
        obj.fill.tint = tint;
      }
    }
  }

  setTerritoryColor(territoryID: string, color: string) {
    const obj = this.stateGraphics.get(territoryID)
    if (!obj) return;

    obj.fill.tint = color
  }

  public updateAllIcons(ownership: any) {
    const updatedIds = new Set<string>();

    const rawEntries = ownership.entries ? Array.from(ownership.entries()) : Object.entries(ownership);
    const entries = rawEntries as [string, any][];

    entries.forEach(([territoryId, data]) => {
      this.updateTerritoryIcon(territoryId, data.buildingType);
      updatedIds.add(territoryId);
    });

    // Cleanup territories that no longer have buildings or are no longer owned
    this.buildingIcons.forEach((_, territoryId) => {
      if (!updatedIds.has(territoryId)) {
        this.updateTerritoryIcon(territoryId, "BASE");
      }
    });
  }

  public updateTerritoryIcon(territoryId: string, buildingType: DevelopmentType) {
    const center = this.territoryCenters.get(territoryId);
    if (!center) {
      return
    };
    // Remove existing icon
    const existing = this.buildingIcons.get(territoryId);
    if (existing) {
      this.iconsContainer.removeChild(existing);
      this.buildingIcons.delete(territoryId);
    }

    // --- Handle Capital Glow ---
    if(buildingType === "CAPITAL") {
      this.setCapitalPulse(territoryId, true);
    }

    if (buildingType === "BASE" || !buildingType) {
      return;
    }

    const iconPath = this.getIconPath(buildingType);
    if (!iconPath) return;

    const sprite = PIXI.Sprite.from(iconPath);
    sprite.anchor.set(0.5);
    sprite.x = center.x;
    sprite.y = center.y;
    sprite.width = center.size; // Adjust size as needed
    sprite.height = center.size ;
    sprite.tint = 0xFFFFFF;
    
    this.iconsContainer.addChild(sprite);
    this.buildingIcons.set(territoryId, sprite);
  }

  private setCapitalPulse(territoryId: string, active: boolean) {
    const existing = this.capitalGlows.get(territoryId);
    const existingFill = this.capitalGlowsFill.get(territoryId);
    if (!active) {
      if (existing) {
        gsap.killTweensOf(existing);
        this.bordersContainer.removeChild(existing);
        existing.destroy();
        this.capitalGlows.delete(territoryId);
      }
      if (existingFill) {
        gsap.killTweensOf(existingFill);
        this.bordersContainer.removeChild(existingFill);
        existingFill.destroy();
        this.capitalGlowsFill.delete(territoryId);
      }
      return;
    }

    if (existing) return;

    const data = this.stateGraphics.get(territoryId);
    if (!data) return;

    // Create a glow by cloning the border graphics
    const glow_border = data.border.clone();
    const glow_fill = data.fill.clone();
    glow_border.tint = 0xFFD700; // Gold glow
    glow_fill.tint = 0xFFD700; // Gold glow
    //glow_border.blendMode = 'add';
    //glow_fill.blendMode = 'add';
    
    // Apply a blur filter for soft glow aesthetics
    const blur = new PIXI.BlurFilter();
    blur.strength = 2;
    glow_border.filters = [blur];
    glow_fill.filters = [blur];
    glow_fill.alpha = 0.5;
    glow_border.zIndex = 1; // Stay behind the main sharp border
    glow_fill.zIndex = -2; // Stay behind the border glow
    
    this.bordersContainer.addChild(glow_fill); 
    this.bordersContainer.addChild(glow_border); 
    this.capitalGlows.set(territoryId, glow_border);
    this.capitalGlowsFill.set(territoryId, glow_fill);

    // Premium pulse animation
    gsap.fromTo([glow_border, glow_fill], 
      { alpha: 0 },
      {
        alpha: 1,
        duration: 1.0,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      }
    );
  }

  private getIconPath(type: DevelopmentType): string | null {
    switch (type) {
      case "CITY": return "/building-icons/city.png";
      case "FACTORY": return "/building-icons/factory.png";
      case "MISSILE_SILO": return "/building-icons/missile.png";
      case "CAPITAL": return "/building-icons/monument.png";
      // Add other types if they exist in shared/config or economyTypes
      default: return null;
    }
  }

  public async playFinancialConsolidation(collections: { [territoryId: string]: number }): Promise<void> {
    const animPromises: Promise<void>[] = [];

    Object.entries(collections).forEach(([territoryId, amount]) => {
      if (amount === 0) return;

      const center = this.territoryCenters.get(territoryId);
      if (!center) return;

      const isPositive = amount > 0;
      const textStyle = new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 28,
        fontWeight: "bold",
        fill: isPositive ? 0x31d652 : 0xff3333, // Green for positive, red for negative
        stroke: { color: 0x000000, width: 2 }, // Black stroke for readability
      });

      const text = new PIXI.Text({
        text: isPositive ? `+${amount}` : `-${amount}`, 
        style: textStyle
      });
      
      text.anchor.set(0.5);
      text.x = center.x;
      text.y = center.y;
      
      this.iconsContainer.addChild(text);

      const animPromise = new Promise<void>((resolve) => {
        const startY = text.y;
        
        gsap.timeline({
          onComplete: () => {
            text.destroy();
            resolve();
          }
        })
          .fromTo(
            text,
            { y: startY, alpha: 0 },
            { y: startY - 20, alpha: 1, duration: 0.4 }
          )
          .to(text, { duration: 1.2 }) // Wait 1 second
          .to(text, {
            y: startY - 40,
            alpha: 0,
            duration: 0.4,
            ease: "power1.out"
          });
      });

      animPromises.push(animPromise);
    });

    await Promise.all(animPromises);
  }
}

