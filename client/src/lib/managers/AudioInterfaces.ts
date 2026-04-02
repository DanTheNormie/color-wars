export interface PlaybackOptions {
  volume?: number;
  pitch?: number;
  loop?: boolean;
  fade?: number;
  rate?: number;
}

export type AudioCategory = "sfx" | "music" | "ui";

export interface ISoundEvent {
  id: string;
  category: AudioCategory;
  src: string[];
  options?: PlaybackOptions;
}

export interface IAudioService {
  play(id: string, options?: PlaybackOptions): void;
  stop(id: string): void;
  stopAll(): void;
  setVolume(category: AudioCategory, volume: number): void;
  mute(category: AudioCategory, muted: boolean): void;
}

export type AudioTriggerType = "once" | "loop" | "random_pitch" | "sequence";

export interface AudioTrigger {
  soundId: string;
  type: AudioTriggerType;
  config?: PlaybackOptions & {
    pitchRange?: [number, number];
  };
}
