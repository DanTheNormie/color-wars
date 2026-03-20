import { useRef, useEffect } from "react";
import { useStore } from "@/stores/sessionStore";
import Dice from "./BetterDice";
import { nanoid } from "nanoid";
import { useDicePhysics } from "@/hooks/useDicePhysics";
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
  const diceA = useDicePhysics();
  const diceB = useDicePhysics();
  const holdStartRef = useRef<number | null>(null);

  const diceMode = useStore((z) => z.state.game.diceState.mode);
  const [a, b] = useStore((z) => z.state.game.diceState.rollTo);
  const currentPlayerID = useStore((z) => z.currentPlayer.id);
  const activePlayerId = useStore((z) => z.state.game.activePlayerId);
  const isNOTActivePlayer = currentPlayerID !== activePlayerId;
  const endTurn = useStore((z) => z.endTurn);
  const setShowDiceRollMessage = useStore((z) => z.setShowDiceRollMessage);
  const actionState = useStore((z) => z.actionState)
  const currentPlayerFinancialStatus = useStore((z) => z.state.game.players[currentPlayerID].financialStatus);
  const currentPlayerMoney = useStore((z) => z.state.game.players[currentPlayerID].money);
  const currentPlayerBackpackMoney = useStore((z) => z.state.game.players[currentPlayerID].backpack.money);
  const hasRolledDice = useStore((z) => z.state.game.players[currentPlayerID]?.hasRolled ?? false);
  const payOffDebt = useStore((z) => z.payOffDebt);
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
    let timer: ReturnType<typeof setTimeout>;
    if (diceMode == "ROLLINGTOFACE") {
      if (diceA.animationRef.current == null) diceA.startPhysicsLoop(nanoid());
      if (diceB.animationRef.current == null) diceB.startPhysicsLoop(nanoid());
      diceA.setMode("spin-to-target", { face: a });
      diceB.setMode("spin-to-target", { face: b });
      timer = setTimeout(() => {
        setShowDiceRollMessage(true)
      }, 2200)
    } else if (diceMode == "ACCELERATING" && isNOTActivePlayer) {
      diceA.setMode("accelerate");
      diceB.setMode("accelerate");
      diceA.startPhysicsLoop(nanoid());
      diceB.startPhysicsLoop(nanoid());
    } else if (diceMode == "RAGDOLLING" && isNOTActivePlayer) {
      diceA.setMode("ragdoll");
      diceB.setMode("ragdoll");
    }

    return () => {
      if (timer) clearTimeout(timer);
    }
  }, [diceMode]);

  const holdStart = () => {
    if (isNOTActivePlayer) return;
    holdStartRef.current = performance.now();
    diceA.setMode("accelerate");
    diceB.setMode("accelerate");
    diceA.startPhysicsLoop(nanoid());
    diceB.startPhysicsLoop(nanoid());
    sendDiceMode("acc");
  };
  const holdEnd = () => {
    if (isNOTActivePlayer) return;
    if (holdStartRef.current == null) return;
    const elapsed = performance.now() - holdStartRef.current!;
    holdStartRef.current = null;
    if (elapsed > 10000) {
      return;
    }
    if (elapsed < 1000) {
      diceA.setMode("ragdoll");
      diceB.setMode("ragdoll");
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
        <Dice quaternion={diceA.quat} />
        <Dice quaternion={diceB.quat} />
      </div>
      <div className={`${(actionState == 'idle') ? '' : 'hidden'} flex w-full h-full flex-1 justify-center items center flex-col gap-2  ${isNOTActivePlayer ? 'hidden' : ''}`}>
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
