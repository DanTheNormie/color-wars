import { Button } from "@/components/ui/button";
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
import { useStore } from "@/stores/sessionStore";
import { useNavigate } from "react-router-dom";
const GameActions = () => {
    const navigate = useNavigate()
    const leaveGame = useStore((z) => z.leaveGame)
    const onLeaveGame = () => {
        leaveGame()
        navigate("/")
        window.location.reload()
    }
    const roomPhase = useStore((z) => z.state.room?.phase)
    if (roomPhase !== "active") return null;
    return (
        <div className="flex w-full justify-end mt-4 px-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant={"outline"} className="bg-[#82181AAA]!">🏳️ Leave Game</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Leave Game ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span>Are you sure you want to leave the game?</span>
                            <br />
                            <span>You will lose all your territories and money.</span>
                            <br /> <br />
                            <span>This action cannot be undone.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onLeaveGame}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default GameActions;
