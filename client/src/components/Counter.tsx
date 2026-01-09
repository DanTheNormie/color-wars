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
    <span ref={diffContainerRef} id={id} className="relative inline-block">
      <span className={className} ref={elRef}>0</span>
    </span>
  );
}



export default function PlayerM({ playerId }: { playerId: string }) {
  const score = useStore((s) => s.state.game.players[playerId]?.money || 0);

  return (
    <CounterSimple value={score} animateDiff id={`player-money-${playerId}`} />
  );
}
