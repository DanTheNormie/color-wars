import { useState } from "react";
import { X, Send, ArrowLeftRight, Check, XCircle, MapPin } from "lucide-react";
import { useStore } from "@/stores/sessionStore";
import { useMapStore } from "@/stores/mapStateStore";
import { AvatarColorMap } from "./Player";
import type { RewardConfig } from "@color-wars/shared";

type TradeModalProps = {
  isOpen: boolean;
  tradeId: string | null;
  onClose: () => void;
};

export default function TradeModal({ isOpen, tradeId, onClose }: TradeModalProps) {
  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(null);

  const activeTrades = useStore((s) => s.state.game?.activeTrades) || {};
  const players = useStore((s) => s.state.game?.players) || {};
  const currentPlayer = useStore((s) => s.state.game?.players[s.currentPlayer.id]);
  const territoryOwnership = useStore((s) => s.state.game?.territoryOwnership) || {};
  const currentMap = useMapStore((s) => s.current_map);

  const existingTrade = tradeId ? activeTrades[tradeId] : null;

  // Edit states
  const [leftMoney, setLeftMoney] = useState(0);
  const [rightMoney, setRightMoney] = useState(0);
  const [leftGiveCards, setLeftGiveCards] = useState<string[]>([]);
  const [rightGiveCards, setRightGiveCards] = useState<string[]>([]);
  const [leftGiveTerritories, setLeftGiveTerritories] = useState<string[]>([]);
  const [rightGiveTerritories, setRightGiveTerritories] = useState<string[]>([]);

  const sendProposeTrade = useStore((s) => s.sendProposeTrade);
  const sendAcceptTrade = useStore((s) => s.sendAcceptTrade);
  const sendDeclineTrade = useStore((s) => s.sendDeclineTrade);
  const sendCancelTrade = useStore((s) => s.sendCancelTrade);

  if (!isOpen) return null;

  const handlePropose = () => {
    if (!targetPlayerId) return;
    sendProposeTrade({
      targetPlayerId,
      offer: {
        playerAGivesCash: leftMoney,
        playerBGivesCash: rightMoney,
        playerAGivesCards: leftGiveCards,
        playerBGivesCards: rightGiveCards,
        playerAGivesTerritories: leftGiveTerritories,
        playerBGivesTerritories: rightGiveTerritories,
      }
    });
    onClose();
  };

  const isViewMode = !!existingTrade;
  
  // Resolve players
  const pA = isViewMode ? players[existingTrade.playerAId] : currentPlayer;
  const pB = isViewMode ? players[existingTrade.playerBId] : (targetPlayerId ? players[targetPlayerId] : null);

  if (!isViewMode && !targetPlayerId) {
    const otherPlayers = Object.values(players).filter((p: any) => p.id !== currentPlayer.id);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-sm">
        <div className="w-full max-w-[400px] bg-[#161320] rounded-[24px] shadow-2xl relative flex flex-col pt-6 pb-8 px-6 border border-white/5">
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <h2 className="text-center text-[#9da2cd] text-lg font-medium mb-6">Create a trade</h2>
          <p className="text-center text-zinc-300 mb-6">Select a player to trade with:</p>
          <div className="flex flex-col gap-3">
            {otherPlayers.map((p: any) => (
              <button
                key={p.id}
                onClick={() => setTargetPlayerId(p.id)}
                className="flex items-center justify-center gap-3 w-full bg-[#2b253b]/80 hover:bg-[#3d3455] py-4 rounded-xl transition-colors border border-transparent hover:border-white/10"
              >
                <img src={AvatarColorMap[p.color] || "/avatars/red_round.svg"} className="w-6 h-6 rounded-full bg-zinc-800" alt="" />
                <span className="text-white font-medium">{p.name}</span>
              </button>
            ))}
            {otherPlayers.length === 0 && (
              <p className="text-center text-zinc-500">No other players available.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!pA || !pB) return null;

  const leftMaxMoney = pA.money || 0;
  const rightMaxMoney = pB.money || 0;

  // View mode values vs Edit mode values
  const displayLeftMoney = isViewMode ? existingTrade.offer.playerAGivesCash : leftMoney;
  const displayRightMoney = isViewMode ? existingTrade.offer.playerBGivesCash : rightMoney;
  const displayLeftTerritories = isViewMode ? existingTrade.offer.playerAGivesTerritories : leftGiveTerritories;
  const displayRightTerritories = isViewMode ? existingTrade.offer.playerBGivesTerritories : rightGiveTerritories;
  const displayLeftCards = isViewMode ? existingTrade.offer.playerAGivesCards : leftGiveCards;
  const displayRightCards = isViewMode ? existingTrade.offer.playerBGivesCards : rightGiveCards;

  // Helper to extract items owned
  const getOwnedTerritories = (pId: string) => {
    if (!currentMap) return [];
    return currentMap.territories.filter((t: any) => territoryOwnership[t.id]?.ownerId === pId);
  };
  
  const getOwnedCards = (pId: string) => {
    const p = players[pId];
    if (!p || !p.cards) return [];
    return p.cards.map((c: string) => {
      try { return { id: c, ...JSON.parse(c) as RewardConfig }; } catch { return null; }
    }).filter(Boolean);
  };

  const leftOwnedTerritories = getOwnedTerritories(pA.id);
  const leftOwnedCards = getOwnedCards(pA.id);
  const rightOwnedTerritories = getOwnedTerritories(pB.id);
  const rightOwnedCards = getOwnedCards(pB.id);

  const getSliderStyle = (value: number, max: number) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return {
      background: `linear-gradient(to right, #7348e9 0%, #7348e9 ${percentage}%, #2b253b ${percentage}%, #2b253b 100%)`,
    };
  };

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (isViewMode) return;
    if (list.includes(item)) setList(list.filter((i) => i !== item));
    else setList([...list, item]);
  };

  const renderPlayerColumn = (
    player: any,
    maxMoney: number,
    money: number,
    setMoney: (v: number) => void,
    ownedTerritories: any[],
    giveTerritories: string[],
    setGiveTerritories: (v: string[]) => void,
    ownedCards: any[],
    giveCards: string[],
    setGiveCards: (v: string[]) => void
  ) => (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
      <div className="flex items-center gap-3 self-center mb-5 shrink-0">
        <img src={AvatarColorMap[player.color] || "/avatars/red_round.svg"} className="w-6 h-6 rounded-full bg-zinc-800" alt="" />
        <span className="text-white font-medium text-lg">{player.name}</span>
      </div>

      <div className="w-full flex flex-col mb-4 shrink-0">
        <div className="relative w-full h-2 rounded-full mb-2">
          {!isViewMode ? (
            <input
              type="range"
              min="0"
              max={maxMoney}
              value={money}
              onChange={(e) => setMoney(Number(e.target.value))}
              className="w-full h-1.5 rounded-full outline-none absolute top-1/2 -translate-y-1/2 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              style={getSliderStyle(money, maxMoney)}
            />
          ) : (
            <div className="w-full h-1.5 rounded-full absolute top-1/2 -translate-y-1/2" style={getSliderStyle(money, maxMoney)}></div>
          )}
        </div>
        
        <div className="flex justify-between w-full text-[11px] text-[#6e728d] font-medium px-1">
          <span>0</span>
          <span>{maxMoney}</span>
        </div>

        <div className="self-center mt-2">
          <div className="bg-[#7348e9] text-white px-5 py-1 rounded-full text-sm font-medium shadow-[0_2px_10px_rgba(115,72,233,0.3)]">
            {money} $
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {ownedTerritories.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Territories</h4>
            <div className="space-y-2">
              {ownedTerritories.map((t: any) => {
                const isSelected = giveTerritories.includes(t.id);
                if (isViewMode && !isSelected) return null;
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleItem(giveTerritories, setGiveTerritories, t.id)}
                    className={`flex items-center justify-between border rounded-[12px] p-2 px-3 transition-colors ${isSelected ? 'border-[#7348e9] bg-[#7348e9]/10' : 'border-[#2b253b] bg-[#14121b]/50'} ${!isViewMode && 'cursor-pointer hover:border-[#4d3b8e]'}`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <MapPin size={14} className={isSelected ? 'text-[#7348e9]' : 'text-zinc-500'} />
                      <span className="text-zinc-200 font-medium text-sm truncate">{t.name}</span>
                    </div>
                    {!isViewMode && (
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isSelected ? 'bg-[#7348e9] text-white' : 'bg-[#2b253b] text-transparent'}`}>
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {ownedCards.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Cards</h4>
            <div className="space-y-2">
              {ownedCards.map((c: any, i: number) => {
                 const isSelected = giveCards.includes(c.id);
                 if (isViewMode && !isSelected) return null;
                 return (
                   <div
                     key={`card-${i}`}
                     onClick={() => toggleItem(giveCards, setGiveCards, c.id)}
                     className={`flex flex-col border rounded-[12px] p-2 px-3 transition-colors ${isSelected ? 'border-[#7348e9] bg-[#7348e9]/10' : 'border-[#2b253b] bg-[#14121b]/50'} ${!isViewMode && 'cursor-pointer hover:border-[#4d3b8e]'}`}
                   >
                     <div className="flex items-center justify-between mb-0.5">
                       <span className="text-zinc-200 font-medium text-[13px]">{c.ui?.title || 'Card'}</span>
                       {!isViewMode && (
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isSelected ? 'bg-[#7348e9] text-white' : 'bg-[#2b253b] text-transparent'}`}>
                          <Check size={10} strokeWidth={3} />
                        </div>
                       )}
                     </div>
                     <span className="text-[11px] text-zinc-400 max-w-[90%] truncate block">{c.ui?.subtitle || 'Mystery effect'}</span>
                   </div>
                 );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-sm">
      <div className="w-full max-w-[700px] h-[80vh] max-h-[700px] bg-[#161320] rounded-[24px] shadow-2xl relative flex flex-col pt-6 pb-6 px-6 sm:px-8 border border-white/5">
        
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-[#1f1a2e] text-zinc-400 rounded-full flex items-center justify-center hover:bg-[#2b253b] hover:text-white transition-colors border border-transparent hover:border-white/10 z-10">
          <X size={18} />
        </button>

        <h2 className="text-center text-[#9da2cd] text-lg font-medium mb-4 shrink-0">
          {isViewMode ? "Trade Proposal" : "Create a trade"}
        </h2>

        <div className="relative flex justify-between items-stretch gap-4 sm:gap-6 flex-1 min-h-0 overflow-hidden">
          {renderPlayerColumn(
            pA, leftMaxMoney, displayLeftMoney, setLeftMoney,
            leftOwnedTerritories, displayLeftTerritories, setLeftGiveTerritories,
            leftOwnedCards, displayLeftCards, setLeftGiveCards
          )}

          <div className="w-8 shrink-0 bg-[#1c1828] rounded-full flex flex-col items-center pt-2 pb-6 relative z-10 mt-6 mb-6 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
            <div className="text-[#8a8d9b] mt-auto mb-auto">
              <ArrowLeftRight size={16} strokeWidth={2.5} />
            </div>
          </div>

          {renderPlayerColumn(
            pB, rightMaxMoney, displayRightMoney, setRightMoney,
            rightOwnedTerritories, displayRightTerritories, setRightGiveTerritories,
            rightOwnedCards, displayRightCards, setRightGiveCards
          )}
        </div>

        <div className="flex items-center justify-center mt-5 shrink-0">
          {!isViewMode ? (
            <button onClick={handlePropose} className="bg-[#8254e8] hover:bg-[#7348e9] text-white px-8 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors shadow-[0_4px_15px_rgba(130,84,232,0.3)] min-w-[200px]">
              <Send size={16} className="rotate-45 -mt-0.5" />
              <span>Send trade</span>
            </button>
          ) : (
            <div className="flex gap-4">
               {existingTrade.status === "pending" && currentPlayer.id === existingTrade.playerBId && (
                 <>
                   <button onClick={() => { sendAcceptTrade(existingTrade.id); onClose(); }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors shadow-lg shadow-emerald-900/20">
                     <Check size={16} />
                     <span>Accept</span>
                   </button>
                   <button onClick={() => { sendDeclineTrade(existingTrade.id); onClose(); }} className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors shadow-lg shadow-rose-900/20">
                     <XCircle size={16} />
                     <span>Decline</span>
                   </button>
                 </>
               )}
               {existingTrade.status === "pending" && currentPlayer.id === existingTrade.playerAId && (
                 <button onClick={() => { sendCancelTrade(existingTrade.id); onClose(); }} className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors shadow-lg shadow-rose-900/20">
                    <XCircle size={16} />
                    <span>Cancel Trade</span>
                 </button>
               )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
