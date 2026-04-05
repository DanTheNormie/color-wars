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
    body.circle(0, 0, 12).fill({ color }).stroke({ width: 1, color: 0xffffff });
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
    shadow.roundPoly(0, 0, 18, 4, 4, this.degreeToRadian(45)).fill({ fill: gradient })
    this.player_box.addChildAt(shadow, 0);

    // --- Victory Lap Visuals (Rays & Crown) ---
    this.rayContainer = new PIXI.Container();
    this.rayContainer.visible = false;
    this.addChildAt(this.rayContainer, 0);

    //this.createRays();

    this.crownSprite = new PIXI.Sprite();
    this.crownSprite.anchor.set(0.5, 1);
    this.crownSprite.visible = false;
    this.player_box.addChild(this.crownSprite);

    this.loadCrown();
  }

  private loadCrown() {
    PIXI.Assets.load('/crown.png').then((tex) => {
      if (this.crownSprite) {
        this.crownSprite.texture = tex;
        this.crownSprite.scale.set(0.05); // Adjust based on PNG size
        this.crownSprite.y = -3;
        this.crownSprite.rotation = 0.2
      }
    });
  }

  // private createRays() {
  //   const rayCount = 12;
  //   const rayLength = 24;
  //   const rayAngle = (Math.PI * 2) / rayCount;

  //   for (let i = 0; i < rayCount; i++) {
  //     const ray = new PIXI.Graphics();

  //     const angleOffset = rayAngle * i;

  //     // Radiating ray: Triangle from center
  //     // Use a linear gradient for the ray
  //     const rayGradient = new PIXI.FillGradient({
  //       type: 'linear',
  //       start: { x: 0, y: 0 },
  //       end: { x: rayLength, y: 0 },
  //     });
  //     rayGradient.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
  //     //rayGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.5)');
  //     rayGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

  //     ray.poly([
  //       0, 0,
  //       rayLength, -2,
  //       rayLength, 2
  //     ]).fill({ fill: rayGradient });

  //     ray.rotation = angleOffset;
  //     this.rayContainer!.addChild(ray);
  //   }
  // }

  public setSelected(selected: boolean) {
    this.player_box.tint = selected ? 0xffff00 : 0xffffff;
  }

  public startPulse() {
    if (this.pulseTl) {
      //console.log('start pulse, killing existing')
      this.pulseTl.kill()
    }

    this.pulseTl = gsap.timeline()
    this.zIndex = 100
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

  public stopPulse() {
    this.pulseTl?.kill()
    this.pulseTl = undefined
    this.zIndex = 0
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

  private victoryLapTl?: gsap.core.Timeline;
  private crownSprite?: PIXI.Sprite;
  private rayContainer?: PIXI.Container;

  public setGoldenAura(enabled: boolean) {
    if (enabled) {
      if (this.victoryLapTl) return; // Already active or animating

      // Reset states for animation
      // if (this.rayContainer) {
      //   this.rayContainer.visible = true;
      //   this.rayContainer.alpha = 0;
      //   this.rayContainer.scale.set(0.2);
      //   this.rayContainer.rotation = 0;
      // }

      if (this.crownSprite) {
        this.crownSprite.visible = true;
        this.crownSprite.alpha = 0;
        this.crownSprite.y = -40; // Start high for drop effect
      }

      this.victoryLapTl = gsap.timeline();

      // if (this.rayContainer) {
      //   // Entrance: scale up and fade in
      //   this.victoryLapTl.to(this.rayContainer, {
      //     pixi: { scale: 1, alpha: 1 },
      //     duration: 0.6,
      //     ease: "back.out(1.7)"
      //   }, 0);

      //   // Loop: Continuous rotation
      //   const rotTl = gsap.timeline({ repeat: -1 });
      //   rotTl.to(this.rayContainer, {
      //     pixi: { rotation: "+=360" },
      //     duration: 12,
      //     ease: "none",
      //   });
      //   this.victoryLapTl.add(rotTl, 0);

      //   // Loop: Gentle alpha pulse
      //   const pulseTl = gsap.timeline({ repeat: -1, yoyo: true });
      //   pulseTl.to(this.rayContainer, {
      //     alpha: 0.4,
      //     duration: 1.5,
      //     ease: "sine.inOut"
      //   });
      //   this.victoryLapTl.add(pulseTl, 0);
      // }

      if (this.crownSprite) {
        // Entrance: Drop down onto head
        this.victoryLapTl.to(this.crownSprite, {
          pixi: { y: -4, alpha: 1 },
          duration: 0.8,
          ease: "bounce.out"
        }, 0.2);

        // Loop: Floating/Bobbing
        // const bobTl = gsap.timeline({ repeat: -1, yoyo: true });
        // bobTl.to(this.crownSprite, {
        //   pixi: { y: -18 }, // Float slightly up
        //   duration: 1.5,
        //   ease: "sine.inOut"
        // });
        // this.victoryLapTl.add(bobTl, 1.0);

        // Loop: Subtle tilt
        const tiltTl = gsap.timeline({ repeat: -1, yoyo: true });
        tiltTl.to(this.crownSprite, {
          pixi: { rotation: 15 },
          duration: 2,
          ease: "sine.inOut"
        });
        this.victoryLapTl.add(tiltTl, 0.2);
      }

    } else {
      // Kill existing animations
      if (this.victoryLapTl) {
        this.victoryLapTl.kill();
        this.victoryLapTl = undefined;
      }

      // Animate out
      const fadeTl = gsap.timeline({
        onComplete: () => {
          if (this.rayContainer) this.rayContainer.visible = false;
          if (this.crownSprite) this.crownSprite.visible = false;
          this.victoryLapTl = undefined;
        }
      });

      if (this.rayContainer) {
        fadeTl.to(this.rayContainer, {
          pixi: { scale: 0.5, alpha: 0 },
          duration: 0.3,
          ease: "power2.in"
        }, 0);
      }
      if (this.crownSprite) {
        fadeTl.to(this.crownSprite, {
          pixi: { y: -40, alpha: 0 },
          duration: 0.3,
          ease: "power2.in"
        }, 0);
      }

      this.victoryLapTl = fadeTl;
      this.player_box.tint = 0xffffff;
    }
  }

  destroy(options?: PIXI.DestroyOptions): void {
    this.pulseTl?.kill()
    this.pulseTl = undefined
    this.victoryLapTl?.kill()
    this.victoryLapTl = undefined
    gsap.killTweensOf(this);
    super.destroy(options);
  }
}