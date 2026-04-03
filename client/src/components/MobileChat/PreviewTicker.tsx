import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useStore } from "@/stores/sessionStore";
import type { Message } from "@color-wars/shared";
import { AvatarColorMap } from "../Player";
import MarqueeImport from "react-fast-marquee";
const Marquee = (MarqueeImport as any).default || MarqueeImport;

const TickerItem = ({ message, isOpen }: { message: Message, isOpen: boolean }) => {
    const player = useStore((z) =>
      z.state.game.players ? z.state.game.players[message.senderId] : null,
    );
  
    const color = player?.color || "#64748b";
    const name = player?.name || message.senderId;

    const [shouldMarquee, setShouldMarquee] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      if (containerRef.current && contentRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const contentWidth = contentRef.current.scrollWidth;
        // Check if content (name + separator + message) exceeds space
        setShouldMarquee(contentWidth > containerWidth);
      }
    }, [message, name]);
  
    return (
      <div ref={containerRef} className="flex w-full h-full items-center gap-2 px-2 overflow-hidden">
        {/* Avatar */}
        <div className="shrink-0">
           <img 
            className="h-6 w-6 rounded-full object-cover" 
            src={AvatarColorMap[color as keyof typeof AvatarColorMap] || AvatarColorMap["#64748b"]} 
            alt="" 
          />
        </div>
  
        <div className="flex flex-1 items-center min-w-0 gap-1 overflow-hidden h-full">
          {/* Name Label - always visible */}
          <span 
              className="text-sm font-bold whitespace-nowrap shrink-0" 
              style={{ color: color }}
          >
              {name}
          </span>
  
          <span className="text-xs shrink-0 mr-1">:</span>

          {/* Marquee or Static Content */}
          <div className="flex-1 min-w-0 h-full flex items-center">
             {/* Hidden measure element */}
             <div className="invisible absolute whitespace-nowrap pointer-events-none" ref={contentRef}>
                {message.content}
             </div>

             {shouldMarquee ? (
                <Marquee 
                    play={!isOpen} 
                    gradient={false} 
                    speed={40}
                    delay={1}
                >
                    <span className="text-sm pr-8 whitespace-nowrap text-foreground">
                        {message.content}
                    </span>
                </Marquee>
             ) : (
                <span className="text-sm truncate text-foreground">
                    {message.content}
                </span>
             )}
          </div>
        </div>
      </div>
    );
  };

interface PreviewTickerProps {
  message: Message | null;
  isOpen: boolean;
}

export function PreviewTicker({ message, isOpen }: PreviewTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Local state to track transition between old and new message
  const [activeMsg, setActiveMsg] = useState<Message | null>(message);
  const [prevMsg, setPrevMsg] = useState<Message | null>(null);

  // 1. Sync Props to State
  //useEffect(() => {
    // If the message object actually changed
    if (message !== activeMsg) {
      setPrevMsg(activeMsg); // The current one becomes "previous"
      setActiveMsg(message); // The new one becomes "active"
    }
  // }, [message, activeMsg]);

  // 2. GSAP Animation Logic
  useEffect(() => {
    // Only animate if drawer is CLOSED (user is watching the ticker)
    if (!containerRef.current || isOpen) return;

    if (activeMsg) {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

        // Slide Old Message UP and OUT
        if (prevMsg) {
          tl.to(
            ".prev-msg",
            {
              y: -20,
              opacity: 0,
              duration: 0.3,
            },
            0,
          );
        }

        // Slide New Message UP and IN
        tl.fromTo(
          ".active-msg",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4 },
          0, // Start simultaneously
        );
      }, containerRef);

      return () => ctx.revert();
    }
  }, [activeMsg, prevMsg, isOpen]);

  // Empty State
  if (!activeMsg && !prevMsg) {
    return (
      <div className="text-muted-foreground flex h-10 items-center justify-center w-full gap-3">
        <span className="text-sm">Click to send message</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden pointer-events-none">
      {/* We render both items absolutely so they can overlap during the animation */}

      {prevMsg && (
        <div className="prev-msg absolute top-0 left-0 w-full h-full">
          <TickerItem message={prevMsg} isOpen={isOpen} />
        </div>
      )}

      {activeMsg && (
        <div className="active-msg absolute top-0 left-0 w-full h-full">
          <TickerItem message={activeMsg} isOpen={isOpen} />
        </div>
      )}
    </div>
  );
}
