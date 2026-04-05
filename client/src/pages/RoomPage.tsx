import { useLayoutEffect, useState, lazy, Suspense, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "@/stores/sessionStore";
import { useNetworkStore } from "@/stores/networkStore";
import { useCountdown } from "@/hooks/useCountdown";
import { httpEndpoint } from "@/lib/serverConfig";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Gamepad2, Play, Copy, Check } from "lucide-react";
import { soundManager } from "@/lib/managers/sound";

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
// const GameOverOverlay = lazy(() => import("@/components/GameOverOverlay"));
// const VictoryOverlay = lazy(() => import("@/components/VictoryOverlay"));

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
  const winnerId = useStore((z) => z.winnerId);
  const isGameOver = !!winnerId;

  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);

  useEffect(() => {
    soundManager.onProgress((p) => setAudioProgress(p));
  }, []);
  
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
    if (!playerName || !playerName.trim()) {
      setNameError("Please enter a player name");
      return;
    }
    setNameError(null);
    setIsJoining(true);
    setIsPreparingAudio(true);
    try {
      // Step 1: Prepare Audio Assets
      await soundManager.prepare();
      setIsPreparingAudio(false);

      // Step 2: Join Room
      await joinRoom(roomId);
    } catch (err) {
      console.error(err);
      setInfoError("Failed to join room or load assets.");
    } finally {
      setIsJoining(false);
      setIsPreparingAudio(false);
    }
  };

  if (!rehydrated || networkState === "connecting" || networkState === "reconnecting" || isJoining) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <p className="text-xl text-white">
          {isPreparingAudio ? `Preparing Audio Assets: ${Math.round(audioProgress)}%` : "Connecting..."}
        </p>
        {isPreparingAudio && (
          <div className="mt-8 h-2 w-64 overflow-hidden rounded-full">
            <div 
              className="h-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${audioProgress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  if (autoReconnect.inprogress && autoReconnect.attempt < 3) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-xl text-white">connection lost. retrying in {remainingSeconds}s...</p>
      </div>
    );
  }

  if (networkState === "disconnected") {
    if (infoError) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="flex h-full w-full flex-col items-center justify-center text-center">
            <h1 className="text-xl mb-4 text-white">{infoError}</h1>
            <Button color="violet" className="text-white mt-4" onClick={() =>{ navigate("/"); window.location.reload()}}>
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
              <h1 className="text-xl mb-4 text-white">Game has already started</h1>
              <Button color="violet" className="text-white mt-4" onClick={() => { navigate("/"); window.location.reload()}}>
                Go to Lobby
              </Button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="bg-background relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 font-sans text-white">
            <div className="z-10 w-full max-w-md space-y-8 md:space-y-10">
              <div className="relative space-y-6">
                <div className="flex flex-col gap-2">
                  <div className="relative group">
                    <Gamepad2 className="absolute top-3.5 left-3 h-5 w-5 text-zinc-500 group-focus-within:text-cyan-500" />
                    <Input
                      value={playerName}
                      onChange={(e) => { setPlayerName(e.target.value); setNameError(null); }}
                      placeholder="Player Name"
                      className={`bg-background h-12 pl-10 text-lg text-zinc-100 focus-visible:ring-0 ${nameError ? 'border-red-500 focus-visible:border-red-500' : 'border-zinc-800 focus-visible:border-cyan-500'}`}
                    />
                  </div>
                  {nameError && <p className="text-red-500 text-sm pl-1">{nameError}</p>}
                </div>
                <Button color="violet" className="h-12 text-white w-full group/btn" onClick={handleJoinRoom}>
                  <Play className="h-4 w-4 fill-white transition-transform group-hover/btn:rotate-12 group-hover/btn:fill-white" />
                  JOIN ROOM
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
          <h1 className="text-xl text-white">Connection Lost</h1>
          <Button className="mt-4" onClick={() => { navigate("/"); window.location.reload()}}>
            Return to Lobby
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Suspense 
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <p className="text-xl text-white animate-pulse">Loading Game...</p>
        </div>
      }
    >
      <div className="flex w-full mt-4 flex-col items-center justify-center">
        <div id='game-container' className="w-full max-w-180 pb-[100vh] px-2 relative">
          <div className="flex justify-center w-full relative" style={{ display: isGameOver ? 'none' : '' }}>
            <NowPlayingHeader />
          </div>
          <PixiCanvas key="stable-pixi-canvas" />
          {roomPhase === 'lobby' && <CopyLinkButton />}
            <PlayersStatus />
            <GameActions />
          <div className={isGameOver ? "hidden" : "contents"}>
            <TradesList />
            <UserAssets />
            <Suspense fallback={null}>
              <CardSelectionOverlay />
              <VFXLayer />
              <TerritoryTooltip />
            </Suspense>
          </div>

          <ActionArea>
            <Suspense fallback={null}>
              {isGameOver ? (
                <Button onClick={() => { navigate("/"); window.location.reload()}} className=" w-20 h-12 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white">
                  Return to Lobby
                </Button>
              ) : (
                <>
                  {roomPhase === "active" && <TurnControls />}
                  {roomPhase === "lobby" && <LobbyActions />}
                </>
              )}
            </Suspense>
          </ActionArea>
        </div>
      </div>
    </Suspense>
  );
};

const CopyLinkButton = () => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex w-full justify-center my-4 z-10 relative">
      <div className="flex w-full items-center justify-between gap-3 rounded-lg border-2 border-dashed border-secondary bg-background p-3">
        <div className="flex-1 text-sm overflow-x-scroll text-center text-nowrap text-zinc-400 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {window.location.href}
        </div>
        <Button 
          onClick={handleCopy}
          className="shrink-0 bg-secondary text-white hover:bg-secondary/80"
        >
          {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4 text-white" />}
          {copied ? "Copied" : "Copy Invite Link"}
        </Button>
      </div>
    </div>
  );
};

export default RoomPage;
