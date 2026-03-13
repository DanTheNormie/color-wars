import { useState, type ReactNode } from "react";
import ChatInterface from "./MobileChat/MobileChat";
import { TerritoryInfoDrawer } from "./TerritoryInfo";
import { useStore } from "@/stores/sessionStore";

interface ActionAreaProps {
  children?: ReactNode;
}

const ActionArea = ({ children }: ActionAreaProps) => {
  const showDiceRollMessage = useStore((z) => z.showDiceRollMessage);
  const lastRoll = useStore((z) => z.state.game.diceState.rollTo);
  const activePlayerId = useStore((z) => z.state.game.activePlayerId);
  const activePlayerName = useStore((z) => z.state.game.players[activePlayerId]?.name);
  const currentPlayerId = useStore((z) => z.currentPlayer.id);  

  const [lastMessage, setLastMessage] = useState("");

  const currentMessage = `${currentPlayerId === activePlayerId ? 'You' : activePlayerName} rolled ${lastRoll?.reduce((a, b) => a + b, 0) ?? 0} (${lastRoll?.[0] ?? 0} + ${lastRoll?.[1] ?? 0})`;

  if (showDiceRollMessage && currentMessage !== lastMessage) {
    setLastMessage(currentMessage);
  }

  const displayMessage = showDiceRollMessage ? currentMessage : lastMessage;

  return (
    <div className="fixed z-99 right-0 bottom-0 left-0 flex w-full justify-center ">
      <div id="action-area" className="flex relative w-full flex-col gap-0.5 pb-2 px-2 max-w-[720px] drop-shadow-[0px_-8px_8px_#000000] bg-background">
        <div className={`absolute h-fit mx-2 left-0 right-0 ${showDiceRollMessage ? 'top-[-30px]' : 'top-px'} transition-all duration-500 py-1 text-black pb-6 rounded-t-xl bg-yellow-500 flex justify-center`}>
          {displayMessage}
        </div>
        <div className="bg-secondary flex min-h-30 h-[16vh] max-h-45 items-center justify-center rounded-xl  p-4 z-10">
          {children}
        </div>
        <div className="bg-secondary flex h-12 items-center justify-center rounded-lg">
          <ChatInterface />
        </div>
        <TerritoryInfoDrawer />
      </div>
    </div>
  );
};

export default ActionArea;
