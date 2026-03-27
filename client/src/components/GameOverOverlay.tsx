import React from "react";
import { useStore } from "@/stores/sessionStore";
import { Avatar, AvatarImage } from "./ui/avatar";
import { AvatarColorMap } from "./Player";
import { Button } from "./ui/button";
import { Trophy, Home } from "lucide-react";

/**
 * GameOverOverlay
 * 
 * Displayed when the game is over.
 * Shows the winner's avatar and name.
 * Provides a button to return to the lobby.
 */
const GameOverOverlay: React.FC = () => {
  const winnerId = useStore((z) => z.winnerId);
  const currentPlayerId = useStore((z) => z.currentPlayer.id);
  const players = useStore((z) => z.state.game.players);
  const leaveGame = useStore((z) => z.leaveGame);
  const turnPhase = useStore((z) => z.state.game.turnPhase);

  // Only show if the turn phase is explicitly game-over and we have a winner
  if (turnPhase !== "game-over" || !winnerId) return null;

  const winner = players[winnerId];
  if (!winner) return null;

  const isWinner = winnerId === currentPlayerId;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-700">
      <div className="relative flex flex-col items-center gap-8 p-10 rounded-3xl bg-neutral-900/50 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-md w-[90%] text-center overflow-hidden">
        
        {/* Animated background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 blur-[100px] rounded-full animate-pulse delay-700" />

        <div className="flex flex-col items-center gap-2">
          {isWinner ? (
            <div className="bg-yellow-500/10 p-3 rounded-full mb-2">
              <Trophy className="w-10 h-10 text-yellow-500 animate-bounce" />
            </div>
          ) : (
            <div className="bg-white/5 p-3 rounded-full mb-2">
              <Trophy className="w-10 h-10 text-white/40" />
            </div>
          )}
          <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">
            {isWinner ? "Victory!" : "Game Over"}
          </h1>
          <p className="text-white/50 text-sm font-medium tracking-widest uppercase">
            {isWinner ? "You are the champion" : "Better luck next time"}
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-full blur-2xl opacity-50"
              style={{ backgroundColor: winner.color }}
            />
            <img className="h-40 w-40 border-4 border-white/10 shadow-2xl relative z-10" src={AvatarColorMap[winner.color]} alt="" />
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold">
              Winner
            </span>
            <span className="text-3xl font-black tracking-tight" style={{ color: winner.color }}>
              {winner.name}
            </span>
          </div>
        </div>

        <Button 
          size="lg" 
          variant="secondary"
          className="mt-4 w-full h-14 bg-white text-black hover:bg-neutral-200 font-black text-lg gap-2 rounded-xl transition-all active:scale-95 shadow-lg"
          onClick={() => leaveGame()}
        >
          <Home className="w-5 h-5" />
          RETURN TO LOBBY
        </Button>
      </div>
    </div>
  );
};

export default GameOverOverlay;
