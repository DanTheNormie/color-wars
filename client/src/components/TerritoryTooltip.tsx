import { useState, useEffect, useCallback } from "react";
import {
  useFloating,
  autoUpdate,
  flip,
  shift,
  offset,
  arrow,
  useDismiss,
  useInteractions,
  FloatingArrow,
  FloatingPortal,
} from "@floating-ui/react";
import { useTooltipStore } from "@/stores/tooltipStore";
import { useMapStore } from "@/stores/mapStateStore";
import { useStore } from "@/stores/sessionStore";
import { getAdjacent, getAdjacentOwnedByPlayer } from "@/utils/map-utils";
import type { DevelopmentType } from "@color-wars/shared";
/* ─── Number formatter ─── */
const fmt = new Intl.NumberFormat("en", {
  notation: "compact",
  compactDisplay: "short",
});

/* ─── UI config ─── */
const UPGRADES = [
  { id: "BASE", label: "without upgrade", icon: null, key: "BASE" },
  { id: "CITY", label: "with City", icon: "/building-icons/city.svg", key: "CITY" },
  { id: "FACTORY", label: "with Factory", icon: "/building-icons/factory.svg", key: "FACTORY" },
  { id: "MISSILE_SILO", label: "with Missile Silo", icon: "/building-icons/missile.svg", key: "MISSILE_SILO" },
  { id: "CAPITAL_MONUMENT", label: "with Capital Monument", icon: "/building-icons/monument.svg", key: "CAPITAL_MONUMENT" },
];

const SELL_LABELS: Record<string, string> = {
  BASE: "Territory",
  CITY: "City",
  FACTORY: "Factory",
  MISSILE_SILO: "Missile Silo",
  CAPITAL_MONUMENT: "Capital Monument",
};

/* ─── Tooltip Component ─── */
export default function TerritoryTooltip() {
  const [arrowEl, setArrowEl] = useState<SVGSVGElement | null>(null);

  /* ── Tooltip store ── */
  const isOpen = useTooltipStore((s) => s.isOpen);
  const screenX = useTooltipStore((s) => s.x);
  const screenY = useTooltipStore((s) => s.y);
  const territoryId = useTooltipStore((s) => s.territoryId);
  const closeTooltip = useTooltipStore((s) => s.closeTooltip);

  /* ── Map data ── */
  const currentMap = useMapStore((s) => s.current_map);
  const getEconomyData = useMapStore((s) => s.getEconomyData);
  const selectedTerritoryId = useMapStore((s) => s.selectedTerritoryId);

  /* ── Session data (re-reads reactively after buy/sell) ── */
  const buyTerritory = useStore((s) => s.buyTerritory);
  const sellTerritory = useStore((s) => s.sellTerritory);
  const upgradeTerritory = useStore((s) => s.sendUpgradeTerritoryIntent);
  const downgradeTerritory = useStore((s) => s.sendDowngradeTerritoryIntent);
  const territoryOwnership = useStore((s) => s.state.game?.territoryOwnership);
  const players = useStore((s) => s.state.game?.players);
  const currentPlayerId = useStore((s) => s.currentPlayer?.id);
  const phase = useStore((s) => s.state.room.phase);


  const adjacentTerritories = getAdjacent(territoryId, currentMap);
  const adjacentOwnedByPlayer = getAdjacentOwnedByPlayer(currentPlayerId, territoryId, currentMap, territoryOwnership);
  /* ── Floating UI setup ── */
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) closeTooltip();
    },
    middleware: [
      offset(12),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      arrow({ element: arrowEl }),
    ],
    placement: "top",
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    refs.setReference({
      getBoundingClientRect: () => ({
        x: screenX,
        y: screenY,
        width: 0,
        height: 0,
        top: screenY,
        left: screenX,
        right: screenX,
        bottom: screenY,
      }),
    });
  }, [screenX, screenY, refs]);

  const dismiss = useDismiss(context, {
    outsidePress: true,
    outsidePressEvent: "pointerdown",
  });

  const { getFloatingProps } = useInteractions([dismiss]);

  const setFloatingRef = useCallback(
    (node: HTMLDivElement | null) => {
      refs.setFloating(node);
    },
    [refs],
  );

  /* ── Derived data ── */
  const tid = territoryId ?? selectedTerritoryId;
  const territory = currentMap?.territories?.find((t) => t.id === tid);
  const ownership = tid ? territoryOwnership?.[tid] : null;
  const ownerId = ownership?.ownerId ?? null;
  const ownerPlayer = ownerId ? players?.[ownerId] : null;
  const isOwnedByCurrentPlayer = ownerId != null && ownerId === currentPlayerId;

  // Ownership building logic
  const buildingType = ownership ? (ownership as any).buildingType ?? "BASE" : "BASE";
  const sellLabel = SELL_LABELS[buildingType] || "Territory";

  let economy: ReturnType<typeof getEconomyData> | null = null;
  try {
    if (tid && selectedTerritoryId) {
      economy = getEconomyData();
    }
  } catch {
    economy = null;
  }

  /* ── Handlers (no dismiss on buy/sell — tooltip stays open) ── */
  const handleBuy = useCallback(() => {
    if (tid) buyTerritory(tid);
  }, [tid, buyTerritory]);

  const handleSell = useCallback(() => {
    if (tid) {
      sellTerritory(tid);
      closeTooltip();
    }
  }, [tid, sellTerritory, closeTooltip]);

  const handleUpgrade = useCallback((type: DevelopmentType) => {
    if (tid) upgradeTerritory(tid, type);
  }, [tid, upgradeTerritory]);

  const handleDowngrade = useCallback(() => {
    if (tid) downgradeTerritory(tid);
  }, [tid, downgradeTerritory]);

  /* ── Don't render if closed ── */
  if (!isOpen || !territory) return null;

  const baseCost = economy ? fmt.format(economy.BASE.capEx) : "—";

  // Try to determine sell value roughly as half capEx. If not applicable, blank.
  const capExObj = economy ? economy[buildingType as keyof typeof economy] : null;
  const sellValue = (capExObj && buildingType !== "CAPITAL_MONUMENT")
    ? fmt.format((capExObj as any).capEx / 2)
    : "";

  if(phase !== 'active') {return null}
  return (
    <FloatingPortal>
      <div
        ref={setFloatingRef}
        style={floatingStyles}
        {...getFloatingProps()}
        className="z-9999 bg-[#1c1c1e] border border-[#3a3a3c] rounded-xl p-4 w-[240px] shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)] text-[#f5f5f7] pointer-events-auto"
      >
        <FloatingArrow
          ref={setArrowEl}
          context={context}
          fill="#1c1c1e"
          strokeWidth={1}
          stroke="#3a3a3c"
          width={14}
          height={7}
        />

        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col gap-1 items-start mt-[-2px]">
            <span className="text-[17px] font-medium tracking-[0.01em] text-white whitespace-nowrap overflow-hidden text-ellipsis">
              {territory.name}
            </span>
            {isOwnedByCurrentPlayer && (
              <div
                className="bg-[#c22d2d] text-white text-[9px] font-semibold px-[5px] py-[2px] rounded uppercase cursor-pointer hover:bg-[#dc2626] transition-colors"
                onClick={handleSell}
              >
                Sell {sellLabel} {sellValue ? `for ${sellValue}` : ""}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end shrink-0 gap-[16px]">
            {ownerId ? (
              <span className="text-[10px] text-[#a1a1aa]">
                Owned by{" "}
                <span className="font-medium" style={{ color: ownerPlayer?.color ?? "#fff" }}>
                  {isOwnedByCurrentPlayer ? "You" : ownerPlayer?.name ?? "Unknown"}
                </span>
              </span>
            ) : (
              <span className="text-[10px] text-[#a1a1aa] h-[15px]" />
            )}
            <span className="text-[10px] text-[#8e8e93]">per round</span>
          </div>
        </div>

        {/* ── Economy Stats List ── */}
        {economy && (
          <div className="flex flex-col gap-[8px] mb-4 mt-1">
            {UPGRADES.map((upgrade) => {
              let valStr = "???";
              let color = "#8e8e93";
              if (upgrade.id !== "CAPITAL_MONUMENT" && economy) {
                const layer = economy[upgrade.key as keyof typeof economy] as any;
                if (layer) {
                  const val = layer.revenue - layer.opEx;
                  valStr = (val >= 0 ? "+" : "") + fmt.format(val);
                  color = val >= 0 ? "#4ade80" : "#f87171";
                  if (val === 0) {
                    color = "#f5f5f7";
                    valStr = "0";
                  }
                }
              }

              return (
                <div key={upgrade.id} className="flex justify-between items-center text-[12px]">
                  <div className="flex items-center gap-[6px] text-[#e5e5ea]">
                    {upgrade.label}
                    {/* {upgrade.icon && (
                      <img src={upgrade.icon} alt="" className="w-4 h-4 invert opacity-80" />
                    )} */}
                  </div>
                  <span className="font-medium" style={{ color }}>{valStr}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div>
          {!ownerId ? (
            <button
              className="w-[80%] mx-auto block py-[8px] rounded-[4px] text-[11px] font-semibold cursor-pointer transition-all duration-150 hover:bg-[#22c55e] active:scale-[0.97] bg-[#16a34a] text-white"
              onClick={handleBuy}
            >
              Purchase Territory for {baseCost}
            </button>
          ) : isOwnedByCurrentPlayer ? (
            (adjacentOwnedByPlayer.length < adjacentTerritories.length) ? (
              (adjacentOwnedByPlayer.length === 0) ? (
                <div className="flex gap-2 justify-center text-[10px] text-[#f87171] text-center w-full">
                  {adjacentTerritories.length === 1
                    ? "you need to own the adjacent territory to upgrade"
                    : `you need to own all ${adjacentTerritories.length} adjacent territories to upgrade`}
                </div>
              ) : (
                <div className="flex gap-2 justify-center text-[10px] text-[#f87171] text-center w-full">
                  {adjacentTerritories.length - adjacentOwnedByPlayer.length === 1
                    ? "purchase the last adjacent territory to upgrade"
                    : `purchase remaining ${adjacentTerritories.length - adjacentOwnedByPlayer.length} adjacent territories to upgrade`}
                </div>
              )
            ) : (
              buildingType === "BASE" ? (
                <div className="flex gap-2 justify-between">
                  <button
                    className="py-[6px] px-2 rounded text-[10px] font-semibold text-white cursor-pointer hover:bg-[#22c55e] active:scale-[0.97] bg-[#16a34a]"
                    onClick={() => handleUpgrade("CITY")}
                  >
                    Build City
                  </button>
                  <button
                    className="py-[6px] px-2 rounded text-[10px] font-semibold text-white cursor-pointer hover:bg-[#22c55e] active:scale-[0.97] bg-[#16a34a]"
                    onClick={() => handleUpgrade("FACTORY")}
                  >
                    Build Factory
                  </button>
                  <button
                    className="py-[6px] px-2 rounded text-[10px] font-semibold text-white cursor-pointer hover:bg-[#22c55e] active:scale-[0.97] bg-[#16a34a]"
                    onClick={() => handleUpgrade("MISSILE_SILO")}
                  >
                    Build Missile Silo
                  </button>
                </div>
              ) : (
                <button
                  className="w-[80%] mx-auto block py-[8px] rounded-[4px] text-[11px] font-semibold text-white cursor-pointer transition-all duration-150 hover:bg-[#ca8a04] active:scale-[0.97] bg-[#eab308]"
                  onClick={handleDowngrade}
                >
                  Downgrade to BASE (50% refund)
                </button>
              )
            )
          ) : null}
        </div>

        {/* ── Footer Icons & Prices ── */}
        <div className="flex justify-between items-center pt-3 mt-1 border-none gap-2 px-1">
          {[
            { id: "CITY", icon: "/building-icons/city.svg" },
            { id: "FACTORY", icon: "/building-icons/factory.svg" },
            { id: "MISSILE_SILO", icon: "/building-icons/missile.svg" },
            { id: "CAPITAL_MONUMENT", icon: "/building-icons/monument.svg" },
          ].map((item) => {
            let priceStr = "???";
            if (item.id !== "CAPITAL_MONUMENT" && economy) {
              const layer = economy[item.id as keyof typeof economy] as any;
              if (layer) {
                priceStr = fmt.format(layer.capEx);
              }
            }
            return (
              <div key={item.id} className="flex flex-col items-center gap-[6px] flex-1">
                <img src={item.icon} alt={item.id} className="w-5 h-5 opacity-80 object-contain" />
                <span className="text-[10px] text-[#8e8e93] font-medium h-[15px]">{priceStr}</span>
              </div>
            );
          })}
        </div>
      </div>
    </FloatingPortal>
  );
}
