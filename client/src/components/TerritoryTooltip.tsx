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

/* ─── Upgrade tier labels ─── */
const UPGRADE_TIERS = ["CITY", "FACTORY", "MISSILE_SILO"] as const;
type UpgradeTier = (typeof UPGRADE_TIERS)[number];

const TIER_LABELS: Record<UpgradeTier, string> = {
  CITY: "City",
  FACTORY: "Factory",
  MISSILE_SILO: "Silo",
};

const TIER_COLORS: Record<UpgradeTier, string> = {
  CITY: "#5e5ce6",
  FACTORY: "#ff9f0a",
  MISSILE_SILO: "#ff453a",
};

/* ─── Number formatter ─── */
const fmt = new Intl.NumberFormat("en", {
  notation: "compact",
  compactDisplay: "short",
});

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
  const territoryOwnership = useStore((s) => s.state.game?.territoryOwnership);
  const players = useStore((s) => s.state.game?.players);
  const currentPlayerId = useStore((s) => s.currentPlayer?.id);

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

  /* ── Don't render if closed ── */
  if (!isOpen || !territory) return null;

  /* ── Economy values ── */
  const baseCost = economy ? fmt.format(economy.BASE.capEx) : "—";
  const baseIncome = economy ? economy.BASE.revenue - economy.BASE.opEx : 0;

  return (
    <FloatingPortal>
      <div
        ref={setFloatingRef}
        style={floatingStyles}
        {...getFloatingProps()}
        className="z-9999 bg-[#1c1c1e] border border-[#3a3a3c] rounded-xl py-3 px-[14px] min-w-[180px] max-w-[260px] shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)] text-[#f5f5f7] pointer-events-auto"
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
        <div className="flex justify-between items-baseline mb-2 gap-2">
          <span className="text-[14px] font-semibold tracking-[0.02em] whitespace-nowrap overflow-hidden text-ellipsis">{territory.name}</span>
          {ownerId && (
            <span
              className="text-[11px] font-medium shrink-0"
              style={{ color: ownerPlayer?.color ?? "#888" }}
            >
              {isOwnedByCurrentPlayer ? "You" : ownerPlayer?.name ?? "Unknown"}
            </span>
          )}
        </div>

        {/* ── Unowned: show base cost + per round, then Buy button ── */}
        {!ownerId && economy && (
          <>
            <div className="flex items-center gap-[10px] py-[6px] mb-2 border-y border-[#2a2a2c]">
              <div className="flex flex-col items-center flex-1">
                <span className="text-[10px] text-[#8e8e93] uppercase tracking-[0.06em]">Cost</span>
                <span className="text-[14px] font-semibold mt-[2px]">{baseCost}</span>
              </div>
              <div className="w-px h-[28px] bg-[#2a2a2c] shrink-0" />
              <div className="flex flex-col items-center flex-1">
                <span className="text-[10px] text-[#8e8e93] uppercase tracking-[0.06em]">Per Round</span>
                <span
                  className="text-[14px] font-semibold mt-[2px]"
                  style={{ color: baseIncome >= 0 ? "#4ade80" : "#f87171" }}
                >
                  {baseIncome >= 0 ? "+" : ""}
                  {fmt.format(baseIncome)}
                </span>
              </div>
            </div>
            <div className="flex gap-[6px]">
              <button
                className="flex-1 py-[6px] rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 hover:opacity-[0.85] active:scale-[0.96] bg-[#34c759] text-black"
                onClick={handleBuy}
              >
                Buy
              </button>
            </div>
          </>
        )}

        {/* ── Owned by current player: show per-round + upgrade tiers + sell ── */}
        {isOwnedByCurrentPlayer && economy && (
          <>
            {/* Per-round summary */}
            <div className="flex items-center gap-[10px] py-[6px] mb-2 border-y border-[#2a2a2c]">
              <div className="flex flex-col items-center flex-1">
                <span className="text-[10px] text-[#8e8e93] uppercase tracking-[0.06em]">Per Round</span>
                <span
                  className="text-[14px] font-semibold mt-[2px]"
                  style={{ color: baseIncome >= 0 ? "#4ade80" : "#f87171" }}
                >
                  {baseIncome >= 0 ? "+" : ""}
                  {fmt.format(baseIncome)}
                </span>
              </div>
            </div>

            {/* Upgrade buttons row */}
            <div className="flex gap-1 mb-[2px]">
              {UPGRADE_TIERS.map((tier) => (
                <button
                  key={tier}
                  className="flex-1 py-[6px] rounded-md text-[11px] font-semibold text-white cursor-pointer transition-all duration-150 hover:opacity-[0.85] active:scale-[0.96] text-center"
                  style={{ background: TIER_COLORS[tier] }}
                  onClick={() => {
                    // TODO: wire to upgrade message
                  }}
                >
                  {TIER_LABELS[tier]}
                </button>
              ))}
            </div>

            {/* Upgrade costs row */}
            <div className="flex gap-1 mb-2">
              {UPGRADE_TIERS.map((tier) => (
                <span key={tier} className="flex-1 text-center text-[10px] text-[#8e8e93] font-medium">
                  {fmt.format(economy[tier].capEx)}
                </span>
              ))}
            </div>

            {/* Sell button */}
            <div className="flex gap-[6px] mt-1">
              <button
                className="flex-1 py-[6px] rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 hover:opacity-[0.85] active:scale-[0.96] bg-[#ff453a] text-white"
                onClick={handleSell}
              >
                Sell
              </button>
            </div>
          </>
        )}

        {/* ── Owned by another player ── */}
        {ownerId && !isOwnedByCurrentPlayer && (
          <span className="block text-xs text-[#8e8e93] text-center w-full py-[6px] border-t border-[#2a2a2c] mt-1">
            Owned by {ownerPlayer?.name ?? "Unknown"}
          </span>
        )}
      </div>
    </FloatingPortal>
  );
}
