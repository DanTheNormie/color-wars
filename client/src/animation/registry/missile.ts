import * as PIXI from "pixi.js";
import gsap from "@/lib/gsap";

export function animateMissileLaunch(
  parent: PIXI.Container,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  const gfxTrail = new PIXI.Graphics();
  const gfxMissile = new PIXI.Graphics();
  const gfxExplosion = new PIXI.Graphics();

  parent.addChild(gfxTrail, gfxMissile, gfxExplosion);

  const tl = gsap.timeline({
    onComplete: () => {
      gfxTrail.destroy();
      gfxMissile.destroy();
      gfxExplosion.destroy();
    }
  });

  const arcH = 150 + Math.random() * 50;
  const cp = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - arcH };

  const duration = 4;
  const trail: { x: number; y: number }[] = [];
  const trailLen = 20;

  // Animation state object for GSAP to tween
  const state = { t: 0 };

  // 1. Flight Animation
  tl.to(state, {
    t: 1,
    duration: duration,
    ease: "power2.inOut",
    onUpdate: () => {
      if (gfxTrail.destroyed || gfxMissile.destroyed) return;

      // Bezier calculation
      const t = state.t;
      const mt = 1 - t;
      const pos = {
        x: mt * mt * start.x + 2 * mt * t * cp.x + t * t * end.x,
        y: mt * mt * start.y + 2 * mt * t * cp.y + t * t * end.y,
      };

      // Tangent for rotation
      const tan = {
        x: 2 * mt * (cp.x - start.x) + 2 * t * (end.x - cp.x),
        y: 2 * mt * (cp.y - start.y) + 2 * t * (end.y - cp.y),
      };
      const ang = Math.atan2(tan.y, tan.x);

      // Trail
      trail.push({ x: pos.x, y: pos.y });
      if (trail.length > trailLen) trail.shift();

      gfxTrail.clear();
      trail.forEach((pt, i) => {
        const fa = (i / trail.length) * 0.55;
        const fr = 0.5 + (i / trail.length) * 2.5;
        gfxTrail.circle(pt.x, pt.y, fr);
        gfxTrail.fill({ color: 0xffffff, alpha: fa });
      });

      // Missile sprite
      gfxMissile.clear();
      gfxMissile.x = pos.x;
      gfxMissile.y = pos.y;
      gfxMissile.rotation = ang;
      
      // Body
      gfxMissile.ellipse(0, 0, 6, 2.8);
      gfxMissile.fill({ color: 0xffffff, alpha: 0.95 });
      
      // Fin/Head
      gfxMissile.moveTo(6, 0);
      gfxMissile.lineTo(13, 0);
      gfxMissile.lineTo(6, -2.5);
      gfxMissile.fill({ color: 0xf44336, alpha: 0.9 });
    }
  });

  // 2. Explosion Trigger
  tl.addLabel("explosionStart", ">");
  tl.set({}, {
    onComplete: () => {
      if (!gfxMissile.destroyed) gfxMissile.clear();
      spawnExplosion(gfxExplosion, end.x, end.y, tl, "explosionStart");
    }
  }, "explosionStart");

  // Keep timeline alive long enough for explosion to complete (approx 1.5s more)
  tl.to({}, { duration: 1.5 }, "explosionStart");

  return tl;
}

function spawnExplosion(gfx: PIXI.Graphics, x: number, y: number, timeline: gsap.core.Timeline, startTime: string | number) {
  const flash = { r: 0, a: 1 };
  const explosionColor = [0xf44336, 0xff9800, 0xffeb3b, 0xffffff, 0xff5722];
  
  const rings = [
    { currentR: 2, maxR: 80, a: 0.9, color: 0xf44336, dur: 0.6 },
    { currentR: 2, maxR: 55, a: 0.75, color: 0xffeb3b, dur: 0.5 }
  ];

  const particles: any[] = [];
  for (let i = 0; i < 15; i++) {
    const ang = (i / 15) * Math.PI * 2 + Math.random() * 0.5;
    const spd = 2 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd * 0.7 - 2,
      a: 1,
      size: 1.5 + Math.random() * 2,
      color: explosionColor[i % explosionColor.length],
      currentX: x,
      currentY: y
    });
  }

  // Master draw loop
  const drawExplosion = () => {
    if (gfx.destroyed) return;
    gfx.clear();

    // 1. Flash
    if (flash.a > 0) {
      gfx.circle(x, y, flash.r);
      gfx.fill({ color: 0xffffff, alpha: flash.a });
    }

    // 2. Rings
    rings.forEach(r => {
      if (r.a > 0) {
        gfx.circle(x, y, r.currentR);
        gfx.stroke({ width: 1.5, color: r.color, alpha: r.a });
      }
    });

    // 3. Particles
    particles.forEach(p => {
      if (p.a > 0) {
        gfx.circle(p.currentX, p.currentY, p.size * p.a);
        gfx.fill({ color: p.color, alpha: p.a });
      }
    });
  };

  // Tweens added to the timeline at startTime
  timeline.to(flash, {
    r: 60,
    a: 0,
    duration: 0.4,
    ease: "power2.out",
    onUpdate: drawExplosion
  }, startTime);

  rings.forEach((r) => {
    timeline.to(r, {
      currentR: r.maxR,
      a: 0,
      duration: r.dur,
      ease: "power1.out",
      onUpdate: drawExplosion
    }, startTime);
  });

  particles.forEach((p) => {
    timeline.to(p, {
      currentX: p.x + p.vx * 15,
      currentY: p.y + p.vy * 15 + 10,
      a: 0,
      duration: 0.6 + Math.random() * 0.4,
      ease: "power1.out",
      onUpdate: drawExplosion
    }, startTime);
  });
}
