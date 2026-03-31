import { useState } from "react";
import { useStore } from "@/stores/sessionStore";
import TradeModal from "./TradeModal";
import { PlusCircle } from "lucide-react";
import { AvatarColorMap } from "./Player";
import { Button } from "./ui/button";

const TradesList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewTradeId, setViewTradeId] = useState<string | null>(null);
  
  const activeTrades = useStore((s) => s.state.game?.activeTrades) || {};
  const players = useStore((s) => s.state.game?.players) || {};
  const roomPhase = useStore((s) => s.state.room?.phase);

  if (roomPhase !== "active") return null;

  const tradesList = Object.values(activeTrades).filter(t => t.status === "pending");

  return (
    <div className="w-full mb-4 mt-4 bg-secondary rounded-lg">
      <div className="flex items-center justify-between bg-secondary p-4 rounded-lg relative max-h-[300px] overflow-y-auto scrollbar-slim">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest text-center flex-1">Trades</h3>
        <Button size="sm" onClick={() => { setViewTradeId(null); setIsModalOpen(true); }} className="bg-[#8254e8] hover:bg-[#7348e9] text-white flex items-center gap-1.5 rounded-md h-7 px-3 text-xs absolute right-3">
          <PlusCircle className="h-3.5 w-3.5" /> Create
        </Button>
      </div>
      <div className="bg-secondary rounded-b-lg flex flex-col gap-1.5">
        {/* {tradesList.length === 0 && (
          <p className="text-center text-[11px] text-zinc-500 py-2 italic">No active trades</p>
        )} */}
        {tradesList.length !== 0 && tradesList.map((trade: any) => {
          const playerA = players[trade.playerAId];
          const playerB = players[trade.playerBId];
          if (!playerA || !playerB) return null;
          


          return (
            <div key={trade.id} onClick={() => { setViewTradeId(trade.id); setIsModalOpen(true); }} className="flex items-center px-5 justify-between p-2 hover:bg-white/5 rounded-md transition-colors border border-transparent hover:border-white/5 cursor-pointer">
              <div className="flex items-center gap-3 text-[13px] text-zinc-300">
                <div className="flex items-center gap-1.5">
                 <img src={AvatarColorMap[playerA.color] || "/avatars/red_round.svg"} className="w-4 h-4 rounded-full bg-zinc-800" alt="" />
                 <span>{playerA.name}</span>
                </div>
                <span className="text-sm">{"->"}</span>
                <div className="flex items-center gap-1.5">
                 <img src={AvatarColorMap[playerB.color] || "/avatars/red_round.svg"} className="w-4 h-4 rounded-full bg-zinc-800" alt="" />
                 <span>{playerB.name}</span>
                </div>
              </div>
              {/* <button 
                onClick={() => { setViewTradeId(trade.id); setIsModalOpen(true); }}
                className={`p-1.5 rounded-full transition-colors opacity-80 hover:opacity-100 ${isParticipant ? "text-indigo-400 hover:bg-indigo-400/20" : "text-zinc-500 hover:bg-white/10"}`}
                title="View trade details"
              >
                <Eye className="w-4 h-4" />
              </button> */}
            </div>
          )
        })}
      </div>
      
      {(isModalOpen || viewTradeId) && (
        <TradeModal 
          isOpen={true} 
          tradeId={viewTradeId} 
          onClose={() => { setIsModalOpen(false); setViewTradeId(null); }} 
        />
      )}
    </div>
  );
};

export default TradesList;
