import gsap from "@/lib/gsap";
import * as PIXI from "pixi.js";

export class PlayerSprite extends PIXI.Container {
  public id: string;
  // Track where this unit logically belongs
  public currentTileId: string | null = null; 
  public isAnimating: boolean = false; // Prevents resize from snapping mid-animation
  private pulseTl?: gsap.core.Timeline;
  private graphics: PIXI.Graphics;
  public baseScale: number = 1;

  constructor(id: string, color: number) {
    super();
    this.id = id;

    this.graphics = new PIXI.Graphics();
    this.graphics.circle(0, 0, 10).fill({ color }).stroke({ width: 1, color: 0x000000 });

    this.graphics.eventMode = "static";
    this.graphics.cursor = "pointer";

    this.addChild(this.graphics);
  }

  public setSelected(selected: boolean) {
    this.graphics.tint = selected ? 0xffff00 : 0xffffff;
  }

  public startPulse(){
    if(this.pulseTl) {
      console.log('start pulse, killing existing')
      this.pulseTl.kill()
    }
    
    this.pulseTl = gsap.timeline()

    this.pulseTl.to(this.graphics, {
      pixi: {
        scale: 0.85,
      },
      duration: 0.3,
      ease: "power1.inOut",
      repeat: -1,
      yoyo: true,
    });
  }

  public stopPulse(){
    this.pulseTl?.kill()
    this.pulseTl = undefined
    
    // Smoothly return to base scale
    gsap.to(this, {
      pixi: {
        scale: this.baseScale,
      },
      duration: 0.2,
      ease: "power1.inOut",
    });

    gsap.to(this.graphics, {
      pixi: {
        scale: 1,
      },
      duration: 0.2,
      ease: "power1.inOut",
    });
  }

  destroy(_?: PIXI.DestroyOptions): void {
    this.pulseTl?.kill()
    this.pulseTl = undefined
  }
}