/**
 * Mesin audio MYSTERY BOX — seluruh musik & efek disintesis orisinal
 * dengan Web Audio API (bebas lisensi, tanpa file eksternal).
 */
type Track = "intro" | "game";

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// Melodi ceria tangga nada C mayor (langkah nada MIDI, 0 = istirahat)
const INTRO_MELODY = [76, 0, 79, 0, 84, 0, 79, 81, 83, 0, 81, 0, 79, 0, 76, 0, 77, 0, 81, 0, 84, 0, 81, 83, 84, 0, 86, 0, 88, 0, 84, 0];
const INTRO_BASS = [48, 0, 55, 0, 48, 0, 55, 0, 45, 0, 52, 0, 45, 0, 52, 0, 50, 0, 57, 0, 50, 0, 57, 0, 43, 0, 50, 0, 48, 0, 55, 0];
const GAME_MELODY = [72, 0, 0, 76, 0, 0, 79, 0, 0, 0, 76, 0, 74, 0, 0, 0, 72, 0, 0, 76, 0, 0, 79, 0, 81, 0, 79, 0, 76, 0, 74, 0];
const GAME_BASS = [48, 0, 0, 0, 43, 0, 0, 0, 45, 0, 0, 0, 41, 0, 0, 0, 48, 0, 0, 0, 43, 0, 0, 0, 45, 0, 0, 0, 47, 0, 0, 0];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private schedTimer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private track: Track | null = null;

  musicVolume = 0.55;
  sfxVolume = 0.85;
  muted = false;
  musicEnabled = true;

  /** Harus dipanggil dari gestur pengguna (kebijakan autoplay browser). */
  ensure() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain();
        this.musicBus.connect(this.master);
        this.sfxBus = this.ctx.createGain();
        this.sfxBus.connect(this.master);
        this.applyVolumes();
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      /* audio tidak tersedia — permainan tetap berjalan */
    }
  }

  private applyVolumes() {
    if (!this.ctx || !this.master || !this.musicBus || !this.sfxBus) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 1, t, 0.02);
    this.musicBus.gain.setTargetAtTime(this.musicEnabled ? this.musicVolume * 0.5 : 0, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.sfxVolume, t, 0.02);
  }

  setMusicVolume(v: number) { this.musicVolume = v; this.applyVolumes(); }
  setSfxVolume(v: number) { this.sfxVolume = v; this.applyVolumes(); }
  setMuted(m: boolean) { this.muted = m; this.applyVolumes(); }
  setMusicEnabled(on: boolean) { this.musicEnabled = on; this.applyVolumes(); }

  private tone(freq: number, when: number, dur: number, type: OscillatorType, gain: number, bus: GainNode) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(bus);
    o.start(when); o.stop(when + dur + 0.05);
  }

  private sweep(f0: number, f1: number, when: number, dur: number, type: OscillatorType, gain: number) {
    if (!this.ctx || !this.sfxBus) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, when);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(this.sfxBus);
    o.start(when); o.stop(when + dur + 0.05);
  }

  private noise(when: number, dur: number, gain: number, hp = 800) {
    if (!this.ctx || !this.sfxBus) return;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass"; f.frequency.value = hp;
    const g = this.ctx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(when);
  }

  private now() { this.ensure(); return this.ctx ? this.ctx.currentTime : 0; }

  playMusic(track: Track) {
    this.ensure();
    if (!this.ctx) return;
    if (this.track === track && this.schedTimer !== null) return;
    this.stopMusic();
    this.track = track;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    const stepDur = 60 / (track === "intro" ? 138 : 112) / 2;
    const tick = () => {
      if (!this.ctx || !this.musicBus || this.track === null) return;
      while (this.nextTime < this.ctx.currentTime + 0.18) {
        const i = this.step % 32;
        const mel = track === "intro" ? INTRO_MELODY : GAME_MELODY;
        const bass = track === "intro" ? INTRO_BASS : GAME_BASS;
        if (mel[i] > 0) {
          this.tone(midi(mel[i]), this.nextTime, stepDur * 0.9, "square", 0.16, this.musicBus);
          this.tone(midi(mel[i]) * 2, this.nextTime, stepDur * 0.5, "triangle", 0.05, this.musicBus);
        }
        if (bass[i] > 0) this.tone(midi(bass[i]), this.nextTime, stepDur * 1.6, "triangle", 0.3, this.musicBus);
        if (i % 4 === 0) this.tone(60, this.nextTime, 0.06, "sine", 0.35, this.musicBus);
        if (i % 8 === 4) this.hatMusic(this.nextTime);
        this.nextTime += stepDur;
        this.step++;
      }
    };
    tick();
    this.schedTimer = window.setInterval(tick, 60);
  }

  private hatMusic(when: number) {
    if (!this.ctx || !this.musicBus) return;
    const len = Math.floor(this.ctx.sampleRate * 0.04);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 6000;
    const g = this.ctx.createGain(); g.gain.value = 0.12;
    src.connect(f); f.connect(g); g.connect(this.musicBus);
    src.start(when);
  }

  stopMusic() {
    if (this.schedTimer !== null) { clearInterval(this.schedTimer); this.schedTimer = null; }
    this.track = null;
  }

  click() { const t = this.now(); this.tone(880, t, 0.07, "triangle", 0.25, this.sfxBus!); }
  pick() {
    const t = this.now();
    this.sweep(200, 900, t, 0.5, "sawtooth", 0.12);
    this.tone(midi(72), t + 0.05, 0.12, "square", 0.2, this.sfxBus!);
  }
  open() {
    const t = this.now();
    this.sweep(120, 1400, t, 0.7, "sawtooth", 0.16);
    this.noise(t + 0.45, 0.5, 0.3, 1500);
    [72, 76, 79, 84, 88].forEach((m, i) => this.tone(midi(m), t + 0.5 + i * 0.07, 0.3, "triangle", 0.22, this.sfxBus!));
  }
  tickTock(urgent: boolean) {
    const t = this.now();
    this.tone(urgent ? 1500 : 1000, t, 0.05, "square", urgent ? 0.3 : 0.16, this.sfxBus!);
  }
  correct() {
    const t = this.now();
    [72, 76, 79, 84].forEach((m, i) => this.tone(midi(m), t + i * 0.09, 0.28, "square", 0.22, this.sfxBus!));
    this.tone(midi(96), t + 0.36, 0.5, "triangle", 0.18, this.sfxBus!);
  }
  wrong() {
    const t = this.now();
    this.sweep(320, 110, t, 0.5, "sawtooth", 0.25);
    this.tone(98, t + 0.1, 0.4, "square", 0.18, this.sfxBus!);
  }
  bonus() {
    const t = this.now();
    [84, 88, 91, 96, 100].forEach((m, i) => this.tone(midi(m), t + i * 0.06, 0.2, "square", 0.2, this.sfxBus!));
  }
  double() {
    const t = this.now();
    this.sweep(200, 1600, t, 0.45, "square", 0.14);
    [67, 72, 76, 79].forEach((m) => this.tone(midi(m), t + 0.4, 0.5, "sawtooth", 0.12, this.sfxBus!));
  }
  challengeHit() {
    const t = this.now();
    for (let i = 0; i < 8; i++) this.noise(t + i * 0.055, 0.05, 0.22, 2500);
    this.tone(midi(79), t + 0.5, 0.35, "square", 0.22, this.sfxBus!);
    this.tone(midi(84), t + 0.65, 0.45, "square", 0.22, this.sfxBus!);
  }
  whoosh() {
    const t = this.now();
    this.noise(t, 0.55, 0.35, 600);
    this.sweep(900, 200, t, 0.5, "sine", 0.2);
  }
  win() {
    this.ensure();
    if (!this.ctx || !this.sfxBus) return;
    const t = this.ctx.currentTime + 0.05;
    const seq = [72, 72, 72, 76, 79, 76, 79, 84];
    const durs = [0.14, 0.14, 0.14, 0.3, 0.14, 0.14, 0.3, 0.9];
    let at = t;
    seq.forEach((m, i) => {
      this.tone(midi(m), at, durs[i] * 0.95, "square", 0.22, this.sfxBus!);
      this.tone(midi(m - 12), at, durs[i] * 0.95, "triangle", 0.2, this.sfxBus!);
      at += durs[i];
    });
    [60, 64, 67, 72].forEach((m) => this.tone(midi(m), at, 1.4, "sawtooth", 0.08, this.sfxBus!));
    this.noise(at, 0.8, 0.25, 3000);
  }
}

export const audio = new AudioEngine();