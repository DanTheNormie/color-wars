import { useStore } from "@/stores/sessionStore";
/* import { useMapStore } from "@/stores/mapStateStore"; */
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { pixiTargetLocator } from "@/animation/target-locator";
//import { Sprite } from "pixi.js";
import { useRef } from "react";
import { PIXIVFXLayer } from "./vfxOverlayLayer/pixi/vfxEngine";

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

    // const click = ()=>{
    //   const sprite = pixiTargetLocator.get<Sprite>('track-tile-0')!
    //   const vfxLayer = pixiTargetLocator.get("vfx-engine") as PIXIVFXLayer;
    //   const gameBoard = pixiTargetLocator.get("game-board-engine") as PIXIVFXLayer;
    //   if (!vfxLayer) throw new Error("PixiEngine not found in target locator");
    //   const vfxApp = vfxLayer.getApp()!;
    //   const boardApp = gameBoard.getApp()!;
    //   if (!vfxApp) throw new Error("Pixi Application not found in engine");
    //   vfxLayer.animateCoinConfettiOverlay(sprite, ele.current!, boardApp, vfxApp, 50)
    // }

    const click2 = ()=>{
      const endElement = document.querySelector('[id^="player-money-"]')! as HTMLElement
      const startElement = document.querySelector('[id^="player-backpack-money-"]')! as HTMLElement
      const vfxLayer = pixiTargetLocator.get("vfx-engine") as PIXIVFXLayer;
      if (!vfxLayer) throw new Error("PixiEngine not found in target locator");
      vfxLayer.playEnergyTransferAnimation(startElement, endElement)
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
      {/* <Button onClick={handleOnClick1}>Load India Map </Button>
      <Button ref={ele} variant='outline' onClick={click2}>coin effect</Button>
      <Button onClick={handleOnClick2}>Load test Map </Button>
      <Button variant="outline" onClick={ff}>
        Set Territory Color
      </Button> */}
    </div>
  );
};

export default LobbyActions;
