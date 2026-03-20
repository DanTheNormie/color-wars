import Player from "./Player";
import { useStore } from "@/stores/sessionStore";

const PlayersStatus = () => {
  const players = useStore((z) => z.state.game.players);

  return (
    <div className="flex w-full justify-center py-1 px-2">
      <ul className=" flex w-full flex-col gap-2 overflow-hidden rounded-sm p-[2%]">
        {Object.values(players).map((player) => (
          <Player key={player.id} player={player} />
        ))}
      </ul>
    </div>
  );
};

export default PlayersStatus;
