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
const GameActions = () => {
    const declareBackruptcy = useStore((z) => z.declareBackruptcy)
    const onDeclareBankruptcy = () => {
        declareBackruptcy()
    }
    const roomPhase = useStore((z) => z.state.room?.phase)
    if (roomPhase !== "active") return null;
    return (
        <div className="flex w-full justify-end  px-4">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant={"outline"} className="bg-[#82181AAA]!">🏳️ Declare Bankruptcy</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>File for Bankruptcy</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span>Are you sure you want to file for bankruptcy?</span>
                            <br />
                            <span>You will lose all your territories and money.</span>
                            <br /> <br />
                            <span>This action cannot be undone.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDeclareBankruptcy}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default GameActions;
