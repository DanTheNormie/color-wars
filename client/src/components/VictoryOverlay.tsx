import { useEffect, useState } from "react";
import { GameEventBus } from "@/lib/managers/GameEventBus";
import { useStore } from "@/stores/sessionStore";
import { Crown } from "lucide-react";

/**
 * VictoryOverlay
 * 
 * Full-screen dramatic announcement when a player starts their victory lap.
 * Triggered via GameEventBus "VICTORY_LAP_STARTED" event.
 * Auto-dismisses after 4 seconds.
 */
export default function VictoryOverlay() {
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const players = useStore((z) => z.state.game.players);

  useEffect(() => {
    const unsub = GameEventBus.on("VICTORY_LAP_STARTED", ({ playerId }) => {
      setActivePlayerId(playerId);
      setTimeout(() => setActivePlayerId(null), 3500);
    });
    return unsub;
  }, []);

  if (!activePlayerId) return null;

  const player = players[activePlayerId];
  if (!player) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none overflow-hidden"
      style={{ animation: "victoryFadeInOut 3.5s ease-in-out forwards" }}
    >
      {/* Background blur and darken backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-md bg-black/60 pointer-events-auto"
        style={{ animation: "backdropFade 3.5s ease-in-out forwards" }}
      />

      {/* Background sweep pulse */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${player.color}44 0%, transparent 60%)`,
          animation: "sweepPulse 2s ease-in-out infinite alternate"
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-8 text-center px-4">
        {/* Crown icon with bounce */}
        <div
          className="rounded-full p-6 shadow-2xl"
          style={{
            backgroundColor: `${player.color}33`,
            border: `2px solid ${player.color}66`,
            animation: "victoryBounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        >
          <Crown
            className="w-16 h-16"
            style={{ 
              color: "#FFD700", 
              filter: "drop-shadow(0 0 15px #FFD700)",
            }}
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          {/* Title with glow */}
          <h1
            className="text-6xl font-black tracking-tighter uppercase italic text-white"
            style={{
              textShadow: `0 0 30px ${player.color}, 0 0 60px ${player.color}44`,
              animation: "victoryScale 0.6s ease-out",
            }}
          >
            Victory Lap!
          </h1>

          {/* Player name */}
          <div className="flex flex-col items-center">
            <p
              className="text-3xl font-extrabold tracking-widest uppercase mb-1"
              style={{ 
                color: player.color,
                textShadow: `0 0 10px ${player.color}88`
              }}
            >
              {player.name}
            </p>
            <div className="h-1 w-24 rounded-full" style={{ backgroundColor: player.color }} />
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-white/70 text-lg font-medium tracking-[0.4em] uppercase animate-pulse">
          Must complete one full lap to win
        </p>
      </div>

      <style>{`
        @keyframes victoryFadeInOut {
          0%   { opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes backdropFade {
          0%   { opacity: 0; backdrop-filter: blur(0px); }
          15%  { opacity: 1; backdrop-filter: blur(8px); }
          85%  { opacity: 1; backdrop-filter: blur(8px); }
          100% { opacity: 0; backdrop-filter: blur(0px); }
        }
        @keyframes victoryBounce {
          0%   { transform: scale(0) rotate(-45deg); }
          70%  { transform: scale(1.1) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes victoryScale {
          0%   { transform: scale(0.5); opacity: 0; letter-spacing: -0.05em; }
          100% { transform: scale(1); opacity: 1; letter-spacing: -0.02em; }
        }
        @keyframes sweepPulse {
          0% { transform: scale(0.8); opacity: 0.3; }
          100% { transform: scale(1.2); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
