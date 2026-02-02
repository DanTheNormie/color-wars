import * as PIXI from "pixi.js";
import { pixiTargetLocator } from "@/animation/target-locator";
import { Assets, Sprite } from "pixi.js";
import gsap from "@/lib/gsap";

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
