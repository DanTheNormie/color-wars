import { useState, useEffect, useRef, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useGameLogStore } from "@/stores/gameLogStore";
import { useStore } from "@/stores/sessionStore";
import { gsap } from "gsap";
import MarqueeImport from "react-fast-marquee";
import { cn } from "@/lib/utils";
import { AvatarColorMap } from "../Player";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { GameLogEntry } from "@/stores/gameLogStore";

const Marquee = (MarqueeImport as any).default || MarqueeImport;

// --- Subcomponents ---

const TerritoryInline = memo(({ territoryId }: { territoryId: string }) => {
  const formatted = territoryId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return <span className="font-bold">{formatted}</span>;
});
TerritoryInline.displayName = "TerritoryInline";

const PlayerInline = memo(({ playerId }: { playerId: string }) => {
  const color = useStore((z) => z.state.game.players?.[playerId]?.color) || "#64748b";
  const playerName = useStore((z) => z.state.game.players?.[playerId]?.name);
  const isYou = useStore((z) => z.currentPlayer?.id === playerId);

  const name = isYou ? "You" : playerName || playerId;

  return (
    <div className="flex w-fit items-center gap-2">
      <img className="h-[18px] w-[18px]" src={AvatarColorMap[color as keyof typeof AvatarColorMap] || AvatarColorMap["#64748b"]} alt="" />
      <span className="font-bold" style={{ color: color }}>
        {name}
      </span>
    </div>
  );
});
PlayerInline.displayName = "PlayerInline";

const LogMessageItem = memo(({ entry, className }: { entry: GameLogEntry; className?: string }) => {
  const currentId = useStore((s) => s.currentPlayer?.id);
  const diceTrack = useStore((s) => s.state.game.diceTrack);
  const payload = entry.payload;
  const logMessageStyle = cn("flex justify-center w-full gap-2 items-center text-white", className);
  switch (entry.type) {
    case "ROLL_DICE":
      return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> rolled <span className="font-bold text-blue-400">{payload.die1 + payload.die2}</span> 🎲 ({payload.die1} + {payload.die2})</div>;
    case "INCR_MONEY":
      return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> received <span className="text-green-500 font-bold">+${payload.amount?.toLocaleString()}</span> 💰</div>;
    case "DECR_MONEY":
      return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> paid <span className="text-red-500 font-bold">-${payload.amount?.toLocaleString()}</span> 💸</div>;
    case "BUY_TERRITORY":
      return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> bought <TerritoryInline territoryId={payload.territoryID} /> for ${payload.amount?.toLocaleString()} 🏠</div>;
    case "SELL_TERRITORY":
      return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> sold <TerritoryInline territoryId={payload.territoryID} /> for ${payload.amount?.toLocaleString()} 💸</div>;
    case "DRAW_3_REWARD_CARDS":
      return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> drew 3 reward cards.</div>;
    case "SELECT_CARD":{
      const card = JSON.parse(payload.selectedCardId);
      return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> selected a {card.ui.title} card.</div>;
    }
    case "ADD_CARD":
      return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> received a card.</div>;
    case "MOVE_PLAYER":{
      if (!diceTrack || diceTrack.length === 0) return <div className={logMessageStyle}> <PlayerInline playerId={entry.playerId} /> landed on a tile.</div>;
      const tile = diceTrack[payload.toTile % diceTrack.length];
      const tileName = tile.type.toLowerCase()
      return <div className={logMessageStyle}> <PlayerInline playerId={entry.playerId} /> landed on {tileName === "start" ? `the` : `a`} <span className="font-bold">{tileName}</span> tile📍</div>
    }
    case "SHIFT_TRACK":{
      const direction = payload.shiftDirection === "forward" ? "counter-clockwise" : "clockwise";
      const count = payload.newTiles?.length || 0;
      let message = ""
      if(count > 1){
        message = `The track shifted ${direction} 🌀. ${count} new tiles added `
      }else{
        message = `The track shifted ${direction} 🌀. New tile added `
      }
      return <div className={`${logMessageStyle} text-sm text-cyan-400 font-medium`}> {message}</div>
    }
    case "UPDATE_PLAYER_STATUS": {
      const status = payload.status;
      if (status === "bankrupt") {
        return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> has declared <span className="text-red-600 font-bold underline">bankruptcy</span>! ☠️</div>;
      }
      else if (status === "in-debt") {
        return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> is in <span className="text-orange-500 font-bold">debt</span>. ⚠️</div>;
      }
      return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> is now <span className="text-green-500 font-bold">solvent</span>. ✅</div>;
    }
    case 'FINANCIAL_CONSOLIDATION': {
      const collections = payload.collections as { [territoryID: string]: number };
      const collection = Object.values(collections || {}).reduce((acc:number, c:number) => acc + c, 0)
      
      if(collection > 0){
        return <div className={logMessageStyle}>
          <PlayerInline playerId={entry.playerId} /> collected <span className="text-green-600">${collection.toLocaleString()}</span> from Territories.
        </div>;
      }else if(collection < 0){
        return <div className={logMessageStyle}>
          <PlayerInline playerId={entry.playerId} /> paid <span className="text-red-600"> ${(-collection).toLocaleString()}</span> in Territory Maintenance.
        </div>;
      }else{
        return <div className={logMessageStyle}>
          <PlayerInline playerId={entry.playerId} /> had no Territory Income this round.
        </div>;
      }
    }
    case 'GAME_OVER': {
      const winnerId = payload.winnerId;
      const isYou = winnerId === currentId;
      return <div className={logMessageStyle}>
        <PlayerInline playerId={winnerId} /> {isYou ? "have" : "has"} won the game!
      </div>;
    }
    case 'VICTORY_LAP_STARTED': {
      const isYou = entry.playerId === currentId;
      return <div className={logMessageStyle}>
        <PlayerInline playerId={entry.playerId} /> {isYou ? "have" : "has"} started {isYou ? "your" : "their"} <span className="text-yellow-400">victory lap</span>!
      </div>;
    }
    case 'UPGRADE_TERRITORY': {
      const isYou = entry.playerId === currentId;
      const territoryID = payload.territoryID;
      const buildingType = payload.buildingType;
      const amount = payload.amount;
      return <div className={logMessageStyle}>
        <PlayerInline playerId={entry.playerId} /> {isYou ? "have" : "has"} upgraded <TerritoryInline territoryId={territoryID} /> to a {buildingType} for <span className="text-red-600">${amount.toLocaleString()}</span>.
      </div>;
    }
    case 'DOWNGRADE_TERRITORY': {
      const isYou = entry.playerId === currentId;
      const territoryID = payload.territoryID;
      const buildingType = payload.buildingType;
      const amount = payload.amount;
      return <div className={logMessageStyle}>
        <PlayerInline playerId={entry.playerId} /> {isYou ? "have" : "has"} downgraded <TerritoryInline territoryId={territoryID} /> to a {buildingType} for <span className="text-green-600">${amount.toLocaleString()}</span>.
      </div>;
    }
    case 'UPDATE_ACTIVE_PLAYER': {
      return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} />'s turn 🏁</div>;
    }
    case 'UPDATE_PLAYER_MONEY': {
      return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} />'s balance set to <span className="text-blue-400 font-bold">${payload.amount?.toLocaleString()}</span> 💰</div>;
    }
    case 'SABOTAGE': {
      const { victimId, amount } = payload;
      return <div className={logMessageStyle}>
        <PlayerInline playerId={entry.playerId} /> ⚡ sabotaged <PlayerInline playerId={victimId} /> for <span className="text-red-500">${amount.toLocaleString()}</span>!
      </div>;
    }
    case 'MISSILE_LAUNCHED': {
      const { targetTerritoryID } = payload;
      return <div className={logMessageStyle}>
        <PlayerInline playerId={entry.playerId} /> 🚀 nuked <TerritoryInline territoryId={targetTerritoryID} />!
      </div>;
    }
    case 'ACCEPT_TRADE': {
      const { playerAId, playerBId } = payload;
      const proposerId = playerAId === entry.playerId ? playerBId : playerAId;
      return <div className={logMessageStyle}>
        <PlayerInline playerId={entry.playerId} /> accepted a trade 🤝 created by <PlayerInline playerId={proposerId} />
      </div>;
    }
    case 'VOTE_TRACK_ROTATION': {
      const { vote } = payload;
      return <div className={logMessageStyle}>
        <PlayerInline playerId={entry.playerId} /> voted for <span className="font-bold text-yellow-400">{vote}</span> rotation 🔄
      </div>;
    }
    default:
      return <div className={logMessageStyle}>{`<!-- log for action type: "${entry.type}" not implemented -->`}</div>;
  }
});
LogMessageItem.displayName = "LogMessageItem";

export function LogTicker({ entry, isOpen }: { entry: GameLogEntry | null; isOpen: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeEntry, setActiveEntry] = useState<GameLogEntry | null>(entry);
  const [prevEntry, setPrevEntry] = useState<GameLogEntry | null>(null);

  if (entry !== activeEntry) {
    setPrevEntry(activeEntry);
    setActiveEntry(entry);
  }

  useEffect(() => {
    if (!containerRef.current || isOpen) return;

    if (activeEntry) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        if (prevEntry) {
          tl.to(".prev-msg", { y: -20, opacity: 0, duration: 0.3 }, 0);
        }

        tl.fromTo(
          ".active-msg",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4 },
          0
        );
      }, containerRef);

      return () => ctx.revert();
    }
  }, [activeEntry, prevEntry, isOpen]);

  if (!activeEntry && !prevEntry) {
    return (
      <div className="flex h-[24px] items-center justify-center w-full gap-3 opacity-80">
        <span className="text-sm font-medium"></span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-[24px] w-full overflow-hidden pointer-events-none text-black">
      {prevEntry && (
        <div className="prev-msg absolute top-0 left-0 w-full h-full">
          <MarqueeWrapper entry={prevEntry} isOpen={isOpen} play={false} />
        </div>
      )}

      {activeEntry && (
        <div className="active-msg absolute top-0 left-0 w-full h-full">
          <MarqueeWrapper entry={activeEntry} isOpen={isOpen} />
        </div>
      )}
    </div>
  );
}

const MarqueeWrapper = ({ entry, isOpen, play = true }: { entry: GameLogEntry; isOpen: boolean; play?: boolean }) => {
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && contentRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const contentWidth = contentRef.current.scrollWidth;
      setShouldMarquee(contentWidth+20 > containerWidth);
    }
  }, [entry]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center overflow-hidden">
      <div className="invisible absolute whitespace-nowrap pointer-events-none" ref={contentRef}>
         <LogMessageItem entry={entry} className="w-fit" />
      </div>
      
      {shouldMarquee ? (
        <Marquee 
          play={!isOpen && play} 
          gradient={false} 
          speed={40}
          delay={1}
        >
          <LogMessageItem entry={entry} className="w-fit px-8 whitespace-nowrap" />
        </Marquee>
      ) : (
        <LogMessageItem entry={entry} />
      )}
    </div>
  );
};

// --- Main Component ---

export default function GameLogDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [parentEl, setParentEl] = useState<HTMLDivElement | null>(null);
  
  // Notice we subscribe to all entries normally now since virtualizer will cull offscreen
  const entries = useGameLogStore((state) => state.entries);
  const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;

  const rowVirtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentEl,
    estimateSize: () => 32,
    overscan: 5,
  });

  // Auto-scroll when new items are added or drawer opens
  useEffect(() => {
    if (isOpen && entries.length > 0 && parentEl) {
      // Use requestAnimationFrame to let the virtualizer process the new parentEl first
      requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(entries.length - 1, { behavior: "instant" });
      });
    }
  }, [entries.length, isOpen, parentEl, rowVirtualizer]);

  return (
    <>
      {/* Ticker Bar */}
      <div 
        className={cn(
          " h-[32px] py-1 pb-4 rounded-t-md bg-secondary flex justify-center cursor-pointer ",
          "transition-all duration-500 shadow-md",
        )}
        onClick={() => setIsOpen(true)}
      >
        <LogTicker entry={lastEntry} isOpen={isOpen} />
      </div>

      <Drawer open={isOpen} onOpenChange={setIsOpen} fixed disablePreventScroll={true}>
        <DrawerContent className="z-999 fixed bottom-0 left-0 right-0 flex h-[60dvh] flex-col rounded-t-[10px] outline-none">
          <div className="mx-auto flex h-full w-full max-w-2xl flex-col overflow-hidden">
            <DrawerHeader className="border-b shrink-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
              <DrawerTitle>Game Log</DrawerTitle>
            </DrawerHeader>

            {/* Log Entries List */}
            <div 
              ref={setParentEl}
              className="min-h-0 flex-1 overflow-y-auto p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {!entries.length ? (
                <div className="text-center text-muted-foreground py-8">
                  No actions have occurred yet.
                </div>
              ) : (
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const entry = entries[virtualItem.index];
                    return (
                      <div
                        key={entry.id}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className="flex items-center justify-center p-1"
                      >
                        <LogMessageItem entry={entry} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
