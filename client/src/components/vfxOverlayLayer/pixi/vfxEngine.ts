import * as PIXI from "pixi.js";
import { pixiTargetLocator } from "@/animation/target-locator";
import { Assets, Sprite } from "pixi.js";
import gsap from "@/lib/gsap";

function clipInput(k: number, arr: number[]) {
  if (k < 0) k = 0;
  if (k > arr.length - 1) k = arr.length - 1;
  return arr[k];
}

function getTangent(k: number, factor: number, array: number[]) {
  return (factor * (clipInput(k + 1, array) - clipInput(k - 1, array))) / 2;
}

function cubicInterpolation(array: number[], t: number, tangentFactor = 1) {
  const k = Math.floor(t);
  const m = [getTangent(k, tangentFactor, array), getTangent(k + 1, tangentFactor, array)];
  const p = [clipInput(k, array), clipInput(k + 1, array)];
  t -= k;
  const t2 = t * t;
  const t3 = t * t2;
  return (2 * t3 - 3 * t2 + 1) * p[0] + (t3 - 2 * t2 + t) * m[0] + (-2 * t3 + 3 * t2) * p[1] + (t3 - t2) * m[1];
}

export class PIXIVFXLayer {
  private app: PIXI.Application | null = null;

  // Layers
  private vfxLayer: PIXI.Container | null = null;

  // Lifecycle
  private destroyed = false;
  private initToken = 0;
  private initPromise: Promise<void> | null = null;

  private async loadAssets() {}

  // Getters
  getApp() {
    return this.app;
  }

  /* ============================
     =========== INIT ===========
     ============================ */

  async init(root: HTMLDivElement) {
    const myToken = ++this.initToken;
    this.destroyed = false;

    // Cleanup existing canvas
    root.querySelectorAll("canvas").forEach((c) => c.remove());

    this.initPromise = (async () => {
      const localApp = new PIXI.Application();

      await localApp.init({
        resizeTo: root,
        backgroundColor: 0x000000,
        backgroundAlpha: 0.1,
        antialias: true,
        powerPreference: "high-performance",
        resolution: Math.min(window.devicePixelRatio, 4),
        autoDensity: true,
      });
      await this.loadAssets();

      if (this.destroyed || myToken !== this.initToken) {
        try {
          console.log("PixiEngine init aborted, cleaning up");
          localApp.destroy(true);
        } catch (error) {
          console.error(error);
        }
        return;
      }

      this.app = localApp;
      root.appendChild(this.app.canvas);

      // --- Layer Setup ---
      this.vfxLayer = new PIXI.Container();
      this.app.stage.addChild(this.vfxLayer);

      window.addEventListener("resize", this.handleResize);

      this.handleResize();

      pixiTargetLocator.register("vfx-engine", this);
    })();

    return this.initPromise;
  }

  animateCoinConfettiOverlay(boardSprite: PIXI.Sprite, targetEl: HTMLElement, boardApp: PIXI.Application, overlayApp: PIXI.Application, count = 12) {
    const coins: PIXI.Graphics[] = [];
    const meta: { x: number; y: number }[] = [];

    // ─────────────────────────────
    // 1️⃣ START POSITION (Board → Screen → Overlay)
    // ─────────────────────────────
    const global = boardSprite.getGlobalPosition();

    const boardRect = boardApp.canvas.getBoundingClientRect();
    const overlayRect = overlayApp.canvas.getBoundingClientRect();

    const startX = boardRect.left + global.x - overlayRect.left;
    const startY = boardRect.top + global.y - overlayRect.top;

    // ─────────────────────────────
    // 2️⃣ END POSITION (DOM → Overlay)
    // ─────────────────────────────
    const rect = targetEl.getBoundingClientRect();

    const endX = rect.left - overlayRect.left + rect.width / 2;
    const endY = rect.top - overlayRect.top + rect.height / 2;

    // ─────────────────────────────
    // 3️⃣ CREATE COINS IN OVERLAY PIXI
    // ─────────────────────────────
    const coinSize = boardSprite.width / 4;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * coinSize * 3;

      const coin = new PIXI.Graphics()
        .circle(0, 0, coinSize / 2)
        .fill(0x31d652)
        .stroke({ width: 2, color: 0x262626 });

      coin.x = startX;
      coin.y = startY;
      coin.alpha = 1;

      this.vfxLayer?.addChild(coin);
      coins.push(coin);

      meta.push({
        x: startX + Math.cos(angle) * radius,
        y: startY + Math.sin(angle) * radius,
      });
    }

    // ─────────────────────────────
    // 4️⃣ GSAP TIMELINE
    // ─────────────────────────────
    return gsap
      .timeline({
        onComplete: () => {
          // Clean up aggressively
          coins.forEach((c) => c.destroy());
        },
      })
      .to(coins, {
        x: (i) => meta[i].x,
        y: (i) => meta[i].y,
        stagger: 0.002,
        duration: 0.4,
        ease: "power2.out",
      })
      .to(coins, {
        x: endX,
        y: endY,
        alpha: 0,
        duration: 0.2,
        ease: "power2.in",
        stagger: 0.005,
      });
  }

  createTrailTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 16;

    const ctx = canvas.getContext("2d")!;

    // Horizontal fade over length
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 16);

    // Vertical fade for soft edges
    const gradientV = ctx.createLinearGradient(0, 0, 0, 16);
    gradientV.addColorStop(0, "rgba(255,255,255,0)");
    gradientV.addColorStop(0.5, "rgba(255,255,255,1)");
    gradientV.addColorStop(1, "rgba(255,255,255,0)");

    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = gradientV;
    ctx.fillRect(0, 0, 256, 16);

    return PIXI.Texture.from(canvas);
  }

  animateCoinWithTrail(startX: number, startY: number, endX: number, endY: number, app: PIXI.Application, layer: PIXI.Container) {
    // ── Coin ───────────────────────────────
    const coin = new PIXI.Graphics().circle(0, 0, 8).fill(0x31d652);

    coin.position.set(startX, startY);
    layer.addChild(coin);

    // ── Trail ──────────────────────────────
    const texture = this.createTrailTexture();

    const historySize = 20;
    const ropeSize = 100;
    const historyX: number[] = [];
    const historyY: number[] = [];
    const points: PIXI.Point[] = [];

    for (let i = 0; i < historySize; i++) {
      historyX.push(startX);
      historyY.push(startY);
    }

    for (let i = 0; i < ropeSize; i++) {
      points.push(new PIXI.Point(startX, startY));
    }

    const rope = new PIXI.MeshRope({
      texture,
      points,
    });

    rope.blendMode = "add";
    rope.tint = 0x31d652;

    layer.addChild(rope);

    const tick = () => {
      historyX.pop();
      historyX.unshift(coin.x);
      historyY.pop();
      historyY.unshift(coin.y);

      for (let i = 0; i < ropeSize; i++) {
        const p = points[i];

        const ix = cubicInterpolation(historyX, (i / ropeSize) * historySize);
        const iy = cubicInterpolation(historyY, (i / ropeSize) * historySize);

        p.x = ix;
        p.y = iy;
      }
    };

    app.ticker.add(tick);

    // ── Motion ─────────────────────────────
    gsap.to(coin, {
      x: endX,
      y: endY,
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.to([coin, rope], {
          alpha: 0,
          duration: 0.2,
          onComplete: () => {
            app.ticker.remove(tick);
            rope.destroy();
            coin.destroy();
          },
        });
      },
    });
  }

  playEnergyTransferAnimation(startEl: HTMLElement, endEl: HTMLElement) {
    const count = 4;
    const particles: PIXI.Graphics[] = [];
    const meta: { x: number; y: number }[] = [];

    // ─────────────────────────────
    // 1️⃣ COORDINATE MAPPING
    // ─────────────────────────────
    const overlayRect = this.app!.canvas.getBoundingClientRect();
    // const startRect = startEl.getBoundingClientRect();
    // const endRect = endEl.getBoundingClientRect();

    const startRect = pixiTargetLocator.get<Sprite>("track-tile-0")!.getGlobalPosition();
    const endRect = pixiTargetLocator.get<Sprite>("track-tile-17")!.getGlobalPosition();
    const gameBoard = pixiTargetLocator.get("game-board-engine") as PIXIVFXLayer;
    const boardRect = gameBoard.getApp()!.canvas.getBoundingClientRect();

    const startX = boardRect.left + startRect.x - overlayRect.left;
    const startY = boardRect.top + startRect.y - overlayRect.top;

    /* const startX = startRect.left + startRect.width / 2 - overlayRect.left;
        const startY = startRect.top + startRect.height / 2 - overlayRect.top; */

    const endX = boardRect.left + endRect.x - overlayRect.left;
    const endY = boardRect.top + endRect.y - overlayRect.top;

    this.animateCoinWithTrail(startX, startY, endX, endY, this.app!, this.app!.stage);
  }

  /* ============================
     ========= RESIZE ===========
     ============================ */

  private handleResize = () => {
    if (!this.app) return;
    const parent = this.app.canvas.parentElement;
    if (!parent) return;

    const w = parent.clientWidth;
    const h = parent.clientHeight;
    this.app.renderer.resize(w, h);
  };

  /* ============================
     ========= DESTROY ==========
     ============================ */

  destroy() {
    this.destroyed = true;
    this.initToken++;

    window.removeEventListener("resize", this.handleResize);

    this.app?.destroy(true, true);

    pixiTargetLocator.clear();
    pixiTargetLocator.unregister("vfx-engine");

    this.app = null;
  }
}
