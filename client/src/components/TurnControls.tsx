import { useRef, useEffect, useState } from "react";
import { useStore } from "@/stores/sessionStore";
import BetterDice, { type DiceController } from "./BetterDice";
import { nanoid } from "nanoid";
import { Button } from "./ui/button";
import DiceHoldButton from "./DiceHoldButton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { GameEventBus } from "@/lib/managers/GameEventBus";
import SabotageModal from "./SabotageModal";
import MissileLaunchModal from "./MissileLaunchModal";
import { Sword, Rocket } from "lucide-react";

const TurnControls = () => {
  const sendDiceMode = useStore((z) => z.sendDiceMode);
  // -----------------------------------------------------
  // DICE STATE
  // -----------------------------------------------------
  const diceMode = useStore((z) => z.state.game.diceState.mode);
  const rollTo = useStore((z) => z.state.game.diceState.rollTo);
  const currentPlayerID = useStore((z) => z.currentPlayer.id);
  const activePlayerId = useStore((z) => z.state.game.activePlayerId);
  const isNOTActivePlayer = currentPlayerID !== activePlayerId;
  const endTurn = useStore((z) => z.endTurn);
  const setShowDiceRollMessage = useStore((z) => z.setShowDiceRollMessage);
  const actionState = useStore((z) => z.actionState);
  const currentPlayerStatus = useStore((z) => z.state.game.players[currentPlayerID]?.status ?? "healthy");
  const hasRolledDice = useStore((z) => z.state.game.players[currentPlayerID]?.hasRolled ?? false);
  const currentTile = useStore((z) => z.state.game.diceTrack[z.state.game.players[currentPlayerID]?.position ?? 0]);

  const hasSabotagedThisRound = useStore((z) => z.state.game.players[currentPlayerID]?.hasSabotagedThisRound ?? false);
  const players = useStore((z) => z.state.game.players);
  
  const [isSabotageModalOpen, setIsSabotageModalOpen] = useState(false);
  const [isMissileModalOpen, setIsMissileModalOpen] = useState(false);

  const holdStartRef = useRef<number | null>(null);

  const diceCount = 2;

  const diceRefs = useRef<(DiceController | null)[]>([]);

  const endTurnHandler = () => {
    if(currentPlayerStatus === "in-debt") {
     GameEventBus.emit("TOAST", {
      content: "You can't end your turn with a negative balance.",
      type: "error",
      duration: 5000
     }) 
     return
    }
    endTurn()
  }

  useEffect(() => {
    if (diceMode == "ROLLINGTOFACE") {
      diceRefs.current.forEach((dice, i) => {
        if (!dice) return;
        if (!dice.isRunning()) dice.startPhysicsLoop(nanoid());
        // Default to a fallback face if rollTo array is shorter than expected
        const face = rollTo[i] ?? 1;
        dice.setMode("spin-to-target", { face });
        dice.setOnSettle(() => setShowDiceRollMessage(true));
      });
    } else if (diceMode == "ACCELERATING" && isNOTActivePlayer) {
      diceRefs.current.forEach((dice) => {
        if (!dice) return;
        dice.setMode("accelerate");
        dice.startPhysicsLoop(nanoid());
      });
    } else if (diceMode == "RAGDOLLING" && isNOTActivePlayer) {
      diceRefs.current.forEach((dice) => {
        if (!dice) return;
        dice.setMode("ragdoll");
      });
    } else if(diceMode == "IDLE" && rollTo && rollTo.length > 0) {
      diceRefs.current.forEach((dice, i) => {
        if (!dice) return;
        dice.rotateToFace(rollTo[i]);
      });
    }
  }, [diceMode, rollTo]);

  const holdStart = () => {
    if (isNOTActivePlayer) return;
    holdStartRef.current = performance.now();
    diceRefs.current.forEach((dice) => {
      if (!dice) return;
      dice.setMode("accelerate");
      dice.startPhysicsLoop(nanoid());
    });
    sendDiceMode("acc");
  };

  const holdEnd = () => {
    if (isNOTActivePlayer) return;
    if (holdStartRef.current == null) return;
    const elapsed = performance.now() - holdStartRef.current!;
    holdStartRef.current = null;
    if (elapsed > 10000) {
      return; // Handled defensively if hold is unreasonably long
    }
    if (elapsed < 1000) {
      diceRefs.current.forEach((dice) => {
        if (!dice) return;
        dice.setMode("ragdoll");
      });
      sendDiceMode("rag");
    } else {
      sendDiceMode("roll");
    }
  };

  const isTileSafe = currentTile && (currentTile.type === 'START' || currentTile.type === 'SAFE');
  const validVictimsCount = Object.values(players).filter(
    (p) => p.id !== currentPlayerID && p.position === players[currentPlayerID]?.position && p.status !== "bankrupt"
  ).length;
  const canSabotage = !hasSabotagedThisRound && !isTileSafe && validVictimsCount > 0;

  const hasMissileSilo = Object.values(useStore.getState().state.game.territoryOwnership || {}).some(
    (t: any) => t.ownerId === currentPlayerID && t.buildingType === "MISSILE_SILO"
  );

  return (
    <section className="relative flex h-full w-full items-center justify-between">
      <div className="flex relative w-full h-full flex-1 grow-2 justify-center gap-[1%] items-center">
        {Array.from({ length: diceCount }).map((_, i) => (
          <BetterDice 
             key={i} 
             ref={(el) => {
               diceRefs.current[i] = el;
             }} 
          />
        ))}
      </div>
      <div className={`${(actionState == 'idle') ? '' : 'hidden'} flex w-full h-full flex-1 justify-center items-center flex-col gap-2 ${isNOTActivePlayer ? 'hidden' : ''}`}>
        <DiceHoldButton hasRolled={hasRolledDice} onHoldStart={holdStart} onHoldEnd={holdEnd} />
        <div className={`${!hasRolledDice ? 'hidden' : ''} w-full flex flex-col gap-2 justify-center`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="w-full flex justify-center flex-col items-center gap-2">
                <Button
                  className={`${currentPlayerStatus === "in-debt" ? "opacity-50" : ""}`}
                  onClick={endTurnHandler}>
                  End Turn {currentPlayerStatus == 'in-debt' ? '⚠️' : ''}
                </Button>
                {/* Sabotage Button logic */}
                {canSabotage &&
                  <Button 
                    variant={"destructive"}
                    onClick={() => setIsSabotageModalOpen(true)}
                  >
                    <Sword className="w-4 h-4 mr-2" />
                    Sabotage
                  </Button>
                }
                {hasMissileSilo &&
                  <Button 
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => setIsMissileModalOpen(true)}
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Launch Missile
                  </Button>
                }
              </span>
            </TooltipTrigger>

            {currentPlayerStatus === "in-debt" && (
              <TooltipContent className="z-99999">
                You can't end your turn with a negative balance.
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
      <SabotageModal isOpen={isSabotageModalOpen} onClose={() => setIsSabotageModalOpen(false)} />
      <MissileLaunchModal isOpen={isMissileModalOpen} onClose={() => setIsMissileModalOpen(false)} />
    </section>
  );
};

export default TurnControls;
