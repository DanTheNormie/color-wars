import { useEffect, useRef } from "react";
import gsap from "@/lib/gsap";
import { useCardStore } from "@/stores/cardSelectionStore";

import { Swiper, SwiperSlide, type SwiperClass } from "swiper/react";
import { EffectCards, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";

import "hover-tilt/web-component";
import type { HoverTiltProps } from "hover-tilt/types";
import { Button } from "@/components/ui/button";
import { GameEventBus } from "./managers/GameEventBus";
import { useStore } from "@/stores/sessionStore";

declare class HoverTiltElement extends HTMLElement {
  /**
   * Typed props bag mirroring the web component's configurable options.
   * This is primarily for IDE intellisense when accessing the element via JS.
   */
  props?: HoverTiltProps;
}

declare module "react" {
  interface HTMLElementTagNameMap {
    "hover-tilt": HoverTiltElement;
  }

  namespace JSX {
    interface IntrinsicElements {
      /**
       * HoverTilt web component.
       *
       * When using React/Preact with TypeScript, import this module somewhere
       * in your app (e.g. `import 'hover-tilt/web-component';`) to enable
       * typed props and JSX support for `<hover-tilt>...</hover-tilt>`.
       */
      "hover-tilt": HoverTiltProps & JSX.IntrinsicElements["div"];
    }
  }
}

import type { RewardConfig } from "@color-wars/shared";

const Card = ({ id }: { id: string }) => {
  const config = JSON.parse(id) as RewardConfig;
  const { title, subtitle, colorTheme } = config.ui;

  const themeClasses: Record<string, string> = {
    "Emerald Green": "from-emerald-600 via-emerald-500 to-teal-700",
    "Gold / Yellow": "from-amber-400 via-yellow-300 to-orange-500",
    "Crimson Red": "from-rose-700 via-red-600 to-red-900",
    "Royal Blue": "from-blue-700 via-blue-500 to-indigo-900",
    "Industrial Gray": "from-slate-600 via-gray-500 to-zinc-700",
    "Industrial / Warning": "from-orange-600 via-yellow-600 to-gray-800",
    "Gold": "from-yellow-600 via-amber-400 to-yellow-800 animate-pulse",
  };

  const gradient = themeClasses[colorTheme] || "from-gray-600 to-gray-800";

  return (
    <div id={id} className="card-wrapper relative flex h-full w-full max-w-120 justify-center rounded-xl select-none">
      <style>{`
        .glare-rounded::part(tilt)::before {
            border-radius: calc(var(--radius) + 4px);
        }
        .hoverr::part(container),
        .hoverr::part(tilt)
        {
          width: 100%;
          height: 100%;
          overflow: visible;
        }
      `}</style>
      <hover-tilt
        glareMask="url(/aztec-pattern.webp)"
        glareMaskMode="luminance"
        className="hoverr glare-rounded h-full w-full overflow-visible"
        tilt-factor="1.5"
        scale-factor="1.1"
      >
        <div className={`flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-xl bg-gradient-to-br ${gradient} shadow-2xl p-8 border-2 border-white/20 backdrop-blur-sm`}>
          <div className="flex flex-col items-center gap-4 text-center">
             <div className="bg-white/10 p-4 rounded-full backdrop-blur-md border border-white/20">
                {config.type === 'INSTANT_CASH' ? '💰' : '🃏'}
             </div>
             <h2 className="text-4xl font-extrabold text-white drop-shadow-lg tracking-tight uppercase">
                {title}
             </h2>
             <p className="text-white/80 text-lg font-medium max-w-[250px]">
                {subtitle}
             </p>
          </div>
          
          <div className="w-full flex justify-center mt-8 opacity-40">
             <div className="text-xs font-mono text-white/50 tracking-widest uppercase">
                {config.type}
             </div>
          </div>
        </div>
      </hover-tilt>
    </div>
  );
};

const Thumb = ({ id, idx }: { id: string, idx:number }) => {
  const selectedCardId = useCardStore((s) => s.selectedCardId);
  const setSelectedCardId = useCardStore((s) => s.setSelectedCardId);
  const handleOnClick = () => {
    setSelectedCardId(id);
  };
  return (
    <div
      onClick={handleOnClick}
      className={`flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-md bg-zinc-700 text-[10px] text-white select-none p-1 text-center transition-all ${selectedCardId == id ? "border-2 border-white scale-110 shadow-lg z-10" : "opacity-60 hover:opacity-100"}`}
    >
      {/* <div className="font-bold truncate w-full">{config.ui.title}</div> */}
      <div className="text-lg font-bold">{String.fromCharCode(65 + idx)}</div>
    </div>
  );
};

// --- Main Overlay ---
export const CardSelectionOverlay = () => {
  // Using selector to prevent unnecessary re-renders if other parts of store change
  const cardIds = useCardStore((s) => s.cardIds);
  const phase = useCardStore((s) => s.phase);
  const selectedCardId = useCardStore((s) => s.selectedCardId);
  const selectCard = useStore((s) => s.selectCard)
  const swiperRef = useRef<SwiperClass | null>(null);
  const setPhase = useCardStore((s) => s.setPhase);
  const reset = useCardStore((s) => s.reset);
  const isActivePlayer = useStore((z)=>z.currentPlayer?.id == z.state?.game?.activePlayerId)
  console.log('isActivePlayer', isActivePlayer)
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCardSelect = () => {
    if (!selectedCardId){
      GameEventBus.emit('TOAST',{
        content:'please select a card !!!',
        type:'error'
      })
      return
    };
    console.log("action created", selectedCardId);
    selectCard(selectedCardId)
    //new ResolveSelectionAction({ selectedCardId }).execute();
    // Example: sendSelectCardOp(id);
  };

  useEffect(() => {
    const activeIndex = cardIds.findIndex((v) => v == selectedCardId);
    if (swiperRef.current?.activeIndex !== activeIndex) {
      swiperRef.current?.slideTo(activeIndex, 200);
    }
  }, [selectedCardId, cardIds]);

  // 1. Reveal Animation
  useEffect(() => {
    if (phase === "drawing" && containerRef.current) {
      const wrappers = Array.from(containerRef.current.querySelectorAll(".card-wrapper")).reverse();
      gsap.fromTo(
        wrappers,
        { y: -800, opacity: 0, rotateZ: 15 },
        {
          y: 0,
          opacity: 1,
          rotateZ: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: "elastic.out(1, 0.8)",
          onComplete: () => {
            setPhase("interacting");
          },
        },
      );
    }
  }, [phase, setPhase]);

  // 2. Exit Animation
  useEffect(() => {
    console.log(phase === "resolving", containerRef.current, selectedCardId);
    if (phase === "resolving" && containerRef.current && selectedCardId) {
      console.log("Starting exit animation for selected card:", selectedCardId);
      const wrappers = Array.from(containerRef.current.querySelectorAll(".card-wrapper")).reverse() as HTMLElement[];
      const selectedWrapper = wrappers.find((el) => el.id === `${selectedCardId}`);
      const others = wrappers.filter((el) => el !== selectedWrapper);

      const tl = gsap.timeline({
        onComplete: () => reset(), // This sets phase to 'idle', unlocking the Action Queue
      });

      // Animate unselected cards away
      tl.to(others, {
        opacity: 0,
        y: 500,
        scale: 0.9,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.in",
      });

      // Animate selected card
      if (selectedWrapper) {
        tl.to(selectedWrapper, {
          y: -100,
          opacity: 0,
          duration: 0.3,
          delay: 0.2,
          ease: "power2.in",
        });
      }
    }
  }, [phase, selectedCardId, reset]);

  if (phase === "idle") return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-100 flex h-full w-full flex-col items-center justify-center gap-12 bg-black/80 backdrop-blur-sm perspective-[2000px]">
      <div className="flex h-full w-full max-w-120 flex-col items-center justify-center gap-12">
        <style>
        {`
          .swiper.first {
            width: 60vw;
            max-width: 480px;
            height: 45vh;
            max-height: 720px;
          }

          .swiper,
          .swiper-wrapper,
          .swiper-slide {
            overflow:visible !important;
          }

          .swiper-slide {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 18px;
            font-size: 22px;
            font-weight: bold;
            color: #fff;
          }
      `}
      </style>

      <Swiper
        className="first"
        effect="cards"
        modules={[EffectCards, Thumbs]}
        onSwiper={(s) => (swiperRef.current = s)}
        grabCursor={true}
        allowTouchMove={false}
        simulateTouch={false}
        cardsEffect={{
          slideShadows: false,
        }}
      >
        {cardIds.map((id) => (
          <SwiperSlide key={id}>
            <Card id={id} />
          </SwiperSlide>
        ))}
      </Swiper>

      <Swiper allowTouchMove={false} slidesPerView={3} watchSlidesProgress spaceBetween={12} className="mt-4 w-72">
        {cardIds.map((id, idx) => (
          <SwiperSlide key={`thumb-${id}`}>
            <Thumb id={id} idx={idx} />
          </SwiperSlide>
        ))}
      </Swiper>
      <Button className={`${!isActivePlayer?'hidden':''} cursor-pointer relative transition-none`} onClick={handleCardSelect} size="lg" variant="outline">
        Confirm Selection
      </Button>
      </div>
    </div>
  );
};
