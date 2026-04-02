import type { ISoundEvent } from "./AudioInterfaces";

export const SOUND_ASSETS: ISoundEvent[] = [
  {
    id: "dice_roll",
    category: "sfx",
    src: ["/audio/sfx/dice_roll.mp3"]
  },
  {
    id: "coin_collect",
    category: "sfx",
    src: ["/audio/sfx/coin_collect.mp3"]
  },
  {
    id: "victory_fanfare",
    category: "sfx",
    src: ["/audio/sfx/victory_fanfare.mp3"]
  },
  {
    id: "victory_music",
    category: "music",
    src: ["/audio/sfx/victory_music.mp3"],
    options: { loop: true }
  },
  {
    id: "phase_transition",
    category: "ui",
    src: ["/audio/ui/phase_transition.mp3"]
  },
  {
    id: "ui_notification",
    category: "ui",
    src: ["/audio/ui/ui_notification.mp3"]
  }
];
