import { X, Sword } from "lucide-react";
import { useStore } from "@/stores/sessionStore";
import { AvatarColorMap } from "./Player";
import { createPortal } from "react-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type SabotageModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SabotageModal({ isOpen, onClose }: SabotageModalProps) {
  const players = useStore((s) => s.state.game?.players) || {};
  const currentPlayer = useStore((s) => s.state.game?.players[s.currentPlayer.id]);
  const sendSabotage = useStore((s) => s.sendSabotage);

  if (!isOpen || !currentPlayer) return null;

  // Find victims on the same tile who are not bankrupt and not the current player
  const validVictims = Object.values(players).filter(
    (p) => p.id !== currentPlayer.id && p.position === currentPlayer.position && p.status !== "bankrupt"
  );

  const handleSabotage = (victimId: string) => {
    sendSabotage(victimId);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-sm">
      <div className="w-full max-w-[400px] bg-[#161320] rounded-[24px] shadow-2xl relative flex flex-col pt-6 pb-8 px-6 border border-white/5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <h2 className="text-center text-[#9da2cd] text-lg font-medium mb-6 flex items-center justify-center gap-2">
          <Sword size={20} className="text-rose-500" />
          Sabotage a Player
        </h2>
        <div className="flex flex-col gap-3">
          {validVictims.map((p) => (
            <AlertDialog key={p.id}>
              <AlertDialogTrigger asChild>
                {/* <Button variant={"outline"} className="bg-[#82181AAA]!">🏳️ Leave Game</Button> */}
                <button
                  key={p.id}
                  className="flex items-center justify-between w-full bg-[#2b253b]/80 hover:bg-rose-950/40 py-4 px-4 rounded-xl transition-colors border border-transparent hover:border-rose-500/30 group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={AvatarColorMap[p.color as keyof typeof AvatarColorMap] || "/avatars/red_round.svg"}
                      className="w-8 h-8 rounded-full bg-zinc-800"
                      alt=""
                    />
                    <span className="text-white font-medium group-hover:text-rose-200 transition-colors">
                      {p.name}
                    </span>
                  </div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sabotage {p.name} ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <span>Are you sure you want to sabotage {p.name}?</span>
                    <br />
                    <span>You will steal 50% of their cash and teleport them back to Start.</span>
                    <br /> <br />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleSabotage(p.id)}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))}
          {validVictims.length === 0 && (
            <p className="text-center text-zinc-500 text-sm mt-4">
              No valid targets on this tile.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
