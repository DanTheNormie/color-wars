import { Howl } from "howler";
import { GameEventBus } from "@/lib/managers/GameEventBus";
import type { Unsubscribe } from "@/lib/managers/GameEventBus";
import { AUDIO_MAP } from "./AudioDefinitions";
import { SOUND_ASSETS } from "./SoundRegistry";
import type { IAudioService, AudioCategory, PlaybackOptions, AudioTrigger } from "./AudioInterfaces";

class SoundManager implements IAudioService {
  private sounds: Map<string, Howl> = new Map();
  private unsubs: Unsubscribe[] = [];
  private categories: Record<AudioCategory, { volume: number; muted: boolean }> = {
    sfx: { volume: 1.0, muted: false },
    music: { volume: 0.8, muted: false },
    ui: { volume: 1.0, muted: false }
  };

  private progress: number = 0;
  private isLoaded: boolean = false;
  private onProgressCb?: (progress: number) => void;

  init() {
    //console.log("[SoundManager] Initializing...");
    // We no longer load assets automatically during init to support lazy loading
    this.setupEventListeners();
  }

  public async prepare(): Promise<void> {
    if (this.isLoaded) return Promise.resolve();

    //console.log("[SoundManager] Preparing assets...");
    const total = SOUND_ASSETS.length;
    let loaded = 0;

    return new Promise((resolve) => {
      if (total === 0) {
        this.isLoaded = true;
        this.updateProgress(100);
        return resolve();
      }

      SOUND_ASSETS.forEach((asset) => {
        // If sound already exists, just count it
        if (this.sounds.has(asset.id)) {
          loaded++;
          this.updateProgress((loaded / total) * 100);
          if (loaded === total) {
            this.isLoaded = true;
            resolve();
          }
          return;
        }

        const howl = new Howl({
          src: asset.src,
          loop: asset.options?.loop ?? false,
          volume: asset.options?.volume ?? 1.0,
          autoplay: false,
          onload: () => {
            loaded++;
            this.updateProgress((loaded / total) * 100);
            if (loaded === total) {
              this.isLoaded = true;
              resolve();
            }
          },
          onloaderror: (_id, error) => {
            console.warn(`[SoundManager] Failed to load ${asset.id}:`, error);
            // Still count it as "processed" to avoid blocking forever
            loaded++;
            this.updateProgress((loaded / total) * 100);
            if (loaded === total) {
              this.isLoaded = true;
              resolve();
            }
          }
        });
        this.sounds.set(asset.id, howl);
      });
    });
  }

  private updateProgress(p: number) {
    this.progress = p;
    if (this.onProgressCb) this.onProgressCb(p);
    // Also emit via GameEventBus for non-React consumers
    //GameEventBus.emit("TOAST" as any, { content: `Loading audio: ${Math.round(p)}%`, type: "info" });
  }

  public onProgress(cb: (progress: number) => void) {
    this.onProgressCb = cb;
  }

  public getProgress() {
    return this.progress;
  }

  private setupEventListeners() {
    // Dynamically register listeners based on AUDIO_MAP
    Object.entries(AUDIO_MAP).forEach(([eventName, triggers]) => {
      if (!triggers) return;
      const unsub = GameEventBus.on(eventName as any, (payload) => {
        triggers.forEach((trigger) => this.handleTrigger(trigger, payload));
      });
      this.unsubs.push(unsub);
    });
  }

  private handleTrigger(trigger: AudioTrigger, _payload: any) {
    const options: PlaybackOptions = { ...trigger.config };

    if (trigger.type === "random_pitch" && trigger.config?.pitchRange) {
      const [min, max] = trigger.config.pitchRange;
      options.pitch = Math.random() * (max - min) + min;
    }

    this.play(trigger.soundId, options);
  }

  play(id: string, options?: PlaybackOptions) {
    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`[SoundManager] Sound not found: ${id}`);
      return;
    }

    const asset = SOUND_ASSETS.find(a => a.id === id);
    const category = asset?.category ?? "sfx";
    const categoryConfig = this.categories[category];

    if (categoryConfig.muted) return;

    const volume = (options?.volume ?? 1.0) * categoryConfig.volume;

    sound.volume(volume);

    if (options?.pitch) {
      sound.rate(options.pitch);
    }

    if (options?.fade) {
      sound.fade(0, volume, options.fade);
    }

    sound.play();
  }

  stop(id: string) {
    this.sounds.get(id)?.stop();
  }

  stopAll() {
    this.sounds.forEach((sound) => sound.stop());
  }

  setVolume(category: AudioCategory, volume: number) {
    this.categories[category].volume = volume;
    // Update currently playing sounds in this category
    SOUND_ASSETS.filter(a => a.category === category).forEach(asset => {
      const sound = this.sounds.get(asset.id);
      if (sound && sound.playing()) {
        sound.volume(volume);
      }
    });
  }

  mute(category: AudioCategory, muted: boolean) {
    this.categories[category].muted = muted;
    if (muted) {
      SOUND_ASSETS.filter(a => a.category === category).forEach(asset => {
        this.sounds.get(asset.id)?.stop();
      });
    }
  }

  destroy() {
    //console.log("[SoundManager] Destroying...");
    this.stopAll();
    this.unsubs.forEach((fn) => fn());
    this.unsubs = [];
    this.sounds.forEach((sound) => sound.unload());
    this.sounds.clear();
  }
}

export const soundManager = new SoundManager();
