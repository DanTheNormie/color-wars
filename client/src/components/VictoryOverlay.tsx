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
      setTimeout(() => setActivePlayerId(null), 4000);
    });
    return unsub;
  }, []);

  if (!activePlayerId) return null;

  const player = players[activePlayerId];
  if (!player) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none"
      style={{ animation: "victoryFadeInOut 4s ease-in-out forwards" }}
    >
      {/* Background sweep */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${player.color}33 0%, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Crown icon with bounce */}
        <div
          className="rounded-full p-4"
          style={{
            backgroundColor: `${player.color}22`,
            animation: "victoryBounce 0.6s ease-out",
          }}
        >
          <Crown
            className="w-14 h-14"
            style={{ color: "#FFD700", filter: "drop-shadow(0 0 12px #FFD70088)" }}
          />
        </div>

        {/* Title */}
        <h1
          className="text-5xl font-black tracking-tight uppercase italic text-white"
          style={{
            textShadow: `0 0 40px ${player.color}, 0 0 80px ${player.color}66`,
            animation: "victoryScale 0.5s ease-out",
          }}
        >
          Victory Lap!
        </h1>

        {/* Player name */}
        <p
          className="text-2xl font-bold tracking-widest uppercase"
          style={{ color: player.color }}
        >
          {player.name}
        </p>

        {/* Subtitle */}
        <p className="text-white/50 text-sm tracking-[0.3em] uppercase">
          Must complete one full lap to win
        </p>
      </div>

      <style>{`
        @keyframes victoryFadeInOut {
          0%   { opacity: 0; }
          10%  { opacity: 1; }
          75%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes victoryBounce {
          0%   { transform: scale(0) rotate(-20deg); }
          60%  { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes victoryScale {
          0%   { transform: scale(0.3); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
