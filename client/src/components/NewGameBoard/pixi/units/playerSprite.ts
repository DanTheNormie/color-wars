import gsap from "@/lib/gsap";
import * as PIXI from "pixi.js";

export class PlayerSprite extends PIXI.Container {
  public id: string;
  // Track where this unit logically belongs
  public currentTileId: string | null = null; 
  public isAnimating: boolean = false; // Prevents resize from snapping mid-animation
  private pulseTl?: gsap.core.Timeline;
  private player_box: PIXI.Container;
  public baseScale: number = 1;

  private degreeToRadian = (degree: number) => degree * (Math.PI / 180);

  constructor(id: string, color: number) {
    super();
    this.id = id;
    

    const body = new PIXI.Graphics();
    body.circle(0,0,12).fill({color}).stroke({ width: 1, color: 0xffffff });
    this.player_box = new PIXI.Container();
    this.player_box.addChild(body);
    
    this.addChild(this.player_box);


    // --- Eyes ---
    const eyeRadius = 3;
    const pupilRadius = 1;

    const leftEyeX = -4.2;
    const rightEyeX = 4.2;
    const eyeY = -3;

    // helper for small random offset
    const randomOffset = (max: number) => (Math.random() - 0.5) * 2 * max;

    // keep pupil inside eye
    const maxOffset = eyeRadius - pupilRadius - 1;

    // generate goofy offsets
    const leftOffsetX = randomOffset(maxOffset);
    const leftOffsetY = randomOffset(maxOffset);

    const rightOffsetX = randomOffset(maxOffset);
    const rightOffsetY = randomOffset(maxOffset);

    // left eye
    const leftEye = new PIXI.Graphics()
      .circle(leftEyeX, eyeY, eyeRadius)
      .fill({ color: 0xffffff });

    const leftPupil = new PIXI.Graphics()
      .circle(leftEyeX + leftOffsetX, eyeY + leftOffsetY, pupilRadius)
      .fill({ color: 0x000000 });

    // right eye
    const rightEye = new PIXI.Graphics()
      .circle(rightEyeX, eyeY, eyeRadius)
      .fill({ color: 0xffffff });

    const rightPupil = new PIXI.Graphics()
      .circle(rightEyeX + rightOffsetX, eyeY + rightOffsetY, pupilRadius)
      .fill({ color: 0x000000 });

    // add to container (or to this.graphics if you prefer)
    this.player_box.addChild(leftEye, leftPupil, rightEye, rightPupil);
    
    const gradient = new PIXI.FillGradient({
      type: 'radial',
      center: { x: 0.5, y: 0.5 },
      innerRadius: 10,
      outerCenter: { x: 0.5, y: 0.5 },
      outerRadius: 18,
    });
    gradient.addColorStop(0, 'rgba(0,0,0,1)')
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    const shadow = new PIXI.Graphics();
    shadow.roundPoly(0, 0, 18, 4, 4, this.degreeToRadian(45) ).fill({fill: gradient})
    this.player_box.addChildAt(shadow, 0);
  }

  public setSelected(selected: boolean) {
    this.player_box.tint = selected ? 0xffff00 : 0xffffff;
  }

  public startPulse(){
    if(this.pulseTl) {
      console.log('start pulse, killing existing')
      this.pulseTl.kill()
    }
    
    this.pulseTl = gsap.timeline()

    this.pulseTl.to(this.player_box, {
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

    gsap.to(this.player_box, {
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