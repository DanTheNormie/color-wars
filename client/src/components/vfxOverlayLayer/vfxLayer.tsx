import { useEffect, useRef } from "react";
import { PIXIVFXLayer } from "@/components/vfxOverlayLayer/pixi/vfxEngine";
import { useMapStore } from "@/stores/mapStateStore";

export function VFXLayer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<PIXIVFXLayer | null>(null);
  const currentMap = useMapStore((s) => s.current_map);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const engine = new PIXIVFXLayer();
    engineRef.current = engine;

    engine.init(element);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [currentMap]);

  return (
    <div className="pointer-events-none fixed top-0 right-0 bottom-0 left-0 z-50 h-full w-full bg-transparent">
      <div ref={containerRef} id="vfx-layer" className="aspect-square h-full w-full" />
    </div>
  );
}
