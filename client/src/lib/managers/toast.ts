// SoundManager.ts
import { GameEventBus } from "@/lib/managers/GameEventBus";
// import { toast } from "sonner";
class ToastManager {
  private unsubs: (() => void)[] = [];

  init() {
    this.unsubs.push(
      GameEventBus.on("UPDATE_NETWORK_STATE", ({ state }) => {
        switch (state) {
          case "connected":
            //toast.success(state, { toasterId: "center" });
            break;
          case "connecting":
          case "reconnecting":
            //toast.info(state);
            break;
          default:
            //toast(state);
        }
      }),
      GameEventBus.on('KICKED', () => {
        //toast.success(reason, {toasterId: 'center'})
      }),
      GameEventBus.on('TOAST', () => {
        //toast[type](content, { toasterId: "center", duration: 1000 })
      })
    );
  }

  destroy() {
    this.unsubs.forEach((fn) => fn());
    this.unsubs = [];
  }
}

export const toastManager = new ToastManager();
