import { useEffect, useRef } from "react";
import { PixiEngine } from "@/components/NewGameBoard/pixi/engine";
import { useMapStore } from "@/stores/mapStateStore";
//import DebugGameControls from "./animationDebug";

export function PixiCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<PixiEngine | null>(null);
  const currentMap = useMapStore((s) => s.current_map)

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const engine = new PixiEngine();
    engineRef.current = engine;

    engine.init(node).then(() => {
        engine.loadMap(currentMap)
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [currentMap]);


  return (
    <div className="relative h-full w-full p-4">
      <div ref={containerRef} id="pixi-container-div" className="aspect-square h-full w-full bg-[#111111]" />
      {/* <DebugGameControls /> */}
    </div>
  );
}
