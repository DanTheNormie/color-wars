// Counter.tsx
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useStore } from "@/stores/sessionStore";
import { animateCounter, createFloatingDiff } from "@/animation/registry/anim";


export function CounterSimple({ value, animateDiff, id, className }: { value: number, animateDiff?: boolean, id?: string, className?: string }) {
  const elRef = useRef<HTMLSpanElement>(null);
  const diffContainerRef = useRef<HTMLDivElement>(null);
  const animatedValue = useRef({ val: 0 });
  const lastValue = useRef(0);

  useEffect(() => {
    if (!elRef.current || !diffContainerRef.current) return;

    const tl = gsap.timeline();
    tl.add(animateCounter(elRef.current, animatedValue.current, value), 0);
    const diff = value - lastValue.current;
    lastValue.current = value;
    // diff animation
    if (animateDiff && diff !== 0) {
      tl.add(createFloatingDiff(diffContainerRef.current, diff), 0);
    }

  }, [value]);

  return (
    <span ref={diffContainerRef} id={id}  className="relative  flex items-center">
      <span className={className} ref={elRef}>0</span>
    </span>
  );
}

const statTextContainerClassName = "flex items-center";
const textSizeClass = `flex items-center text-[0.4rem] xs:text-[0.4rem] sm:text-[0.6rem] lg:text-[0.8rem] sm:mr-0.5 md:mr-1`;

export function PlayerMoney({ playerId }: { playerId: string }) {
  const score = useStore((s) => s.state.game.players[playerId]?.money || 0);

  return (
    <div className={statTextContainerClassName}>
      <div className={textSizeClass}>🏦</div>
      <CounterSimple className={textSizeClass} value={score} animateDiff id={`player-money-${playerId}`} />
    </div>
  );
}



export function PlayerCards({ playerId }: { playerId: string }) {
  const score = useStore((s) => s.state.game.players[playerId]?.cards.length || 0);

  return (
    <div className={statTextContainerClassName}>
      <div className={textSizeClass}>📚</div>
      <CounterSimple className={textSizeClass} value={score} animateDiff id={`player-cards-${playerId}`} />
    </div>
  );
}



export function PlayerTerritories({ playerId }: { playerId: string }) {
  const playerT = useStore((s) => {
    const territoryOwnershipMap = s.state.game.territoryOwnership
    const playerTerritories = Object.values(territoryOwnershipMap).filter((t:any)=>t.ownerId == playerId)
    return playerTerritories.length
  });

  return (
    <div className={statTextContainerClassName}>
      <div className={textSizeClass}>🚩</div>
      <CounterSimple className={textSizeClass} value={playerT} animateDiff id={`player-territories-${playerId}`} />
    </div>
  );
}
