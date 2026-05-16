/**
 * Web Audio API sound synthesizer for Buta no Shippo.
 * No external audio libraries – all sounds generated procedurally.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Short noise burst – card being flipped face-up */
  playCardFlip(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const bufferSize = ctx.sampleRate * 0.06;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.8;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch {
      // Silently swallow audio errors
    }
  }

  /** Soft thud – card placed onto the pile */
  playCardPlace(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Silently swallow audio errors
    }
  }

  /** Descending tone – penalty triggered */
  playPenalty(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const now = ctx.currentTime;

      const freqs = [440, 370, 310, 260];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        const start = now + i * 0.1;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.14);
      });
    } catch {
      // Silently swallow audio errors
    }
  }

  /** Ascending arpeggio – win fanfare */
  playWin(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const now = ctx.currentTime;

      const notes = [261.6, 329.6, 392.0, 523.3, 659.3, 783.9];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        const start = now + i * 0.12;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.32);
      });
    } catch {
      // Silently swallow audio errors
    }
  }

  /** Single bell tone – round ends */
  playRoundEnd(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const now = ctx.currentTime;

      // Bell body: sine wave with fast attack, slow decay
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = 880;

      // Bell shimmer: slightly detuned partial
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 1108; // roughly 3rd partial of 880

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.5);
      osc2.stop(now + 1.5);
    } catch {
      // Silently swallow audio errors
    }
  }

  /** Toggle sound on/off */
  toggle(): void {
    this.enabled = !this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const soundManager = new SoundManager();
