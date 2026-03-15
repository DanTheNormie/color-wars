import { type ReactNode } from "react";
import ChatInterface from "./MobileChat/MobileChat";
import GameLogDrawer from "./GameLog/GameLogDrawer";
interface ActionAreaProps {
  children?: ReactNode;
}

const ActionArea = ({ children }: ActionAreaProps) => {
  return (
    <div className="fixed z-99 right-0 bottom-0 left-0 flex w-full justify-center ">
      <div id="action-area" className="flex relative w-full flex-col gap-0.5 pb-2 px-2 max-w-[720px] drop-shadow-[0px_-8px_8px_#000000] bg-background">
        <GameLogDrawer />
        <div className="bg-secondary flex min-h-30 h-[16vh] max-h-45 items-center justify-center rounded-b-xl p-4 z-10">
          {children}
        </div>
        <div className="bg-secondary flex h-12 items-center justify-center rounded-lg">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};

export default ActionArea;
