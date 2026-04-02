import type { LocalEventType } from "./GameEventBus";
import type { AudioTrigger } from "./AudioInterfaces";

export const AUDIO_MAP: Partial<Record<LocalEventType, AudioTrigger[]>> = {
  UPDATE_DICE_STATE: [
    {
      soundId: "dice_roll",
      type: "random_pitch",
      config: { pitchRange: [0.9, 1.1] }
    }
  ],
  UPDATE_PLAYER_MONEY: [
    {
      soundId: "coin_collect",
      type: "once"
    }
  ],
  VICTORY_LAP_STARTED: [
    {
      soundId: "victory_fanfare",
      type: "once"
    },
    {
      soundId: "victory_music",
      type: "loop",
      config: { volume: 0.5, fade: 1000 }
    }
  ],
  UPDATE_ROOM_PHASE: [
    {
      soundId: "phase_transition",
      type: "once"
    }
  ],
  UPDATE_TURN_PHASE: [
    {
      soundId: "phase_transition",
      type: "once"
    }
  ],
  TOAST: [
    {
      soundId: "ui_notification",
      type: "once"
    }
  ]
};
