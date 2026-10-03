import {
  AudioPreferences,
  DEFAULT_AUDIO_PREFERENCES,
  normalizeAudioPreferences,
} from '@/types/user';

export type SoundName =
  | 'button'
  | 'send'
  | 'receive'
  | 'success'
  | 'error'
  | 'open'
  | 'notification';

export type MusicTheme = 'listen' | 'laugh' | 'encourage' | 'anything';
export type MusicName = MusicTheme | 'ambient';

export const SOUND_ASSET_CANDIDATES: Record<SoundName, string[]> = {
  button: ['sounds/button.mp3', '/sounds/button.mp3', '/src/assets/sounds/button.mp3'],
  send: ['sounds/send.mp3', '/sounds/send.mp3', '/src/assets/sounds/send.mp3'],
  receive: ['sounds/receive.mp3', '/sounds/receive.mp3', '/src/assets/sounds/receive.mp3'],
  success: ['sounds/success.mp3', '/sounds/success.mp3', '/src/assets/sounds/success.mp3'],
  error: ['sounds/error.mp3', '/sounds/error.mp3', '/src/assets/sounds/error.mp3'],
  open: ['sounds/open.mp3', '/sounds/open.mp3', '/src/assets/sounds/open.mp3'],
  notification: ['sounds/notification.mp3', '/sounds/notification.mp3', '/src/assets/sounds/notification.mp3'],
};

export const MUSIC_ASSET_CANDIDATES: Record<MusicName, string[]> = {
  listen: [
    'music/midnight-notes-on-the-floor.mp3',
    '/music/midnight-notes-on-the-floor.mp3',
    '/src/assets/music/midnight-notes-on-the-floor.mp3',
  ],
  laugh: [
    'music/blossoms-on-the-pavement.mp3',
    '/music/blossoms-on-the-pavement.mp3',
    '/src/assets/music/blossoms-on-the-pavement.mp3',
  ],
  encourage: [
    'music/dust-in-the-curtains.mp3',
    '/music/dust-in-the-curtains.mp3',
    '/src/assets/music/dust-in-the-curtains.mp3',
  ],
  anything: [
    'music/sunny-app-ambience.mp3',
    '/music/sunny-app-ambience.mp3',
    '/src/assets/music/sunny-app-ambience.mp3',
  ],
  ambient: [
    'music/sunny-app-ambience.mp3',
    '/music/sunny-app-ambience.mp3',
    '/src/assets/music/sunny-app-ambience.mp3',
  ],
};

export const SOUND_ASSETS: Record<SoundName, string> = {
  button: 'sounds/button.mp3',
  send: 'sounds/send.mp3',
  receive: 'sounds/receive.mp3',
  success: 'sounds/success.mp3',
  error: 'sounds/error.mp3',
  open: 'sounds/open.mp3',
  notification: 'sounds/notification.mp3',
};

export const MUSIC_ASSETS: Record<MusicName, string> = {
  listen: 'music/midnight-notes-on-the-floor.mp3',
  laugh: 'music/blossoms-on-the-pavement.mp3',
  encourage: 'music/dust-in-the-curtains.mp3',
  anything: 'music/sunny-app-ambience.mp3',
  ambient: 'music/sunny-app-ambience.mp3',
};

class AudioService {
  private settings: AudioPreferences = { ...DEFAULT_AUDIO_PREFERENCES };
  private currentMusicAudio: HTMLAudioElement | null = null;
  private currentMusicName: MusicName | null = null;
  private isMusicPaused: boolean = false;
  private failedAssets = new Set<string>();
  private audioUnlocked = false;

  constructor() {
    this.initAutoplayUnlock();
  }

  /**
   * Register a user interaction listener to unlock HTML5 Audio on mobile/browser autoplay restrictions.
   */
  private initAutoplayUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      if (this.audioUnlocked) return;
      this.audioUnlocked = true;
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);

      // If music was requested before unlock, attempt playback now
      if (this.settings.musicEnabled && this.currentMusicAudio && this.isMusicPaused) {
        void this.resumeMusic();
      }
    };

    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  /**
   * Update audio configuration and sync volume/music state.
   */
  public updateSettings(updates: Partial<AudioPreferences>) {
    const prevSoundEnabled = this.settings.soundEnabled;
    const prevMusicEnabled = this.settings.musicEnabled;

    this.settings = normalizeAudioPreferences({
      ...this.settings,
      ...updates,
    });

    // Handle music toggle changes
    if (!this.settings.musicEnabled && prevMusicEnabled) {
      this.pauseMusic();
    } else if (this.settings.musicEnabled && !prevMusicEnabled) {
      void this.playMusic(this.currentMusicName || 'anything');
    }

    // Update active music volume if playing
    if (this.currentMusicAudio) {
      this.currentMusicAudio.volume = this.getEffectiveMusicVolume();
    }

    // Handle sound toggle changes
    if (!this.settings.soundEnabled && prevSoundEnabled) {
      // Sound disabled
    }
  }

  public getSettings(): AudioPreferences {
    return { ...this.settings };
  }

  public setMuted(muted: boolean) {
    this.updateSettings({ soundEnabled: !muted });
  }

  public setMasterVolume(volume: number) {
    this.updateSettings({ masterVolume: volume });
  }

  public setSfxVolume(volume: number) {
    this.updateSettings({ sfxVolume: volume });
  }

  public setMusicVolume(volume: number) {
    this.updateSettings({ musicVolume: volume });
  }

  private getEffectiveSfxVolume(): number {
    const volume = this.settings.masterVolume * this.settings.sfxVolume;
    return Math.max(0, Math.min(1, volume));
  }

  private getEffectiveMusicVolume(): number {
    const volume = this.settings.masterVolume * this.settings.musicVolume;
    return Math.max(0, Math.min(1, volume));
  }

  public isAssetAvailable(name: SoundName | MusicName): boolean {
    const candidates = SOUND_ASSET_CANDIDATES[name as SoundName] || MUSIC_ASSET_CANDIDATES[name as MusicName] || [];
    return candidates.some((path) => !this.failedAssets.has(path));
  }

  /**
   * Plays a short sound effect safely without blocking or throwing errors.
   */
  public async play(sound: SoundName): Promise<void> {
    if (!this.settings.soundEnabled) return;
    const effectiveVolume = this.getEffectiveSfxVolume();
    if (effectiveVolume <= 0) return;

    const candidates = SOUND_ASSET_CANDIDATES[sound] || [];
    const availableCandidates = candidates.filter((path) => !this.failedAssets.has(path));
    if (availableCandidates.length === 0) return;

    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;

    for (const assetPath of availableCandidates) {
      try {
        const audio = new Audio(assetPath);
        audio.volume = effectiveVolume;

        let failed = false;
        audio.onerror = () => {
          this.failedAssets.add(assetPath);
          failed = true;
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise.catch((err) => {
            if (err?.name === 'NotSupportedError' || err?.message?.includes('404')) {
              this.failedAssets.add(assetPath);
              failed = true;
            }
          });
        }

        if (!failed) {
          return;
        }
      } catch {
        this.failedAssets.add(assetPath);
      }
    }
  }

  /**
   * Plays background music theme cleanly without duplicate instances or unnecessary restarts.
   */
  public async playMusic(musicName: MusicName = 'anything'): Promise<void> {
    if (!this.settings.musicEnabled) return;
    const effectiveVolume = this.getEffectiveMusicVolume();

    const candidates = MUSIC_ASSET_CANDIDATES[musicName] || MUSIC_ASSET_CANDIDATES.anything;
    const availableCandidates = candidates.filter((path) => !this.failedAssets.has(path));
    if (availableCandidates.length === 0) return;

    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;

    // If the same music track/theme is already created and playing, do NOT restart from 0:00!
    if (this.currentMusicAudio && this.currentMusicName === musicName) {
      this.currentMusicAudio.volume = effectiveVolume;
      if (this.currentMusicAudio.paused) {
        try {
          const playPromise = this.currentMusicAudio.play();
          if (playPromise !== undefined) {
            await playPromise.catch((err) => {
              if (err?.name === 'NotAllowedError') {
                this.isMusicPaused = true;
              } else {
                this.failedAssets.add(this.currentMusicAudio?.src || '');
              }
            });
          }
          this.isMusicPaused = false;
        } catch {
          this.failedAssets.add(this.currentMusicAudio?.src || '');
        }
      }
      return;
    }

    // Stop existing music cleanly before starting the new track
    this.stopMusic();

    for (const assetPath of availableCandidates) {
      try {
        const audio = new Audio(assetPath);
        audio.loop = true;
        audio.volume = effectiveVolume;
        this.currentMusicAudio = audio;
        this.currentMusicName = musicName;
        this.isMusicPaused = false;

        let failed = false;
        audio.onerror = () => {
          this.failedAssets.add(assetPath);
          failed = true;
          this.currentMusicAudio = null;
          this.currentMusicName = null;
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise.catch((err) => {
            if (err?.name === 'NotAllowedError') {
              this.isMusicPaused = true;
            } else {
              this.failedAssets.add(assetPath);
              failed = true;
              this.currentMusicAudio = null;
              this.currentMusicName = null;
            }
          });
        }

        if (!failed) {
          return;
        }
      } catch {
        this.failedAssets.add(assetPath);
        this.currentMusicAudio = null;
        this.currentMusicName = null;
      }
    }
  }

  public pauseMusic(): void {
    if (this.currentMusicAudio && !this.currentMusicAudio.paused) {
      try {
        this.currentMusicAudio.pause();
      } catch {
        // Ignore pause errors
      }
    }
    this.isMusicPaused = true;
  }

  public async resumeMusic(): Promise<void> {
    if (!this.settings.musicEnabled) return;
    if (this.currentMusicAudio) {
      this.currentMusicAudio.volume = this.getEffectiveMusicVolume();
      try {
        const playPromise = this.currentMusicAudio.play();
        if (playPromise !== undefined) {
          await playPromise.catch(() => {
            this.isMusicPaused = true;
          });
        }
        this.isMusicPaused = false;
      } catch {
        this.isMusicPaused = true;
      }
    } else if (this.currentMusicName) {
      await this.playMusic(this.currentMusicName);
    }
  }

  public stopMusic(): void {
    if (this.currentMusicAudio) {
      try {
        this.currentMusicAudio.pause();
        this.currentMusicAudio.currentTime = 0;
      } catch {
        // Ignore stop errors
      }
      this.currentMusicAudio = null;
    }
    this.currentMusicName = null;
    this.isMusicPaused = false;
  }
}

export const audioService = new AudioService();
