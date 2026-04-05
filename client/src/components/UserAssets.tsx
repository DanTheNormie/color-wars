import { memo, useMemo } from "react";
import { useStore } from "@/stores/sessionStore";
import { useMapStore } from "@/stores/mapStateStore";
import { MapPinCheckInside } from "lucide-react";

const UserAssets = () => {
  const playerId = useStore((s) => s.currentPlayer?.id);
  const territoryOwnership = useStore((s) => s.state.game?.territoryOwnership);
  const currentMap = useMapStore((s) => s.current_map);
  const roomPhase = useStore((s) => s.state.room?.phase);

  const ownedTerritories = useMemo(() => {
    if (!territoryOwnership || !currentMap || !playerId) return [];

    return currentMap.territories
      .filter((t) => territoryOwnership[t.id]?.ownerId === playerId)
      .map((t) => ({
        id: t.id,
        name: t.name,
        buildingType: territoryOwnership[t.id].buildingType,
      }));
  }, [territoryOwnership, currentMap, playerId]);

  // const cards = useMemo(() => {
  //   if (!playerCards) return [];

  //   return playerCards.map((cardJson) => {
  //     try {
  //       return JSON.parse(cardJson) as RewardConfig;
  //     } catch (e) {
  //       //console.log("Failed to parse card JSON", e);
  //       return null;
  //     }
  //   }).filter(Boolean) as RewardConfig[];
  // }, [playerCards]);


  if (roomPhase !== "active") return null;

  return (
    <div className="mt-4 flex w-full flex-col bg-secondary rounded-lg p-4 gap-4">
      {/* Territories Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center w-full justify-center gap-2 pb-1">
          <MapPinCheckInside className="h-4 w-4" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Territories ({ownedTerritories.length})</h3>
        </div>

        {ownedTerritories.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ownedTerritories.map((t) => (
              <div
                key={t.id}
                className="group flex flex-col rounded-lg border border-white/5 bg-white/5 p-2 transition-all hover:bg-white/10 hover:border-white/20"
              >
                <span className="truncate text-sm font-medium text-zinc-200">{t.name}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-tight">
                  {t.buildingType === "BASE" ? "Territory" : t.buildingType.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-2 text-center text-xs italic text-zinc-600">No territories owned yet.</p>
        )}
      </div>

      {/* Cards Section */}
      {/* <div className="flex flex-col gap-2">
        <div className="flex items-center w-full justify-center gap-2 pb-1">
          <Spade className="h-4 w-4"/>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Inventory Cards ({cards.length})</h3>
        </div>
        
        {cards.length > 0 ? (
          <div className="flex flex-col gap-2">
            {cards.map((card, idx) => (
              <div 
                key={`${card.type}-${idx}`} 
                className="flex items-centerjustify-between rounded-lg border border-white/5 bg-white/5 p-3 transition-all hover:bg-white/10"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{card.ui.title}</span>
                  <span className="text-[11px] leading-tight text-zinc-400">{card.ui.subtitle}</span>
                </div>
                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 text-lg">
                  {card.type === 'INSTANT_CASH' ? '💰' : '🃏'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-2 text-center text-xs italic text-zinc-600">You don't have any cards yet.</p>
        )}
      </div> */}
    </div>
  );
};

export default memo(UserAssets);
