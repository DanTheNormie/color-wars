import * as PIXI from "pixi.js";
import gsap from "@/lib/gsap";
import { PlayerSprite } from "@/components/NewGameBoard/pixi/units/playerSprite";
import type { TileConfig } from "@color-wars/shared";
import { DiceTrackLayer } from "@/components/NewGameBoard/pixi/layers/DiceTrackLayer";
import { TokenLayer } from "@/components/NewGameBoard/pixi/layers/TokenLayer";

/**
 * Animation Recipe: token hop
 */
export function animateUnitHop(unit: PlayerSprite, pathTiles: PIXI.Container[]) {
  const tl = gsap.timeline();

  // We start from the unit's current position (or the first tile in the path if we want to be strict)
  // But usually, the path[0] is the tile the unit is currently on.
  for (let i = 0; i < pathTiles.length - 1; i++) {
    const startTile = pathTiles[i];
    const endTile = pathTiles[i + 1];

    // Helper object to tween 'progress' from 0 to 1
    const tweenObj = { t: 0 };

    tl.to(tweenObj, {
      duration: 0.3,
      t: 1,
      ease: "power1.inOut",
      onStart: () => {
        unit.stopPulse()
        // Optional: Update logical ID at start of hop, or end?
        // Usually safer to update at end, or update strictly purely visual here.
      },
      onUpdate: () => {
        // LINEAR INTERPOLATION (Lerp)
        // Calculate position based on where the tiles are RIGHT NOW.
        // If tiles move due to resize, this formula accounts for it instantly.
        unit.x = startTile.x + (endTile.x - startTile.x) * tweenObj.t;
        unit.y = startTile.y + (endTile.y - startTile.y) * tweenObj.t;
      },
      onComplete: () => {
        // Snap explicitly to ensure precision at end of step
        console.log("completed hop to tile: ", endTile.label);
        unit.position.copyFrom(endTile.position);
        unit.currentTileId = endTile.label; // Update logical position step-by-step
      },
    });
  }

  return tl;
}

export function ToXY(target: PIXI.Container, endPos: { x: number; y: number }) {
  return gsap.to(target, {
    x: endPos.x,
    y: endPos.y,
    duration: 0.5,
    onUpdate: () => {
      console.log("updating,", target.x);
    },
  });
}

export function animateCoinConfettiToDom(sprite: PIXI.Container, targetEl: HTMLElement, app: PIXI.Application, count = 12) {
  const confettiEls: HTMLElement[] = [];
  const meta: { burstOffset: { x: number; y: number } }[] = [];
  const coinSize = sprite.width / 4;
  const global = sprite.getGlobalPosition();
  const canvasRect = app.canvas.getBoundingClientRect();
  const baseX = canvasRect.left + global.x - coinSize / 2;
  const baseY = canvasRect.top + global.y - coinSize / 2;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.style.width = `${coinSize}px`;
    el.style.height = `${coinSize}px`;
    el.style.background = "#31d652";
    el.style.borderRadius = "50%";
    el.style.border = "1px solid #262626";
    el.style.position = "fixed";
    el.style.pointerEvents = "none";
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.zIndex = "10";

    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * coinSize * 3;

    el.style.transform = `translate(${baseX}px, ${baseY}px)`;
    document.body.appendChild(el);

    meta.push({
      burstOffset: {
        x: baseX + Math.cos(angle) * radius,
        y: baseY + Math.sin(angle) * radius,
      },
    });

    confettiEls.push(el);
  }

  const rect = targetEl.getBoundingClientRect();
  const endX = rect.left + rect.width / 2;
  const endY = rect.top + rect.height / 2;
  return gsap
    .timeline()
    .to(confettiEls, {
      transform: (i) => {
        const { burstOffset } = meta[i];
        return `translate(${burstOffset.x}px, ${burstOffset.y}px)`;
      },
      stagger: 0.002,
      duration: 0.4,
      ease: "power2.out",
    })
    .to(confettiEls, {
      transform: () => {
        return `translate(${endX}px, ${endY}px)`;
      },
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      stagger: 0.005,
      onComplete: () => {
        confettiEls.forEach((el) => el.remove());
      },
    });
}

function getCanvasContext (){
  const canvas = document.getElementById("vfx-layer") as HTMLCanvasElement;
  if (!canvas) throw new Error('canvas not ready yet');
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  
  const canavasRect = canvas.getBoundingClientRect();
  
  canvas.width = Math.round(canavasRect.width * dpr);
  canvas.height = Math.round(canavasRect.height * dpr);
  
  const ctx = canvas.getContext("2d")!;
  // IMPORTANT: reset transform before scaling
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  return ctx
}

export function animateCoinConfettiToCanvas(sprite: PIXI.Container, targetEl: HTMLElement, app: PIXI.Application, count = 12) {
  const ctx = getCanvasContext() 

  const coins: {
    x: number;
    y: number;
    r: number;
    opacity: number;
  }[] = [];

  const meta: { burstX: number; burstY: number }[] = [];

  const coinSize = sprite.width / 4;
  const global = sprite.getGlobalPosition();
  const canvasRect = app.canvas.getBoundingClientRect();

  const startX = canvasRect.left + global.x;
  const startY = canvasRect.top + global.y;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * coinSize * 3;

    coins.push({
      x: startX,
      y: startY,
      r: coinSize / 2,
      opacity: 1,
    });

    meta.push({
      burstX: startX + Math.cos(angle) * radius,
      burstY: startY + Math.sin(angle) * radius,
    });
  }

  const rect = targetEl.getBoundingClientRect();
  const endX = rect.left + rect.width / 2;
  const endY = rect.top + rect.height / 2;

  function render() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (const c of coins) {
      if (c.opacity <= 0) continue;

      ctx.globalAlpha = c.opacity;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = "#31d652";
      ctx.fill();
      ctx.strokeStyle = "#262626";
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  return gsap
    .timeline({
      onUpdate: render,
      onComplete: () => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      },
    })
    .to(coins, {
      x: (i) => meta[i].burstX,
      y: (i) => meta[i].burstY,
      stagger: 0.002,
      duration: 0.4,
      ease: "power2.out",
    })
    .to(coins, {
      x: endX,
      y: endY,
      opacity: 0,
      stagger: 0.005,
      duration: 0.2,
      ease: "power2.in",
    });
}

export function testAnimation(x1: number, y1: number, x2: number, y2: number) {
  const canvas = document.getElementById("vfx-layer") as HTMLCanvasElement;
  if (!canvas) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  
  const ctx = canvas.getContext("2d")!;
  // IMPORTANT: reset transform before scaling
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  console.log({
    dpr: window.devicePixelRatio,
    canvasCSS: canvas.getBoundingClientRect(),
    canvasActual: { w: canvas.width, h: canvas.height },
    ctxActual: { w: ctx.canvas.width, h: ctx.canvas.height },
  });


  const startX = x1
  const startY = y1

      const coins: {
    x: number;
    y: number;
    r: number;
    opacity: number;
  }[] = [];

  for(let i=1; i<=1; i++){
    coins.push({
      x: startX,
      y: startY,
      r: 100,
      opacity: 1
    })
  }


  function render() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (const c of coins) {
      if (c.opacity <= 0) continue;

      ctx.globalAlpha = c.opacity;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = "#31d652";
      ctx.fill();
      ctx.strokeStyle = "#262626";
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  return gsap
    .timeline({
      onUpdate: render,
      onComplete: () => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      },
    })
    .to(coins, {
      x: x2,
      y: y2,
      stagger: 0.002,
      duration: 2,
      ease: "power2.out",
    })
    .to(coins, {
      x: x1,
      y: y1,
      stagger: 0.002,
      duration: 2,
      ease: "power2.out",
    })
    .repeat(20)
}

export function animateCoinConfetti(sprite: PIXI.Container, app: PIXI.Application, count = 12) {
  const confettiEls: HTMLElement[] = [];
  const meta: { burstOffset: { x: number; y: number } }[] = [];
  const coinSize = sprite.width / 4;
  const global = sprite.getGlobalPosition();
  const canvasRect = app.canvas.getBoundingClientRect();
  const baseX = canvasRect.left + global.x - coinSize / 2;
  const baseY = canvasRect.top + global.y - coinSize / 2;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.style.width = `${coinSize}px`;
    el.style.height = `${coinSize}px`;
    el.style.background = "red";
    el.style.borderRadius = "50%";
    el.style.border = "1px solid #262626";
    el.style.position = "fixed";
    el.style.pointerEvents = "none";
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.zIndex = "10";

    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * coinSize * 3;

    el.style.transform = `translate(${baseX}px, ${baseY}px)`;
    document.body.appendChild(el);

    meta.push({
      burstOffset: {
        x: baseX + Math.cos(angle) * radius,
        y: baseY + Math.sin(angle) * radius,
      },
    });

    confettiEls.push(el);
  }

  return gsap
    .timeline()
    .to(confettiEls, {
      transform: (i) => {
        const { burstOffset } = meta[i];
        return `translate(${burstOffset.x}px, ${burstOffset.y}px)`;
      },
      stagger: 0.002,
      duration: 0.4,
      ease: "power2.out",
    })
    .to(confettiEls, {
      transform: (i) => {
        const { burstOffset } = meta[i];
        return `translate(${burstOffset.x}px, ${burstOffset.y - 30}px)`;
      },
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      stagger: 0.005,
      onComplete: () => {
        confettiEls.forEach((el) => el.remove());
      },
    });
}

export function createFloatingDiff(container: HTMLElement, diff: number) {
  const diffEl = document.createElement("div");
  const statTextEl = container.querySelector("span") as HTMLSpanElement;
  const statTextElHeight = statTextEl.offsetHeight;
  const statTextClass = statTextEl.className;

  diffEl.textContent = `${diff > 0 ? "+" : "-"}${diff}`;

  // Tailwind utility classes:
  diffEl.className = `absolute left-[-6px] top-0 font-bold pointer-events-none ${statTextClass}`.trim();

  diffEl.style.color = diff > 0 ? "green" : "red";

  container.appendChild(diffEl);

  const tl = gsap.timeline();

  tl.fromTo(
    diffEl,
    {
      y: 0,
      opacity: 0,
    },
    {
      y: statTextElHeight*-1,
      opacity: 1,
      duration: 0.4,
    },
  )
    .to(diffEl, { duration: 1 }) // <— wait 1 second
    .to(diffEl, {
      y: statTextElHeight*-2,
      opacity: 0,
      duration: 0.4,
      ease: "power1.out",
      onComplete: () => diffEl.remove(),
    });
  return tl;
}

export function animateCounter(el: HTMLSpanElement, animatedValue: { val: number }, target: number) {
  return gsap.to(animatedValue, {
    val: target,
    duration: 0.6,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = Math.floor(animatedValue.val).toString();
    },
  });
}

function getTargetStepIndex(
  currentIndex: number, 
  step: number, 
  maxIndex: number, 
  direction: 'forward' | 'backward'
): number {
  if (direction === 'forward') {
      return Math.max(0, currentIndex - step);
  } else {
      const target = currentIndex + step;
      return target > maxIndex ? 0 : target;
  }
}

function getNewSpriteForwardKeyframes(idx: number, count: number, maxIdx: number, targetCoords: {x: number, y: number}[]) {
  const keys = [];
  const startCoord = targetCoords[0];
  for (let step = 1; step <= count; step++) {
      const activeSteps = step - idx;
      if (activeSteps <= 0) {
          keys.push({ pixi: { x: startCoord.x, y: startCoord.y, alpha: 0 } });
      } else {
          const stepIdx = maxIdx + 1 - activeSteps;
          keys.push({ pixi: { x: targetCoords[stepIdx].x, y: targetCoords[stepIdx].y, alpha: 1 } });
      }
  }
  return keys;
}

function getNewSpriteBackwardKeyframes(idx: number, count: number, maxIdx: number, targetCoords: {x: number, y: number}[]) {
  const keys = [];
  for (let step = 1; step <= count; step++) {
      const activeSteps = step - (count - 1 - idx); 
      if (activeSteps <= 0) {
          keys.push({ pixi: { x: targetCoords[0].x, y: targetCoords[0].y, alpha: 0 } });
      } else {
          const stepIdx = Math.min(maxIdx, activeSteps);
          keys.push({ pixi: { x: targetCoords[stepIdx].x, y: targetCoords[stepIdx].y, alpha: 1 } });
      }
  }
  return keys;
}

export function buildTrackShiftAnimation(
  trackLayer: DiceTrackLayer, 
  tokenLayer: TokenLayer, 
  newTiles: TileConfig[], 
  shiftDirection: 'forward' | 'backward', 
  app: PIXI.Application
) {
  const tl = gsap.timeline({ paused: true });
  const sprites = trackLayer.getTrackSprites();
  const maxIdx = sprites.length - 1;
  const targetCoords = sprites.map(s => ({ x: s.position.x, y: s.position.y }));

  const newSprites = newTiles.map(nt => trackLayer.prepareNewTileSprite(nt, app));
  const count = newTiles.length;
  
  const stateUpdates: (() => void)[] = [];

  tl.eventCallback("onComplete", () => {
     trackLayer.commitTrackShift(count, shiftDirection, newSprites);
     stateUpdates.forEach(update => update());
  });

  sprites[0].zIndex = 10;
  trackLayer.getTrackLayer().sortableChildren = true;

  // 1. Existing Track Sprites
  for (let i = 1; i < sprites.length; i++) {
      const keys = [];
      const isVanishing = shiftDirection === 'forward' ? (i <= count) : (i >= sprites.length - count);
      
      for (let step = 1; step <= count; step++) {
          const stepIdx = getTargetStepIndex(i, step, maxIdx, shiftDirection);
          keys.push({ 
            pixi: { 
              x: targetCoords[stepIdx].x, 
              y: targetCoords[stepIdx].y,
              ...(isVanishing && stepIdx === 0 ? { alpha: 0 } : {})
            } 
          });
      }
      
      tl.to(sprites[i], { keyframes: keys, duration: 2, ease: "power2.inOut" }, 0);
      if (isVanishing) sprites[i].zIndex = 1;
  }

  // 2. New Sprites
  newSprites.forEach((ns, idx) => {
      const isForward = shiftDirection === 'forward';
      const startCoord = targetCoords[0];
      
      ns.position.set(startCoord.x, startCoord.y);
      ns.scale.copyFrom(sprites[0].scale);
      ns.alpha = 0;
      ns.zIndex = 0;
      
      const keys = isForward 
        ? getNewSpriteForwardKeyframes(idx, count, maxIdx, targetCoords)
        : getNewSpriteBackwardKeyframes(idx, count, maxIdx, targetCoords);

      tl.to(ns, { keyframes: keys, duration: 2, ease: "power2.inOut" }, 0);
  });

  // 3. Tokens
  tokenLayer.getUnits().forEach((unit) => {
    const tileId = unit.currentTileId;
    if (tileId && tileId.startsWith("track-tile-")) {
      const idx = parseInt(tileId.split("-")[2]);
      if (idx > 0) {
        const targetIdx = getTargetStepIndex(idx, count, maxIdx, shiftDirection);
        const targetTileId = `track-tile-${targetIdx}`;
        
        const unitKeys = [];
        for (let step = 1; step <= count; step++) {
           const stepIdx = getTargetStepIndex(idx, step, maxIdx, shiftDirection);
           const tileCoord = targetCoords[stepIdx];
           const originalTileCoord = targetCoords[idx];
           const dx = tileCoord.x - originalTileCoord.x;
           const dy = tileCoord.y - originalTileCoord.y;
           unitKeys.push({ pixi: { x: unit.x + dx, y: unit.y + dy } });
        }

        if (unitKeys.length > 0) {
          tl.to(unit, { keyframes: unitKeys, duration: 2, ease: "power2.inOut" }, 0);
        }
        
        stateUpdates.push(() => {
          unit.currentTileId = targetTileId;
        });
      }
    }
  });

  return tl;
}
