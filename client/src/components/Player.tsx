import {  useRef } from "react";
import type { PlainStateOf, PlayerState } from "@color-wars/shared";
import { useStore } from "@/stores/sessionStore";
import { PlayerMoney } from "./Counter";

export const AvatarColorMap = {
  '#D46565': "/avatars/red_round.svg",
  '#65D479': "/avatars/green_round.svg",
  '#6595D4': "/avatars/blue_round.svg",
  '#8E65D4': "/avatars/purple_round.svg",
  '#2C4F7C': "/avatars/blue_round.svg",
  '#00E5FF': "/avatars/scientist.png",
  "#1C1C1E": "/avatars/spy.png",
  "#D4AF37": "/avatars/rich.png",
  "#8B0000": "/avatars/king.png",
  "#2F5D3A": "/avatars/general.png",
} as { [k: string]: string };

const Player = ({ player }: { player: PlainStateOf<PlayerState> }) => {
  const sessionId = useStore((z) => z.currentPlayer.id);
  const leaderId = useStore((z) => z.state.room.leaderId);
  const isLobbyPhase = useStore((z) => z.state.room.phase == "lobby");
  const kickPlayer = useStore((z) => z.kickPlayer);
  const ref = useRef<HTMLLIElement>(null);

  const handleKickPlayer = () => {
    kickPlayer(player.id);
  };

  const isYou = player.id === sessionId;
  const isLeader = player.id === leaderId;
  const leaderAccess = leaderId === sessionId;

  const textSizeClass = `flex items-center text-[0.5rem] xs:text-[0.5rem] sm:text-[0.7rem] lg:text-[1rem]`;

  return (
    <li
      ref={ref}
      className={`player px-4 py-2 bg-secondary flex w-full items-center justify-around rounded-md transition-opacity ${!player.connected ? "opacity-40" : ""} ${player.status === 'bankrupt' ? "opacity-50 grayscale pointer-events-none" : ""}`}
    >
      {/* LEFT — Player Info */}
      <div className="flex h-full w-full gap-2 items-center ">
        <img className="h-[6vw] w-[6vw] sm:h-[8vw] sm:w-[8vw] sm:m-1 max-w-[52px] max-h-[52px]" src={AvatarColorMap[player.color]} alt="" />
        {/* Name */}
        <div className="flex h-full flex-col justify-around">
          <span className={`${textSizeClass} text-[${player.color}]`}>
            {player.name}
            {isYou && " (You)"}
            {!player.connected && " [Disconnected]"}
            {isLeader && <span className="ml-1">👑</span>}
          </span>
        </div>
      </div>

      {/* RIGHT — Actions */}
      {isLobbyPhase && leaderAccess && !isYou && (
        <button onClick={handleKickPlayer} className="text-xs mr-2" title="Kick player">
          ❌
        </button>
      )}
      {!isLobbyPhase && (
        <div className="flex flex-col justify-around h-full">
          <div className="flex items-center gap-1 justify-start whitespace-nowrap">      
            <div className="flex justify-start gap-3">
              <PlayerMoney playerId={player.id} />
            </div>
          </div>
        </div>
      )}
    </li>
  );
};

export default Player;
