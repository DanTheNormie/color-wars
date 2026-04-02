import { useState, useEffect } from "react";
import { X, Target, Rocket, AlertTriangle } from "lucide-react";
import { useStore } from "@/stores/sessionStore";
import { useMapStore } from "@/stores/mapStateStore";
import { getAdjacent } from "@/utils/map-utils";
import { createPortal } from "react-dom";

type MissileLaunchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function MissileLaunchModal({ isOpen, onClose }: MissileLaunchModalProps) {
  const gameState = useStore((s) => s.state.game);
  const currentPlayerId = useStore((s) => s.currentPlayer.id);
  const sendLaunchMissile = useStore((s) => (s as any).sendLaunchMissile);
  const currentMap = useMapStore((s) => s.current_map);
  const setMissileSource = useMapStore((s) => s.setMissileSource);
  const setMissileTargets = useMapStore((s) => s.setMissileTargets);

  const [selectedSilo, setSelectedSilo] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  // Sync board highlights
  useEffect(() => {
    if (isOpen) {
      setMissileSource(selectedSilo);
      if (selectedSilo) {
        const targets = getAdjacent(selectedSilo, currentMap).filter(
          tid => gameState?.territoryOwnership[tid]?.ownerId !== currentPlayerId
        );
        setMissileTargets(targets);
      } else {
        setMissileTargets([]);
      }
    } else {
      setMissileSource(null);
      setMissileTargets([]);
    }
  }, [isOpen, selectedSilo, currentMap, currentPlayerId, gameState?.territoryOwnership, setMissileSource, setMissileTargets]);

  if (!isOpen || !gameState) return null;

  const playerState = gameState.players[currentPlayerId];
  if (!playerState) return null;

  const territoryOwnership = gameState.territoryOwnership;
  const currentRound = gameState.currentRound;

  // Filter silos: Owned by player, build before current round, and player hasn't launched yet
  const siloTerritories = Object.entries(territoryOwnership)
    .filter(([_, state]: [string, any]) => 
      state.ownerId === currentPlayerId && 
      state.buildingType === "MISSILE_SILO" &&
      (state.missileSiloBuiltRound === undefined || state.missileSiloBuiltRound < currentRound)
    )
    .map(([id]) => id);

  const canLaunch = !playerState.hasLaunchedMissileThisRound && siloTerritories.length > 0;

  // Potential targets: Adjacent to selected silo, NOT owned by current player
  const potentialTargets = selectedSilo 
    ? getAdjacent(selectedSilo, currentMap)//.filter(tid => territoryOwnership[tid]?.ownerId !== currentPlayerId)
    : [];

  const handleLaunch = () => {
    if (selectedSilo && selectedTarget) {
      sendLaunchMissile(selectedSilo, selectedTarget);
      onClose();
      // Reset state for next time
      setSelectedSilo(null);
      setSelectedTarget(null);
    }
  };

  const getTerritoryName = (id: string) => {
    const t = currentMap.territories.find((t) => t.id === id);
    return t ? t.name : id;
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-sm">
      <div className="w-full max-w-[450px] bg-[#161320] rounded-[24px] shadow-2xl relative flex flex-col pt-6 pb-8 px-6 border border-white/5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-center text-[#9da2cd] text-lg font-medium mb-2 flex items-center justify-center gap-2">
          <Rocket size={20} className="text-orange-500" />
          Missile Strike
        </h2>

        {!canLaunch ? (
          <div className="text-center p-6">
            <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4 opacity-50" />
            <p className="text-zinc-400 text-sm">
              {playerState.hasLaunchedMissileThisRound 
                ? "You have already launched a missile this round." 
                : "You do not own any operational Missile Silos (built in previous rounds)."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 mt-4">
            {/* Step 1: Select Silo */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                1. Select Launch Site
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {siloTerritories.map((tid) => (
                  <button
                    key={tid}
                    onClick={() => {
                      setSelectedSilo(tid);
                      setSelectedTarget(null);
                    }}
                    className={`flex items-center justify-between w-full py-3 px-4 rounded-xl transition-all border ${
                      selectedSilo === tid
                        ? "bg-orange-500/10 border-orange-500/50 text-orange-200"
                        : "bg-[#2b253b]/50 border-white/5 text-zinc-300 hover:bg-[#2b253b] hover:border-white/10"
                    }`}
                  >
                    <span className="text-sm font-medium">{getTerritoryName(tid)}</span>
                    {selectedSilo === tid && <Target size={14} className="text-orange-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Target */}
            <div className={!selectedSilo ? "opacity-30 pointer-events-none" : ""}>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                2. Select Target Territory
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {potentialTargets.map((tid) => (
                  <button
                    key={tid}
                    onClick={() => setSelectedTarget(tid)}
                    className={`flex items-center justify-between w-full py-3 px-4 rounded-xl transition-all border ${
                      selectedTarget === tid
                        ? "bg-rose-500/10 border-rose-500/50 text-rose-200"
                        : "bg-[#2b253b]/50 border-white/5 text-zinc-300 hover:bg-[#2b253b] hover:border-white/10"
                    }`}
                  >
                    <span className="text-sm font-medium">{getTerritoryName(tid)}</span>
                    {selectedTarget === tid && <Target size={14} className="text-rose-500" />}
                  </button>
                ))}
                {selectedSilo && potentialTargets.length === 0 && (
                  <p className="text-center text-zinc-600 text-xs py-4">
                    No valid targets adjacent to this silo.
                  </p>
                )}
              </div>
            </div>

            {/* Launch Button */}
            <button
              disabled={!selectedSilo || !selectedTarget}
              onClick={handleLaunch}
              className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all mt-2 ${
                selectedSilo && selectedTarget
                  ? "bg-linear-to-r from-orange-600 to-rose-600 text-white shadow-lg shadow-orange-900/20 hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              Confirm Launch
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
