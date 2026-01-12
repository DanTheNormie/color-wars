import Player from "./Player";
import { useStore } from "@/stores/sessionStore";

const GameStatus = () => {
  const players = useStore((z) => z.state.game.players);

  return (
    <div className="flex w-full justify-center p-4">
      <ul className="bg-secondary flex w-full flex-col gap-2 overflow-hidden rounded-lg p-4">
        {Object.values(players).map((player) => (
          <Player key={player.id} player={player} />
        ))}
      </ul>
    </div>
  );
};

export default GameStatus;
