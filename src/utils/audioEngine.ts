// Web Audio API synthesizer + Korean Web Speech TTS

class AudioEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', delay = 0, volume = 0.12) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playPop() {
    this.playTone(540, 0.07, 'triangle', 0, 0.09);
  }

  playCoin() {
    this.playTone(987.77, 0.09, 'sine', 0, 0.1);
    this.playTone(1318.51, 0.18, 'sine', 0.07, 0.1);
  }

  playCorrect() {
    this.playTone(523.25, 0.11, 'triangle', 0, 0.13);
    this.playTone(659.25, 0.11, 'triangle', 0.09, 0.13);
    this.playTone(783.99, 0.22, 'triangle', 0.18, 0.15);
  }

  playCombo() {
    this.playTone(587.33, 0.1, 'triangle', 0, 0.13);
    this.playTone(739.99, 0.1, 'triangle', 0.08, 0.13);
    this.playTone(880, 0.12, 'triangle', 0.16, 0.14);
    this.playTone(1174.66, 0.28, 'sine', 0.24, 0.16);
  }

  playWrong() {
    this.playTone(280, 0.16, 'sawtooth', 0, 0.07);
    this.playTone(210, 0.24, 'sawtooth', 0.14, 0.07);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, idx === 3 ? 0.42 : 0.13, 'triangle', idx * 0.11, 0.15);
    });
  }
}

export const audioEngine = new AudioEngine();

export function speakKorean(text: string, rate = 0.88): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const cleanForSpeech = text
        .replace(/\./g, '')
        .replace(/!/g, '')
        .replace(/\?/g, '')
        .replace(/,/g, ', ');

      const utter = new SpeechSynthesisUtterance(cleanForSpeech);
      utter.lang = 'ko-KR';
      utter.rate = rate;
      utter.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const koVoice = voices.find((v) => v.lang.toLowerCase().includes('ko'));
      if (koVoice) {
        utter.voice = koVoice;
      }

      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.speak(utter);
    } catch {
      resolve();
    }
  });
}
