import * as PIXI from "pixi.js";
import gsap from "@/lib/gsap";
import { PlayerSprite } from "../units/playerSprite";

export class GameOverLayer extends PIXI.Container {
  private overlay: PIXI.Graphics;
  private winnerContainer: PIXI.Container;
  private fireworksContainer: PIXI.Container;
  private app: PIXI.Application | null = null;
  private isShowing = false;

  constructor() {
    super();
    this.visible = false;
    this.zIndex = 1000; // Above everything

    // 1. Background Dimmer
    this.overlay = new PIXI.Graphics();
    this.addChild(this.overlay);

    // 2. Fireworks behind the winner
    this.fireworksContainer = new PIXI.Container();
    this.addChild(this.fireworksContainer);

    // 3. Winner holder
    this.winnerContainer = new PIXI.Container();
    this.addChild(this.winnerContainer);
  }

  public init(app: PIXI.Application) {
    this.app = app;
  }

  public resize(width: number, height: number) {
    this.overlay.clear().rect(0, 0, width, height).fill({ color: 0x000000, alpha: 0.6 });
    if (this.isShowing) {
      this.winnerContainer.position.set(0, 0); // Container is full screen
    }
  }

  public async show(_winnerId: string, winnerSprite: PlayerSprite): Promise<void> {
    if (this.isShowing) return;
    this.isShowing = true;
    this.visible = true;

    const { width, height } = this.app!.screen;
    this.resize(width, height);

    // Stop any existing animations on the winner
    winnerSprite.stopPulse();
    
    // Get global position before re-parenting
    const globalPos = winnerSprite.getGlobalPosition();
    
    // Move winner to our layer
    this.winnerContainer.addChild(winnerSprite);
    winnerSprite.position.set(globalPos.x, globalPos.y);

    // Animate to center and enlarge
    const tl = gsap.timeline();
    
    // Background fade in
    this.overlay.alpha = 0;
    tl.to(this.overlay, { alpha: 1, duration: 0.5 }, 0);

    // Winner movement
    tl.to(winnerSprite, {
      x: width / 2,
      y: height / 2,
      pixi: { 
        scale: 4,
        rotation: 0 
      },
      duration: 2,
      ease: "power3.inOut"
    }, 0);

    // Start fireworks staggering after a bit
    tl.call(() => this.startFireworksLoop(), [], 0.5);

    return new Promise((resolve) => {
      tl.eventCallback("onComplete", () => {
        // Force golden aura if they win
        winnerSprite.setGoldenAura(true);
        resolve();
      });
    });
  }

  private fireworkInterval?: ReturnType<typeof setInterval>;

  private startFireworksLoop() {
    this.spawnFirework();
    this.fireworkInterval = setInterval(() => {
      if (this.visible) {
        this.spawnFirework();
      }
    }, 400);
  }

  private spawnFirework() {
    const { width, height } = this.app!.screen;
    const x = width / 2 + (Math.random() - 0.5) * 400;
    const y = height / 2 + (Math.random() - 0.5) * 400;
    
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffffff];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const p = new PIXI.Graphics();
      p.circle(0, 0, 3 + Math.random() * 3).fill(color);
      p.position.set(x, y);
      this.fireworksContainer.addChild(p);

      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = 50 + Math.random() * 150;
      
      gsap.to(p, {
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        pixi: { scale: 0.1 },
        duration: 1 + Math.random(),
        ease: "power2.out",
        onComplete: () => p.destroy()
      });
    }
  }

  public destroy(options?: PIXI.DestroyOptions) {
    if (this.fireworkInterval) clearInterval(this.fireworkInterval);
    gsap.killTweensOf(this);
    if (this.winnerContainer) gsap.killTweensOf(this.winnerContainer);
    if (this.overlay) gsap.killTweensOf(this.overlay);
    super.destroy(options);
  }
}
