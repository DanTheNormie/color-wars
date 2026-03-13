import * as PIXI from "pixi.js";
import { pixiTargetLocator } from "@/animation/target-locator";
import { Sprite } from "pixi.js";
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

  private async loadAssets() { }

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

  animateCoinConfettiOverlay(boardSprite: PIXI.Sprite, targetEl: HTMLElement, boardApp: PIXI.Application, overlayApp: PIXI.Application, count = 5) {
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

    const coinSize = boardSprite.width / 4;

    return this.playConfettiAnimation(
      startX,
      startY,
      endX,
      endY,
      overlayApp,
      this.vfxLayer!,
      count,
      coinSize * 10,
      () =>
        new PIXI.Graphics()
          .circle(0, 0, coinSize / 2)
          .fill(0x31d652)
          .stroke({ width: 2, color: 0x262626 }),
      0x31d652
    );
  }

  playEnergyTransferAnimation(_startEl: HTMLElement, _endEl: HTMLElement) {
    // ─────────────────────────────
    // 1️⃣ COORDINATE MAPPING
    // ─────────────────────────────
    const overlayRect = this.app!.canvas.getBoundingClientRect();

    const startRect = pixiTargetLocator.get<Sprite>("track-tile-0")!.getGlobalPosition();
    const endRect = pixiTargetLocator.get<Sprite>("track-tile-17")!.getGlobalPosition();
    const gameBoard = pixiTargetLocator.get("game-board-engine") as PIXIVFXLayer;
    const boardRect = gameBoard.getApp()!.canvas.getBoundingClientRect();

    const startX = boardRect.left + startRect.x - overlayRect.left;
    const startY = boardRect.top + startRect.y - overlayRect.top;

    const endX = boardRect.left + endRect.x - overlayRect.left;
    const endY = boardRect.top + endRect.y - overlayRect.top;

    return this.playConfettiAnimation(
      startX,
      startY,
      endX,
      endY,
      this.app!,
      this.vfxLayer!,
      1,
      50,
      () => new PIXI.Graphics().circle(0, 0, 8).fill(0x31d652),
      0x31d652
    );
  }

  createProjectileWithTrail(
    x: number,
    y: number,
    app: PIXI.Application,
    layer: PIXI.Container,
    createGraphic: () => PIXI.Container,
    trailTint: number = 0xffffff
  ) {
    const graphic = createGraphic();
    graphic.position.set(x, y);
    layer.addChild(graphic);

    const texture = this.createTrailTexture();
    const historySize = 20;
    const ropeSize = 100;
    const historyX: number[] = Array.from({ length: historySize }, () => x);
    const historyY: number[] = Array.from({ length: historySize }, () => y);
    const points: PIXI.Point[] = Array.from({ length: ropeSize }, () => new PIXI.Point(x, y));

    const rope = new PIXI.MeshRope({
      texture,
      points,
    });

    rope.blendMode = "normal";
    rope.tint = trailTint;
    layer.addChild(rope);

    const tick = () => {
      historyX.pop();
      historyX.unshift(graphic.x);
      historyY.pop();
      historyY.unshift(graphic.y);

      for (let i = 0; i < ropeSize; i++) {
        const p = points[i];
        const t = (i / ropeSize) * historySize;
        const ix = cubicInterpolation(historyX, t);
        const iy = cubicInterpolation(historyY, t);

        p.x = ix;
        p.y = iy;
      }
    };

    app.ticker.add(tick);

    return {
      graphic,
      rope,
      destroy: () => {
        app.ticker.remove(tick);
        rope.destroy();
        graphic.destroy();
      },
    };
  }

  playConfettiAnimation(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    app: PIXI.Application,
    layer: PIXI.Container,
    count: number,
    splashRadius: number,
    createGraphic: () => PIXI.Container,
    trailTint: number = 0xffffff
  ) {
    const projectiles: { graphic: PIXI.Container; rope: PIXI.MeshRope; destroy: () => void }[] = [];
    const meta: { x: number; y: number }[] = [];
    const graphics: PIXI.Container[] = [];
    const ropes: PIXI.MeshRope[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * splashRadius;

      const proj = this.createProjectileWithTrail(startX, startY, app, layer, createGraphic, trailTint);
      proj.graphic.alpha = 1;

      projectiles.push(proj);
      graphics.push(proj.graphic);
      ropes.push(proj.rope);

      meta.push({
        x: startX + Math.cos(angle) * radius,
        y: startY + Math.sin(angle) * radius,
      });
    }

    const proxies = graphics.map((_, i) => ({ t: 0, index: i }));

    return gsap
      .timeline({
        onUpdate: () => {
          proxies.forEach((proxy) => {
            const i = proxy.index;
            const t = proxy.t;
            const invT = 1 - t;
            const cp = meta[i];

            // Calculate cubic bezier control points so the curve passes exactly through cp at t=0.5
            const c1x = cp.x + (cp.x - startX) / 3;
            const c1y = cp.y + (cp.y - startY) / 3;

            const c2x = cp.x + (cp.x - endX) / 3;
            const c2y = cp.y + (cp.y - endY) / 3;

            graphics[i].x =
              invT * invT * invT * startX +
              3 * invT * invT * t * c1x +
              3 * invT * t * t * c2x +
              t * t * t * endX;

            graphics[i].y =
              invT * invT * invT * startY +
              3 * invT * invT * t * c1y +
              3 * invT * t * t * c2y +
              t * t * t * endY;
          });
        },
        onComplete: () => {
          projectiles.forEach((p) => p.destroy());
        },
      })
      .to(proxies, {
        t: 1,
        duration: 0.8,
        ease: "power2.inOut",
        stagger: 0.015,
      })
      .to(
        [...graphics, ...ropes],
        {
          alpha: 0,
          duration: 0.2,
          ease: "power2.in",
        },
        "-=0.2"
      );
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
