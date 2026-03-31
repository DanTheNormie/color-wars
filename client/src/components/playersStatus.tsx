import Player from "./Player";
import { useStore } from "@/stores/sessionStore";

const PlayersStatus = () => {
  const players = useStore((z) => z.state.game.players);

  return (
    <div className="flex w-full justify-center">
      <ul className=" flex w-full flex-col bg-secondary overflow-hidden rounded-sm">
        {Object.values(players).map((player: any) => (
          <Player key={player.id} player={player} />
        ))}
      </ul>
    </div>
  );
};

export default PlayersStatus;
