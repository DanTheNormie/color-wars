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
import "./TerritoryTooltip.css";

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
        className="territory-tooltip"
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
        <div className="territory-tooltip__header">
          <span className="territory-tooltip__name">{territory.name}</span>
          {ownerId && (
            <span
              className="territory-tooltip__owner"
              style={{ color: ownerPlayer?.color ?? "#888" }}
            >
              {isOwnedByCurrentPlayer ? "You" : ownerPlayer?.name ?? "Unknown"}
            </span>
          )}
        </div>

        {/* ── Unowned: show base cost + per round, then Buy button ── */}
        {!ownerId && economy && (
          <>
            <div className="territory-tooltip__economy">
              <div className="territory-tooltip__stat">
                <span className="territory-tooltip__stat-label">Cost</span>
                <span className="territory-tooltip__stat-value">{baseCost}</span>
              </div>
              <div className="territory-tooltip__divider" />
              <div className="territory-tooltip__stat">
                <span className="territory-tooltip__stat-label">Per Round</span>
                <span
                  className="territory-tooltip__stat-value"
                  style={{ color: baseIncome >= 0 ? "#4ade80" : "#f87171" }}
                >
                  {baseIncome >= 0 ? "+" : ""}
                  {fmt.format(baseIncome)}
                </span>
              </div>
            </div>
            <div className="territory-tooltip__actions">
              <button
                className="territory-tooltip__btn territory-tooltip__btn--buy"
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
            <div className="territory-tooltip__economy">
              <div className="territory-tooltip__stat">
                <span className="territory-tooltip__stat-label">Per Round</span>
                <span
                  className="territory-tooltip__stat-value"
                  style={{ color: baseIncome >= 0 ? "#4ade80" : "#f87171" }}
                >
                  {baseIncome >= 0 ? "+" : ""}
                  {fmt.format(baseIncome)}
                </span>
              </div>
            </div>

            {/* Upgrade buttons row */}
            <div className="territory-tooltip__upgrades">
              {UPGRADE_TIERS.map((tier) => (
                <button
                  key={tier}
                  className="territory-tooltip__upgrade-btn"
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
            <div className="territory-tooltip__upgrade-costs">
              {UPGRADE_TIERS.map((tier) => (
                <span key={tier} className="territory-tooltip__upgrade-cost">
                  {fmt.format(economy[tier].capEx)}
                </span>
              ))}
            </div>

            {/* Sell button */}
            <div className="territory-tooltip__actions territory-tooltip__actions--sell">
              <button
                className="territory-tooltip__btn territory-tooltip__btn--sell"
                onClick={handleSell}
              >
                Sell
              </button>
            </div>
          </>
        )}

        {/* ── Owned by another player ── */}
        {ownerId && !isOwnedByCurrentPlayer && (
          <span className="territory-tooltip__owned-label">
            Owned by {ownerPlayer?.name ?? "Unknown"}
          </span>
        )}
      </div>
    </FloatingPortal>
  );
}
