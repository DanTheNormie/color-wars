import { useRef, useEffect } from "react";
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
  const currentPlayerFinancialStatus = useStore((z) => z.state.game.players[currentPlayerID]?.financialStatus ?? "healthy");
  const currentPlayerMoney = useStore((z) => z.state.game.players[currentPlayerID]?.money ?? 0);
  const currentPlayerBackpackMoney = useStore((z) => z.state.game.players[currentPlayerID]?.backpack?.money ?? 0);
  const hasRolledDice = useStore((z) => z.state.game.players[currentPlayerID]?.hasRolled ?? false);
  const payOffDebt = useStore((z) => z.payOffDebt);

  const holdStartRef = useRef<number | null>(null);

  const diceCount = 2;

  const diceRefs = useRef<(DiceController | null)[]>([]);

  const endTurnHandler = () => {
    if(currentPlayerFinancialStatus === "in-debt") {
     GameEventBus.emit("TOAST", {
      content: "You can't end your turn with a negative balance in your backpack.",
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

  const handlePayOffDebt = () => {
    if (!hasEnoughMoney) {
      GameEventBus.emit("TOAST", {
        content: "You don't have enough money to pay off debt. \n Sell territories or trade with other players.",
        type: "error",
        duration: 5000
      })
      return
    }
    payOffDebt()
  }

  const hasEnoughMoney = ((currentPlayerMoney + currentPlayerBackpackMoney) >= 0)

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
        <div className={`${hasRolledDice ? '' : 'hidden'} w-full flex flex-col gap-2 justify-center`}>
          {/* Dialog is just listening to state */}
          {currentPlayerFinancialStatus === "in-debt" &&
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-full flex justify-center">
                  <Button
                    className={!hasEnoughMoney ? "opacity-50" : ""}
                    onClick={handlePayOffDebt}
                  >
                    Pay Off Debt
                  </Button>
                </span>
              </TooltipTrigger>

              {!hasEnoughMoney && (
                <TooltipContent className="z-99999">
                  You don't have enough money to pay off debt.<br /> Sell territories or trade with other players.
                </TooltipContent>
              )}
            </Tooltip>
          }

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="w-full flex justify-center">
                <Button
                  className={`${currentPlayerFinancialStatus === "in-debt" ? "opacity-50" : ""}`}
                  onClick={endTurnHandler}>
                  End Turn {currentPlayerFinancialStatus == 'in-debt' ? '⚠️' : ''}
                </Button>
              </span>
            </TooltipTrigger>

            {currentPlayerFinancialStatus === "in-debt" && (
              <TooltipContent className="z-99999">
                You can't end your turn with a negative balance in your backpack.
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </section>
  );
};

export default TurnControls;
