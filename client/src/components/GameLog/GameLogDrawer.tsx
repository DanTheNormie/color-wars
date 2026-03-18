import { useState, useEffect, useRef } from "react";
import { useGameLogStore } from "@/stores/gameLogStore";
import { useStore } from "@/stores/sessionStore";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";
import {Avatar, AvatarImage} from "@/components/ui/avatar";
import { AvatarColorMap } from "../Player";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { GameLogEntry } from "@/stores/gameLogStore";

// --- Subcomponents ---

const TerritoryInline = ({ territoryId }: { territoryId: string }) => {
  const formatted = territoryId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return <span className="font-bold">{formatted}</span>;
}

const PlayerInline = ({ playerId }: { playerId: string }) => {
  const player = useStore((z) =>
    z.state.game.players ? z.state.game.players[playerId] : null,
  )!;
  const isYou = useStore((z) => z.currentPlayer.id === playerId);

  const color = player.color || "#64748b";
  const name = isYou ? "You" : player.name || playerId;

  return (
    <div className="flex w-fit items-center gap-2">
      <Avatar className="h-[24px] w-[24px]">
        <AvatarImage src={AvatarColorMap[player.color]}></AvatarImage>
      </Avatar>
      <span className="font-bold" style={{ color: color }}>
        {name}
      </span>
    </div>
    
  );
}

const LogMessageItem = ({ entry }: { entry: GameLogEntry }) => {
  const payload = entry.payload;
  const logMessageStyle = "flex justify-center w-full gap-2 items-center text-white";
  switch (entry.type) {
    case "ROLL_DICE":
      return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> rolled {payload.die1 + payload.die2} 🎲 ({payload.die1} + {payload.die2})</div>;
      case "INCR_MONEY":
        return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> received <span className="text-green-600">${payload.amount?.toLocaleString()}</span></div>;
      case "DECR_MONEY":
        return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> paid <span className="text-red-600">${payload.amount?.toLocaleString()}</span></div>;
      case "BUY_TERRITORY":
        return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> bought <TerritoryInline territoryId={payload.territoryID} /> for ${payload.amount?.toLocaleString()}</div>;
      case "SELL_TERRITORY":
        return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> sold <TerritoryInline territoryId={payload.territoryID} /> for ${payload.amount?.toLocaleString()}</div>;
      case "DRAW_3_REWARD_CARDS":
        return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> drew 3 reward cards.</div>;
      case "SELECT_CARD":{
        const card = JSON.parse(payload.selectedCardId);
        console.log(card)
        return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> selected a {card.ui.title} card.</div>;
      }
      case "ADD_CARD":
        return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> received a card.</div>;
      case "MOVE_PLAYER":{
        const diceTrack = useStore((z) => z.state.game.diceTrack);
        if (!diceTrack || diceTrack.length === 0) return <div className={logMessageStyle}> <PlayerInline playerId={entry.playerId} /> landed on a tile.</div>;
        const tile = diceTrack[payload.toTile % diceTrack.length];
        const tileName = tile.type.toLowerCase()
        return <div className={logMessageStyle}> <PlayerInline playerId={entry.playerId} /> landed on {tileName == "start" ? `the` : `a`} {tileName} tile.</div>
    }
    case "SHIFT_TRACK":{
      const direction = payload.shiftDirection === "forward" ? "counter-clockwise" : "clockwise";
      const count = payload.newTiles.length;
      let message = ""
      if(count > 1){
        message = `The track shifted ${direction}. ${count} new tiles have been added`
      }else{
        message = `The track shifted ${direction}. A new tile has been added`
      }
      return <div className={`${logMessageStyle} text-sm`}> {message}</div>
    }
    case "BANK_BACKPACK_ITEMS": {
      return <div className={logMessageStyle}><PlayerInline playerId={entry.playerId} /> banked items from backpack.</div>;
    }
    default:
      return <div className={logMessageStyle}>{`<!-- log for action type: "${entry.type}" not implemented -->`}</div>;
  }
};

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
          <LogMessageItem entry={prevEntry} />
        </div>
      )}

      {activeEntry && (
        <div className="active-msg absolute top-0 left-0 w-full h-full">
          <LogMessageItem entry={activeEntry} />
        </div>
      )}
    </div>
  );
}

// --- Main Component ---

export default function GameLogDrawer() {
  const entries = useGameLogStore((state) => state.entries);
  
  const [isOpen, setIsOpen] = useState(false);
  
  // We want the ticker to stick out only when there's an entry
  // And maybe hide it after a few seconds? The plan asked to always stick out.
  // Actually, waiting for 5 seconds after the latest log ensures it's not permanently taking up screen space.
  
  // const [showTicker, setShowTicker] = useState(false);
  // const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const entriesEndRef = useRef<HTMLDivElement>(null);
  
  // Use all entries (store already filters out unneeded actions like MOVE_PLAYER)
  const validEntries = entries;
  const lastEntry = validEntries.length > 0 ? validEntries[validEntries.length - 1] : null;

  // // Whenever a new entry arrives, show the ticker and set a timeout to hide it
  // useEffect(() => {
  //   if (lastEntry && !isOpen) {
  //     setTimeout(() => setShowTicker(true), 0);
      
  //     if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  //     hideTimeoutRef.current = setTimeout(() => {
  //       setShowTicker(false);
  //     }, 600000); // Hide after 6 seconds of inactivity
  //   }
  // }, [lastEntry?.id, isOpen]);

  // useEffect(() => {
  //   if (isOpen) {
  //     setTimeout(() => setShowTicker(false), 0); // Hide the ticker when the drawer is open
  //     setTimeout(() => {
  //       entriesEndRef.current?.scrollIntoView({ behavior: "instant" });
  //     }, 100);
  //   } else {
  //     // when drawer closes, if there's an entry, show the ticker briefly
  //     if (lastEntry) {
  //       setTimeout(() => setShowTicker(true), 0);
  //       if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  //       hideTimeoutRef.current = setTimeout(() => {
  //         setShowTicker(false);
  //       }, 400000);
  //     }
  //   }
  // }, [isOpen, validEntries.length, lastEntry]);

  return (
    <>
      {/* Ticker Bar (Replaces diceRollMessage) */}
      <div 
        className={cn(
          " h-[32px] py-1 pb-4 rounded-t-md bg-secondary flex justify-center cursor-pointer ",
          "transition-all duration-500 shadow-md",
          // "top-[-30px]"
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
            <div className="min-h-0 flex-1 overflow-y-auto p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex flex-col gap-1 pb-4">
                {validEntries.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No actions have occurred yet.
                  </div>
                ) : (
                  validEntries.map((entry) => (
                    <LogMessageItem entry={entry} key={entry.id} />
                  ))
                )}
                {/* Invisible element to scroll to */}
                <div ref={entriesEndRef} />
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
