// Audio Manager - Vanilla JS for Astro
// Maneja audio global con fade in/out, mute master, prioridad de videos

type AudioState = 'playing' | 'paused' | 'muted' | 'fading-in' | 'fading-out';

interface AudioManagerConfig {
  src: string;
  initialVolume?: number;
  fadeDuration?: number;
  loop?: boolean;
  autoplay?: boolean;
}

class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private config: Required<AudioManagerConfig>;
  private state: AudioState = 'paused';
  private muteButton: HTMLButtonElement | null = null;
  private volumeBeforeMute: number = 0;
  private fadeInterval: number | null = null;
  private userInteracted: boolean = false;
  private videoPlaying: boolean = false;
  private pendingPlay: boolean = false;

  constructor(config: AudioManagerConfig) {
    this.config = {
      src: config.src,
      initialVolume: config.initialVolume ?? 0.3,
      fadeDuration: config.fadeDuration ?? 800,
      loop: config.loop ?? true,
      autoplay: config.autoplay ?? false
    };

    this.init();
    this.bindUserInteraction();
  }

  private init(): void {
    this.audio = new Audio(this.config.src);
    this.audio.loop = this.config.loop;
    this.audio.volume = 0;
    this.audio.preload = 'auto';

    this.audio.addEventListener('canplaythrough', () => {
      if (this.pendingPlay && this.userInteracted) {
        this.play();
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.config.loop) {
        this.audio!.currentTime = 0;
        this.play();
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
    });
  }

  private bindUserInteraction(): void {
    const enableAudio = () => {
      this.userInteracted = true;
      if (this.pendingPlay) {
        this.play();
      }
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };

    document.addEventListener('click', enableAudio, { once: true, passive: true });
    document.addEventListener('keydown', enableAudio, { once: true, passive: true });
    document.addEventListener('touchstart', enableAudio, { once: true, passive: true });
  }

  public setMuteButton(button: HTMLButtonElement): void {
    this.muteButton = button;
    this.updateMuteButton();
    button.addEventListener('click', () => this.toggleMute());
  }

  public play(): Promise<void> | void {
    if (!this.audio) return;

    if (!this.userInteracted) {
      this.pendingPlay = true;
      return;
    }

    this.pendingPlay = false;

    if (this.state === 'muted') return;

    this.fadeIn();
  }

  public pause(): void {
    if (!this.audio) return;
    this.fadeOut(() => {
      this.audio!.pause();
      this.state = 'paused';
      this.updateMuteButton();
    });
  }

  public toggleMute(): void {
    if (this.state === 'muted') {
      this.unmute();
    } else {
      this.mute();
    }
  }

  public mute(): void {
    this.volumeBeforeMute = this.audio?.volume ?? this.config.initialVolume;
    this.fadeOut(() => {
      if (this.audio) {
        this.audio.volume = 0;
        this.audio.pause();
      }
      this.state = 'muted';
      this.updateMuteButton();
    });
  }

  public unmute(): void {
    if (this.audio) {
      this.audio.volume = 0;
      this.audio.currentTime = 0;
      this.play();
    }
    this.state = 'playing';
    this.updateMuteButton();
  }

  public setVideoPlaying(playing: boolean): void {
    this.videoPlaying = playing;
    if (playing) {
      this.fadeOut(() => {
        if (this.audio) this.audio.volume = 0;
      });
    } else {
      if (this.state !== 'muted') {
        this.fadeIn();
      }
    }
  }

  public getState(): AudioState {
    return this.state;
  }

  public getVolume(): number {
    return this.audio?.volume ?? 0;
  }

  public setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  private fadeIn(): void {
    if (!this.audio) return;
    this.clearFade();

    this.audio.volume = 0;
    this.state = 'fading-in';

    const targetVolume = this.config.initialVolume;
    const startTime = performance.now();
    const duration = this.config.fadeDuration;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(progress);

      if (this.audio) {
        this.audio.volume = targetVolume * eased;
      }

      if (progress < 1) {
        this.fadeInterval = requestAnimationFrame(animate);
      } else {
        this.state = 'playing';
        this.updateMuteButton();
      }
    };

    this.audio.play().catch(() => {
      this.pendingPlay = true;
    });
    this.fadeInterval = requestAnimationFrame(animate);
  }

  private fadeOut(callback?: () => void): void {
    if (!this.audio) {
      callback?.();
      return;
    }
    this.clearFade();
    this.state = 'fading-out';

    const startVolume = this.audio.volume;
    const startTime = performance.now();
    const duration = this.config.fadeDuration;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeInCubic(progress);

      if (this.audio) {
        this.audio.volume = startVolume * (1 - eased);
      }

      if (progress < 1) {
        this.fadeInterval = requestAnimationFrame(animate);
      } else {
        if (this.audio) this.audio.volume = 0;
        callback?.();
      }
    };

    this.fadeInterval = requestAnimationFrame(animate);
  }

  private clearFade(): void {
    if (this.fadeInterval) {
      cancelAnimationFrame(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private easeInCubic(t: number): number {
    return t * t * t;
  }

  private updateMuteButton(): void {
    if (!this.muteButton) return;

    const isMuted = this.state === 'muted';
    const isFading = this.state === 'fading-in' || this.state === 'fading-out';

    this.muteButton.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar');
    this.muteButton.setAttribute('aria-pressed', isMuted.toString());
    this.muteButton.classList.toggle('muted', isMuted);
    this.muteButton.classList.toggle('fading', isFading);

    const icon = this.muteButton.querySelector('.audio-icon');
    if (icon) {
      if (isMuted) {
        icon.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
        `;
      } else {
        icon.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        `;
      }
    }
  }

  public destroy(): void {
    this.clearFade();
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
      this.audio = null;
    }
  }
}

let audioManagerInstance: AudioManager | null = null;

export function initAudioManager(config: AudioManagerConfig): AudioManager {
  if (audioManagerInstance) {
    audioManagerInstance.destroy();
  }
  audioManagerInstance = new AudioManager(config);
  return audioManagerInstance;
}

export function getAudioManager(): AudioManager | null {
  return audioManagerInstance;
}

export { AudioManager, type AudioState, type AudioManagerConfig };