import { useStore } from "@/stores/sessionStore";
import { getTextColor } from "@/lib/utils";

export default function NowPlayingHeader() {
  const activePlayerId = useStore((z) => z.state.game.activePlayerId);
  const activePlayer = useStore((z) => z.state.game.players[activePlayerId]);
  const phase = useStore((z) => z.state.room?.phase);
  
  if (phase !== "active" || !activePlayer) {
    return null;
  }

  const bgColor = activePlayer.color || "#64748b";
  const textColor = getTextColor(bgColor);

  return (
    <div className="sticky top-0 z-50 flex w-full justify-center">
      <div 
        className="flex items-center gap-2 px-4 py-1.5 rounded-b-xl shadow-md transition-colors duration-300"
        style={{ backgroundColor: `${bgColor}`, color: textColor }}
      >
        <span className="text-sm font-bold tracking-wide">
          {activePlayer.name} is currently playing
        </span>
      </div>
    </div>
  );
}
