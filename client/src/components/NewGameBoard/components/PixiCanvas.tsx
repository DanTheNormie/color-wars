import { useEffect, useRef } from "react";
import { PIXIGameBoard } from "@/components/NewGameBoard/pixi/engine";
import { useMapStore } from "@/stores/mapStateStore";

export function PixiCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<PIXIGameBoard | null>(null);
  const currentMap = useMapStore((s) => s.current_map);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const gameBoard = new PIXIGameBoard();
    engineRef.current = gameBoard;

    gameBoard.init(node).then(() => {
      gameBoard.loadMap(currentMap);
    });

    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [currentMap]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} id="pixi-container-div" className="aspect-square h-full w-full bg-background" />
    </div>
  );
}
