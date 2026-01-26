import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { useState, useRef } from "react";
import type { PlainStateOf, PlayerState } from "@color-wars/shared/src/types/RoomState";
import { useStore } from "@/stores/sessionStore";
import { PLAYER } from "@color-wars/shared/src/config/game";
import { PlayerMoney, PlayerBackpackMoney, PlayerCards, PlayerBackpackCards, PlayerTerritories } from "./Counter";
import { Separator } from "./ui/separator";
import { Avatar } from "./ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";

function PickerPopover({ open, setOpen, enabled, trigger, children }: { open: boolean; setOpen: (v: boolean) => void; enabled: boolean; trigger: React.ReactNode; children: React.ReactNode }) {
  return (
    <Popover open={open} onOpenChange={(v) => setOpen(v && enabled)}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      {enabled && <PopoverContent asChild>{children}</PopoverContent>}
    </Popover>
  );
}

const AvatarColorMap = {
  "#1C1C1E": "/avatars/spy.png",
  "#00E5FF": "/avatars/scientist.png",
  "#D4AF37": "/avatars/rich.png",
  "#8B0000": "/avatars/king.png",
  "#2F5D3A": "/avatars/general.png",
  "#2C4F7C": "/avatars/diplomat.png",
} as { [k: string]: string };

const Player = ({ player }: { player: PlainStateOf<PlayerState> }) => {
  const [openColor, setOpenColor] = useState(false);
  const sessionId = useStore((z) => z.currentPlayer.id);
  const leaderId = useStore((z) => z.state.room.leaderId);
  const isLobbyPhase = useStore((z) => z.state.room.phase == "lobby");
  const players = useStore((z) => z.state.game.players);
  const kickPlayer = useStore((z) => z.kickPlayer);
  const ref = useRef<HTMLLIElement>(null);

  const handleKickPlayer = () => {
    kickPlayer(player.id);
  };

  // useGSAP(() => {
  //   const tl = gsap.timeline();
  //   tl.from(ref.current, {
  //     x: 800,
  //     delay: 0.2,
  //     duration: 0.25,
  //     ease: "power2.out",
  //   });
  // });

  // useEffect(() => {
  //   if (!ref.current) return;
  //   const ctx = gsap.context(() => {
  //     gsap.from(ref.current, {
  //       x: 800,
  //       delay: 0.2,
  //       duration: 0.25,
  //       ease: "power2.out",
  //     });
  //   });
  //   return () => ctx.revert();
  // }, []);

  // const takenIcons = Object.values(players)
  //   .map((p) => p.icon)
  //   .filter(Boolean);
  //const availableIcons = PLAYER.ICONS.filter((icon) => !takenIcons.includes(icon));

  const takenColors = Object.values(players)
    .map((p) => p.color)
    .filter(Boolean);
  const availableColors = PLAYER.COLORS.filter((color) => !takenColors.includes(color));
  console.log(player);
  const isYou = player.id === sessionId;
  const isLeader = player.id === leaderId;
  const leaderAccess = leaderId === sessionId;

  const textSizeClass = `flex items-center text-[0.5rem] xs:text-[0.5rem] sm:text-[0.7rem] lg:text-[1rem]`;

  if (isLobbyPhase) {
    return (
      <li
        ref={ref}
        style={{
          backgroundColor: `color-mix(in srgb, var(--secondary) 20%, ${player.color} 10%)`
        }}
        className={`player flex w-full items-center justify-around gap-2 rounded-sm transition-opacity ${!player.connected ? "opacity-40" : ""}`}
      >
        {/* LEFT — Player Info */}
        <div className="flex h-full w-full items-center gap-2 ">
          {/* Color Picker */}
          <PickerPopover
            open={openColor}
            setOpen={setOpenColor}
            enabled={isLobbyPhase && isYou}
            trigger={<span className={`h-full w-2 self-stretch border ${isYou ? "cursor-pointer" : ""}`} style={{ backgroundColor: player.color }} />}
          >
            <div className="grid h-full grid-cols-5 gap-2 p-2">
              {availableColors.map((color) => (
                <button key={color} className="h-full w-6 rounded-full border transition hover:scale-110" style={{ backgroundColor: color }} />
              ))}
            </div>
          </PickerPopover>

          <Avatar className="h-[8vw] w-[8vw] sm:h-[10vw] sm:w-[10vw] sm:m-1">
            <AvatarImage src={AvatarColorMap[player.color]}></AvatarImage>
          </Avatar>
          <div className="flex h-full flex-col justify-around">
            <span className={`${textSizeClass} text-[${player.color}]`}>
              {player.name}
              {isYou && " (You)"}
              {!player.connected && " [Disconnected]"}
              {isLeader && <span className="ml-1">👑</span>}
            </span>
          </div>
        </div>
        {!isLobbyPhase && <Separator className="w-full" orientation="vertical" />}
        {leaderAccess && isLobbyPhase && !isYou && (
          <button onClick={handleKickPlayer} className="text-xs mr-2" title="Kick player">
            ❌
          </button>
        )}
      </li>
    );
  }

  return (
    <li
      ref={ref}
      style={{
        backgroundColor: `color-mix(in srgb, var(--secondary) 20%, ${player.color} 10%)`
      }}
      className={`player border-r border-y border-[#ffffff10] flex w-full items-center justify-around rounded-r-md transition-opacity ${!player.connected ? "opacity-40" : ""}`}
    >
      {/* LEFT — Player Info */}
      <div className="flex h-full w-full gap-2 items-center ">
        {/* Color Picker */}
        <PickerPopover
          open={openColor}
          setOpen={setOpenColor}
          enabled={isLobbyPhase && isYou}
          trigger={<span className={`h-full w-2 self-stretch border ${isYou ? "cursor-pointer" : ""}`} style={{ backgroundColor: player.color }} />}
        >
          <div className="grid h-full grid-cols-5 p-2">
            {availableColors.map((color) => (
              <button key={color} className="h-full w-6 rounded-full border transition hover:scale-110" style={{ backgroundColor: color }} />
            ))}
          </div>
        </PickerPopover>

        <Avatar className="h-[8vw] w-[8vw] sm:h-[10vw] sm:w-[10vw] sm:m-1 max-w-[72px] max-h-[72px]">
          <AvatarImage src={AvatarColorMap[player.color]}></AvatarImage>
        </Avatar>

        {/* Name */}
        <div className="flex h-full flex-col justify-around">
          <span className={`${textSizeClass} text-[${player.color}]`}>
            {player.name}
            {isYou && " (You)"}
            {!player.connected && " [Disconnected]"}
            {isLeader && <span className="ml-1">👑</span>}
          </span>
          {!isLobbyPhase && (
            <div className="flex justify-start gap-3">
              <PlayerMoney playerId={player.id} />
              <PlayerCards playerId={player.id} />
              <PlayerTerritories playerId={player.id} />
            </div>
          )}
        </div>
      </div>
      {!isLobbyPhase && <div className="h-full py-1">
        <Separator className="w-full" orientation="vertical" />
        </div>}

      {/* RIGHT — Actions */}
      {!isLobbyPhase && (
        <div className="mx-2 sm:ml-4 md:mr-6 flex flex-col justify-around h-full">
          <div className="flex items-center gap-1 justify-start whitespace-nowrap">
            <span className={textSizeClass}> 🎒Backpack </span>
            <span className={textSizeClass}> &middot; </span>
            <span className={textSizeClass}> This run </span>
          </div>

          <div className="flex w-full gap-3">
            <PlayerBackpackMoney playerId={player.id} />
            <PlayerBackpackCards playerId={player.id} />
          </div>
        </div>
      )}
    </li>
  );
};

export default Player;
