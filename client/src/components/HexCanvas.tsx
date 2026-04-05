import { useEffect, useRef } from "react";
import gsap from "gsap";
import { defineHex, Grid, rectangle, Orientation, Hex } from "honeycomb-grid";

interface ConfettiHex {
  x: number;
  y: number;
  r: number;
  rot: number;
  color: string;
  opacity: number;
  scale: number;
}

const drawRoundedHexagon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
  radius: number = 4
) => {
  ctx.beginPath();
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + rot;
    points.push({
      x: x + r * Math.cos(angle),
      y: y + r * Math.sin(angle),
    });
  }

  // Start from the midpoint of the last edge
  ctx.moveTo(
    (points[0].x + points[5].x) / 2,
    (points[0].y + points[5].y) / 2
  );

  for (let i = 0; i < 6; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % 6];
    ctx.arcTo(p1.x, p1.y, p2.x, p2.y, radius);
  }
  ctx.closePath();
};

export const HexCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    const confetti: ConfettiHex[] = [];

    // Grid configuration
    const hexRadius = 30;
    const Hexagon = defineHex({ dimensions: hexRadius, orientation: Orientation.POINTY });
    let gridObject: Grid<Hex> | null = null;
    let loopW = 0;
    let loopH = 0;
    
    // Panning animation offset
    let offsetX = 0;
    let offsetY = 0;
    const panSpeedX = -0.15;
    const panSpeedY = -0.1;

    // Fixed color mapping for the grid to keep it consistent while scrolling
    const hexColors = new Map<string, string>();
    const bgColors = ['#170F1C'];
    
    // Helper to get a stable color for a specific grid coordinate
    const getHexColor = (q: number, r: number) => {
      const key = `${q},${r}`;
      if (!hexColors.has(key)) {
        hexColors.set(key, bgColors[Math.floor(Math.random() * bgColors.length)]);
      }
      return hexColors.get(key)!;
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);

      // We use POINTY orientation, so width is sqrt(3)*r, vertical spacing is 1.5*r
      const tileW = Math.sqrt(3) * hexRadius;
      // The pattern stagger repeats perfectly every 2 rows, which is 3*r
      const tileH = 3 * hexRadius;

      // Add extra margin to cover edges seamlessly
      const cols = Math.ceil(window.innerWidth / tileW) + 2;
      let rows = Math.ceil(window.innerHeight / (1.5 * hexRadius)) + 2;
      
      // Rows MUST be even to ensure perfectly repeating row stagger in the bounding box
      if (rows % 2 !== 0) rows += 1;

      loopW = cols * tileW;
      loopH = (rows / 2) * tileH;

      gridObject = new Grid(Hexagon, rectangle({ width: cols, height: rows }));
    };

    const handleClick = (e: MouseEvent) => {
      return
      const colors = ['#818cf8', '#c084fc', '#f472b6', '#60a5fa', '#ffffff'];
      const newConfetti: ConfettiHex[] = Array.from({ length: 15 }).map(() => ({
        x: e.clientX,
        y: e.clientY,
        r: Math.random() * 8 + 4,
        rot: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
        scale: 1,
      }));

      newConfetti.forEach((p) => {
        confetti.push(p);
        
        const angle = Math.random() * Math.PI * 3;
        const velocity = Math.random() * 100 + 50;
        const duration = Math.random() * 0.8 + 0.5;

        // X animation (outward)
        gsap.to(p, {
          x: p.x + Math.cos(angle) * velocity,
          y: p.y + Math.sin(angle) * velocity,
          ease: "power2.out",
          duration,
        });

        // Rotation & fade-out
        gsap.to(p, {
          rot: p.rot + (Math.random() - 0.5) * 15,
          opacity: 0,
          scale: 0.1,
          ease: "power2.in",
          duration,
          onComplete: () => {
            const idx = confetti.indexOf(p);
            if (idx > -1) confetti.splice(idx, 1);
          }
        });
      });
    };

    const render = () => {
      // Matte material UI background
      ctx.fillStyle = '#29203F';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      offsetX += panSpeedX;
      offsetY += panSpeedY;

      if (gridObject && loopW > 0 && loopH > 0) {
        // We use pad offset to prevent hexes popping out visually precisely at screen borders
        const padX = hexRadius * 2;
        const padY = hexRadius * 2;

        const tileW = Math.sqrt(3) * hexRadius;
        const tileH = 3 * hexRadius;

        gridObject.forEach(hex => {
          // Manually project axial (q, r) hex coordinates to pure absolute pixel coordinates 
          // because honeycomb's hex.x / hex.y accessors are uninitialized in this build environment.
          const origX = (hex.q + hex.r / 2) * tileW;
          const origY = hex.r * (tileH / 2);
          
          let px = origX + offsetX;
          let py = origY + offsetY;

          // Seamless loop wrap coordinates bounds
          px = ((px + padX) % loopW + loopW) % loopW - padX;
          py = ((py + padY) % loopH + loopH) % loopH - padY;

          const color = getHexColor(hex.q, hex.r);
          const opacity = 1;
          
          // rot = Math.PI / 6 aligns our custom draw function with POINTY top orientation
          drawRoundedHexagon(ctx, px, py, hexRadius*0.95, Math.PI / 6, 6);
          ctx.fillStyle = color;
          
          // Fill
          ctx.globalAlpha = opacity;
          ctx.fill();
          
          // Stroke
          ctx.globalAlpha = Math.min(1, opacity * 1.5);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      }

      // Draw GSAP-animated click confetti
      confetti.forEach((p) => {
        ctx.globalAlpha = p.opacity;
        drawRoundedHexagon(ctx, p.x, p.y, p.r * p.scale, p.rot, 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("click", handleClick);
    
    resizeCanvas();
    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};
