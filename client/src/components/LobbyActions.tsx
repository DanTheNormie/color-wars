import { useStore } from "@/stores/sessionStore";
/* import { useMapStore } from "@/stores/mapStateStore"; */
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { animateCoinConfettiToCanvas } from "@/animation/registry/anim";
import { pixiTargetLocator } from "@/animation/target-locator";
import { Sprite } from "pixi.js";
import { useRef } from "react";
import { PixiEngine } from "./NewGameBoard/pixi/engine";

const LobbyActions = () => {
  const navigate = useNavigate();
  const isLeader = useStore((z) => z.state.room.leaderId === z.currentPlayer.id);
  const startGame = useStore((z) => z.startGame);
  const leaveGame = useStore((z) => z.leaveGame);
  const ele = useRef<HTMLButtonElement>(null);
  /* const setTerritoryColor = useMapStore((z) => z.setTerritoryColor);

  const setMapID = useStore((z) => z.setMapID)
  const handleOnClick1 = ()=>{
    setMapID('INDIA')
  }
  const handleOnClick2 = ()=>{
    setMapID('TEST')
  } */

    const click = ()=>{
      const sprite = pixiTargetLocator.get<Sprite>('track-tile-0')!
      const engine = pixiTargetLocator.get("pixi-engine") as PixiEngine;
      if (!engine) throw new Error("PixiEngine not found in target locator");
      const app = engine.getApp()!;
      if (!app) throw new Error("Pixi Application not found in engine");
      animateCoinConfettiToCanvas(sprite, ele.current!, app, 20)
    }


  const handleLeaveGame = async () => {
    await leaveGame();
    navigate("/");
  };

  /* const ff = () => {
    setTerritoryColor("intn", "#ff0000");
  }; */
  return (
    <div className="flex flex-col gap-1">
      {isLeader && <Button onClick={startGame}>Start Game</Button>}
      <Button variant="destructive" onClick={handleLeaveGame}>
        Leave Game
      </Button>
      <Button ref={ele} variant='outline' onClick={click}>coin effect</Button>
      {/* <Button onClick={handleOnClick1}>Load India Map </Button>
      <Button onClick={handleOnClick2}>Load test Map </Button>
      <Button variant="outline" onClick={ff}>
        Set Territory Color
      </Button> */}
    </div>
  );
};

export default LobbyActions;
