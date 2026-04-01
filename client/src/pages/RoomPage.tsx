import { useLayoutEffect, useState, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "@/stores/sessionStore";
import { useNetworkStore } from "@/stores/networkStore";
import { useCountdown } from "@/hooks/useCountdown";
import { httpEndpoint } from "@/lib/serverConfig";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Gamepad2, Zap } from "lucide-react";

// Lazy load components
const TurnControls = lazy(() => import("@/components/TurnControls"));
const PlayersStatus = lazy(() => import("@/components/playersStatus"));
const LobbyActions = lazy(() => import("@/components/LobbyActions"));
const ActionArea = lazy(() => import("@/components/ActionArea"));
const PixiCanvas = lazy(() => import("@/components/NewGameBoard/components/PixiCanvas").then(m => ({ default: m.PixiCanvas })));
const CardSelectionOverlay = lazy(() => import("@/lib/cardOverlay").then(m => ({ default: m.CardSelectionOverlay })));
const VFXLayer = lazy(() => import("@/components/vfxOverlayLayer/vfxLayer").then(m => ({ default: m.VFXLayer })));
const TerritoryTooltip = lazy(() => import("@/components/TerritoryTooltip"));
const NowPlayingHeader = lazy(() => import("@/components/NowPlayingHeader"));
const GameActions = lazy(() => import("@/components/gameActions"));
const UserAssets = lazy(() => import("@/components/UserAssets"));
const TradesList = lazy(() => import("@/components/TradesList"));
const GameOverOverlay = lazy(() => import("@/components/GameOverOverlay"));
const VictoryOverlay = lazy(() => import("@/components/VictoryOverlay"));

export interface RoomInfo {
  roomId: string;
  phase: string;
  isPrivate: boolean;
  connectedPlayers: number;
  maxPlayers: number;
  isJoinable: boolean;
}

const RoomPage = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const { state: networkState, autoReconnect } = useNetworkStore();
  const roomPhase = useStore((z) => z.state.room?.phase);
  const tryAutoReconnect = useStore((z) => z.tryAutoReconnect);
  const reconnectionToken = useStore((z) => z.room.reconnectionToken);
  const storedRoomId = useStore((z) => z.room.roomId);
  const { remainingSeconds } = useCountdown(autoReconnect.nextRetryAt);
  const rehydrated = useStore((z) => z.rehydrated);

  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  
  const playerName = useStore((z) => z.room.playerName) || "";
  const setPlayerName = useStore((z) => z.setPlayerName);
  const joinRoom = useStore((z) => z.joinRoom);

  useLayoutEffect(() => {
    const tryReconnect = async () => {
      await tryAutoReconnect();
    };
    if (networkState === "disconnected" && rehydrated) {
      if (reconnectionToken && storedRoomId === roomId) { 
        tryReconnect(); 
      } else if (roomId) {
        fetch(`${httpEndpoint}/matchmaking/room/${roomId}/info`)
          .then(res => {
            if (!res.ok) throw new Error("Room not found");
            return res.json();
          })
          .then(data => setRoomInfo(data))
          .catch(err => setInfoError(err.message));
      } else {
        console.log("navigating to lobby")
        //navigate("/");
      }
    }
  }, [networkState, reconnectionToken, tryAutoReconnect, navigate, rehydrated, roomId, storedRoomId]);

  const handleJoinRoom = async () => {
    if (!roomId) return;
    setIsJoining(true);
    try {
      await joinRoom(roomId);
    } catch (err) {
      console.error(err);
      setInfoError("Failed to join room.");
    } finally {
      setIsJoining(false);
    }
  };

  if (!rehydrated || networkState === "connecting" || networkState === "reconnecting" || isJoining) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-4xl text-white">Connecting...</p>
      </div>
    );
  }

  if (autoReconnect.inprogress && autoReconnect.attempt < 3) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-4xl text-white">connection lost. retrying in {remainingSeconds}s...</p>
      </div>
    );
  }

  if (networkState === "disconnected") {
    if (infoError) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="flex h-full w-full flex-col items-center justify-center text-center">
            <h1 className="text-4xl mb-4 text-white">{infoError}</h1>
            <Button className="mt-4" onClick={() => navigate("/")}>
              Return to Lobby
            </Button>
          </div>
        </div>
      );
    }

    if (roomInfo) {
      if (roomInfo.phase === "active" || roomInfo.phase === "finished") {
        return (
          <div className="flex h-screen w-full items-center justify-center">
            <div className="flex h-full w-full flex-col items-center justify-center text-center">
              <h1 className="text-4xl mb-4 text-white">Game has already started</h1>
              <Button className="mt-4" onClick={() => navigate("/")}>
                Go to Lobby
              </Button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="bg-background relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 font-sans text-white">
            <div className="z-10 w-full max-w-md space-y-8 md:space-y-10">
              <div className="relative space-y-8">
                <Gamepad2 className="absolute top-3.5 left-3 h-5 w-5 text-zinc-500 group-focus-within:text-cyan-500" />
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Player Name"
                  className="bg-background h-12 border-zinc-800 pl-10 text-lg text-zinc-100 focus-visible:border-cyan-500 focus-visible:ring-0"
                />
                <Button className="h-12 w-full" onClick={handleJoinRoom}>
                  JOIN ROOM
                  <Zap className="h-4 w-4 fill-black transition-transform group-hover/btn:rotate-12 group-hover/btn:fill-white" />
                </Button>
              </div>
            </div>
          </div>
        );
      }
    }

    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex h-full w-full flex-col items-center justify-center text-center">
          <h1 className="text-4xl text-white">Connection Lost</h1>
          <Button className="mt-4" onClick={() => navigate("/")}>
            Return to Lobby
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Suspense 
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0c]">
          <p className="text-4xl text-white animate-pulse">Loading Game...</p>
        </div>
      }
    >
      <div className="flex w-full flex-col items-center justify-center">
        <div id='game-container' className="w-full max-w-180 pb-[100vh] px-2 relative">
          
          <NowPlayingHeader />
          <PixiCanvas />
          <PlayersStatus />
          <GameActions />
          <TradesList />
          <UserAssets />
          
          <ActionArea>
            {roomPhase === "active" && <TurnControls />}
            {roomPhase === "lobby" && <LobbyActions />}
          </ActionArea>
          
          <CardSelectionOverlay />
          <GameOverOverlay />
          <VictoryOverlay />
          <VFXLayer />
          <TerritoryTooltip />
        </div>
      </div>
    </Suspense>
  );
};

export default RoomPage;
