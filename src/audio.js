import { AUDIO } from './config.js';
import { settings, saveSettings } from './settings.js';

const CHORDS = [
  [57, 60, 64],
  [53, 57, 60],
  [48, 52, 55],
  [55, 59, 62],
];

const midi = (note) => 440 * Math.pow(2, (note - 69) / 12);

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.noise = null;
    this.muted = settings.muted;
    this.volume = settings.volume;
    this.musicOn = false;
    this.intensity = 1;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.lastShoot = -1;
    this.lastHit = -1;
  }

  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.build();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  build() {
    const ctx = this.ctx;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.knee.value = 8;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.22;
    limiter.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : AUDIO.master * this.volume;
    this.master.connect(limiter);

    const reverb = ctx.createConvolver();
    reverb.buffer = this.makeImpulse(1.15, 2.8);
    const wet = ctx.createGain();
    wet.gain.value = AUDIO.reverb;
    reverb.connect(wet);
    wet.connect(this.master);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0;
    this.musicBus.connect(this.master);
    this.musicBus.connect(reverb);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = AUDIO.sfx;
    this.sfxBus.connect(this.master);
    this.sfxBus.connect(reverb);

    this.noise = this.makeNoise(2);
  }

  makeImpulse(seconds, decay) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const buffer = this.ctx.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buffer;
  }

  makeNoise(seconds) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const buffer = this.ctx.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMuted(muted) {
    this.muted = muted;
    settings.muted = muted;
    saveSettings();
    if (this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(muted ? 0 : AUDIO.master * this.volume, now, 0.03);
    }
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    settings.volume = this.volume;
    saveSettings();
    if (this.master && !this.muted) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(AUDIO.master * this.volume, now, 0.03);
    }
  }

  setSfx(enabled) {
    settings.sfx = enabled;
    saveSettings();
  }

  setMusic(enabled) {
    settings.music = enabled;
    saveSettings();
    if (!enabled) this.stopMusic();
  }

  tone(type, from, to, duration, gain, when, bus = this.sfxBus, attack = 0.004) {
    const ctx = this.ctx;
    const at = when ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, from), at);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), at + duration);
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(amp);
    amp.connect(bus);
    osc.start(at);
    osc.stop(at + duration + 0.03);
  }

  hiss(duration, gain, type, from, to, when, bus = this.sfxBus) {
    const ctx = this.ctx;
    const at = when ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(Math.max(20, from), at);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + duration);
    filter.Q.value = 0.9;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(bus);
    src.start(at);
    src.stop(at + duration + 0.02);
  }

  sfx(name, opt = {}) {
    if (!this.ctx || this.muted || !settings.sfx) return;
    const t = this.ctx.currentTime;

    switch (name) {
      case 'shoot': {
        if (t - this.lastShoot < 0.14) return;
        this.lastShoot = t;
        const level = opt.level || 1;
        if (opt.weapon === 'lance') {
          this.tone('sawtooth', 900 + level * 35, 280, 0.09, 0.05);
        } else if (opt.weapon === 'scatter') {
          this.tone('square', 720 + level * 30, 300, 0.07, 0.05);
        } else {
          this.tone('triangle', 1450 + level * 55, 620, 0.055, 0.045);
        }
        break;
      }
      case 'hit': {
        if (t - this.lastHit < 0.045) return;
        this.lastHit = t;
        this.hiss(0.035, 0.04, 'highpass', 2600, 1700);
        break;
      }
      case 'kill':
        this.hiss(0.26, 0.13, 'lowpass', 2200, 260);
        this.tone('sine', 190, 48, 0.3, 0.1);
        break;
      case 'pickup':
        this.tone('sine', 880, 1320, 0.09, 0.045);
        break;
      case 'module':
        this.tone('sine', 660, 660, 0.08, 0.04, t);
        this.tone('sine', 880, 880, 0.08, 0.04, t + 0.07);
        this.tone('sine', 1320, 1320, 0.13, 0.045, t + 0.14);
        break;
      case 'shield':
        this.tone('triangle', 520, 1040, 0.2, 0.055);
        break;
      case 'bomb':
        this.hiss(1, 0.28, 'lowpass', 1300, 110);
        this.tone('sine', 110, 30, 1.15, 0.26);
        break;
      case 'hurt':
        this.tone('sawtooth', 300, 70, 0.32, 0.11);
        this.hiss(0.22, 0.09, 'bandpass', 900, 200);
        break;
      case 'warn':
        this.tone('square', 330, 330, 0.13, 0.06, t);
        this.tone('square', 330, 330, 0.13, 0.06, t + 0.19);
        break;
      case 'phase':
        this.tone('sawtooth', 180, 760, 0.42, 0.08);
        this.hiss(0.4, 0.07, 'highpass', 600, 3200);
        break;
      case 'bossDown':
        this.hiss(1.3, 0.28, 'lowpass', 2000, 120);
        this.tone('sine', 120, 28, 1.4, 0.28);
        this.tone('triangle', 240, 60, 0.8, 0.09, t + 0.15);
        break;
      case 'over':
        this.tone('sawtooth', 330, 110, 0.9, 0.11);
        this.hiss(0.6, 0.06, 'lowpass', 900, 200);
        break;
      case 'ui':
        this.tone('sine', 620, 620, 0.05, 0.03);
        break;
      case 'select':
        this.tone('sine', 620, 940, 0.16, 0.055);
        break;
      default:
        break;
    }
  }

  startMusic(intensity = 1) {
    this.intensity = intensity;
    if (!this.ctx || this.musicOn || !settings.music) return;
    this.musicOn = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    const now = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.setTargetAtTime(AUDIO.music, now, 0.5);
    this.timer = setInterval(() => this.pump(), 40);
  }

  stopMusic() {
    if (!this.musicOn) return;
    this.musicOn = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.setTargetAtTime(0, now, 0.18);
  }

  setIntensity(value) {
    this.intensity = value;
  }

  pump() {
    if (!this.ctx || !this.musicOn) return;
    const now = this.ctx.currentTime;
    if (this.nextTime < now - 0.4) this.nextTime = now + 0.05;

    const bpm = this.intensity >= 2 ? 138 : 108;
    const stepDur = 60 / bpm / 4;
    while (this.nextTime < now + 0.16) {
      this.playStep(this.step, this.nextTime);
      this.step = (this.step + 1) % 64;
      this.nextTime += stepDur;
    }
  }

  playStep(step, when) {
    const bus = this.musicBus;
    const chord = CHORDS[Math.floor(step / 16)];
    const boss = this.intensity >= 2;

    if (step % 8 === 0) {
      this.tone('triangle', midi(chord[0] - 24), midi(chord[0] - 24), 0.55, 0.05, when, bus, 0.01);
    }
    if (step % 2 === 0) {
      const note = chord[(step / 2) % chord.length] + 12;
      this.tone('sine', midi(note), midi(note), 0.16, 0.022, when, bus, 0.01);
    }
    if (step % (boss ? 4 : 8) === 0) {
      this.tone('sine', 96, 38, 0.14, 0.07, when, bus, 0.005);
    }
    if ((boss && step % 2 === 1) || (!boss && step % 8 === 6)) {
      this.hiss(0.03, 0.012, 'highpass', 7000, 5000, when, bus);
    }
  }
}
