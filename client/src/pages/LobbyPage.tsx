import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/stores/sessionStore";
import { network } from "@/lib/managers/network";
import { Play, WifiOff } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { HexCanvas } from "@/components/HexCanvas";

gsap.registerPlugin(useGSAP);

export default function LobbyPage() {
  const playerName = useStore((z) => z.room.playerName);
  const setPlayerName = useStore((z) => z.setPlayerName);
  const quickMatch = useStore((z) => z.quickMatch);

  const navigate = useNavigate();
  const leaveGame = useStore((z) => z.leaveGame);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    leaveGame();
  }, [leaveGame]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.fromTo(
      ".gsap-logo", 
      { y: -30, opacity: 0, scale: 0.9 }, 
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" }
    )
    .fromTo(
      ".gsap-card",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.1 },
      "0"
    );
  }, { scope: containerRef });

  const handleQuickMatch = async () => {
    if (!playerName || !playerName.trim()) {
      setError("Please enter a nickname");
      return;
    }
    setError(null);

    try {
      // Button press animation before navigating
      gsap.to(".gsap-play-button", { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
      const roomId = await quickMatch();
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Error in quick match:", error);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#0a0710] font-sans text-slate-200 selection:bg-indigo-500/30 overflow-hidden relative flex flex-col items-center justify-center cursor-default"
      ref={containerRef}
    >
      {/* Hexagon Background Layer */}
      <HexCanvas />
      {/* <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-indigo-600/20 rounded-full blur-[60px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] bg-purple-600/20 rounded-full blur-[60px] pointer-events-none z-0" /> */}

      {/* Main Content */}
      <main className="relative z-20 flex w-full max-w-md flex-col items-center justify-center p-4 md:p-6">
        
        {/* Logo / Title Area */}
        <div className="gsap-logo mb-4 flex flex-col items-center text-center">

          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-b from-zinc-100 to-zinc-500 drop-shadow-sm">
            HEXAROLL
          </h1>
          
          
        </div>

        {/* Interaction Card Area */}
        <div className="gsap-card w-full space-y-4 p-2 md:p-4">

          <div className="flex flex-col gap-2">
            <input 
              type="text" 
              placeholder="Your nickname..." 
              value={playerName}
              onChange={(e) => { setPlayerName(e.target.value); setError(null); }}
              className={`w-full bg-[#1e192c]/60 border ${error ? 'border-red-500 focus:ring-red-500/60 focus:border-red-500/60' : 'border-white/10 focus:ring-indigo-500/60 focus:border-indigo-500/60'} rounded-xl px-5 py-4 text-center text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.2)]`}
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </div>
          
          <button onClick={handleQuickMatch} className="w-full relative group rounded-xl bg-[#801FFF] hover:bg-[#8A47E0] transition-all duration-300 shadow-[0_0_20px_rgba(138,71,224,0.3)] hover:shadow-[0_0_30px_rgba(138,71,224,0.5)] gsap-play-button">
            <div className="relative px-6 py-4 flex justify-center items-center gap-2">
              <Play className="w-5 h-5 text-white fill-white" />
              <span className="font-bold text-lg text-white tracking-wide">Play</span>
            </div>
          </button>
          {/* Online Status */}
          <div className="w-full flex justify-center">
            {(isOnline && (network as any).client) ? (
            <div className=" flex items-center gap-2 text-white/50 text-xs tracking-widest pointer-events-none uppercase font-semibold">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              <span>Server Online</span>
            </div>
          ) : (
            <div className=" flex items-center gap-2 text-white/50 text-xs tracking-widest pointer-events-none uppercase font-semibold">
              <WifiOff className="w-4 h-4 text-red-500" />
              <span>Cannot Reach Server</span>
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
