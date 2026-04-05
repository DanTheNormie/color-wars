import { useStore } from "@/stores/sessionStore";
/* import { useMapStore } from "@/stores/mapStateStore"; */
import { Button } from "./ui/button";
import { Play } from "lucide-react";
// import { pixiTargetLocator } from "@/animation/target-locator";
// import { Sprite } from "pixi.js";
// import { useRef } from "react";
// import { PIXIVFXLayer } from "./vfxOverlayLayer/pixi/vfxEngine";

const LobbyActions = () => {
  const isLeader = useStore((z) => z.state.room.leaderId === z.currentPlayer.id);
  const startGame = useStore((z) => z.startGame);
  // const [copied, setCopied] = useState(false);

  // const handleCopyInvite = () => {
  //   navigator.clipboard.writeText(window.location.href);
  //   setCopied(true);
  //   setTimeout(() => setCopied(false), 2000);
  // };
  // const ele = useRef<HTMLButtonElement>(null);
  /* const setTerritoryColor = useMapStore((z) => z.setTerritoryColor);

  const setMapID = useStore((z) => z.setMapID)
  const handleOnClick1 = ()=>{
    setMapID('INDIA')
  }
  const handleOnClick2 = ()=>{
    setMapID('TEST')
  } */

  /* const click2 = ()=>{
    const sprite = pixiTargetLocator.get<Sprite>('track-tile-0')!
    const vfxLayer = pixiTargetLocator.get("vfx-engine") as PIXIVFXLayer;
    const gameBoard = pixiTargetLocator.get("game-board-engine") as PIXIVFXLayer;
    if (!vfxLayer) throw new Error("PixiEngine not found in target locator");
    const vfxApp = vfxLayer.getApp()!;
    const boardApp = gameBoard.getApp()!;
    if (!vfxApp) throw new Error("Pixi Application not found in engine");
    vfxLayer.animateSpritesheetConfettiOverlay(sprite, ele.current!, boardApp, vfxApp, 10)
  } */




  // const handleLeaveGame = async () => {
  //   await leaveGame();
  //   navigate("/");
  // };

  /* const ff = () => {
    setTerritoryColor("intn", "#ff0000");
  }; */
  return (
    <div className="flex flex-col gap-1 h-full justify-around items-center">
      {isLeader && <Button color="violet" className="w-40 h-16 text-xl text-white" onClick={startGame}> <Play fill="white" /> Start Game</Button>}
      {!isLeader && <p className="mb-4 text-center text-lg">Please wait for the leader to start the game</p>}
      
      {/* <Button color="blue" className="w-40 text-white" onClick={handleCopyInvite}>
        {copied ? "Copied!" : "Copy Invite Link"}
      </Button> */}
      {/* <Button color="rose" className="bg-[#82181AAA]! w-40 text-white" onClick={handleLeaveGame}>
        Leave Game
      </Button> */}
      {/* <div className="flex gap-2 justify-center">
        <Button onClick={() => useStore.getState().shiftDiceTrack("forward")}>
          Shift Forward
        </Button>
        <Button onClick={() => useStore.getState().shiftDiceTrack("backward")}>
          Shift Backward
        </Button>
      </div> */}
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
