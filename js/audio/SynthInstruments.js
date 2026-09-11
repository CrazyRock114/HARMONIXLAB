/**
 * SynthInstruments.js
 * Procedural Musical Instruments synthesized in real-time via Web Audio API.
 * Uses buffer-computed Karplus-Strong physical modeling, calibrated FM synthesis,
 * formant-filtered acoustic instruments, and analog drum synthesis.
 * All levels calibrated for safe, warm, crystal-clear listening without clipping or self-excitation.
 */

import { audioEngine } from './AudioEngine.js';

export class SynthInstruments {
  constructor() {
    this.engine = audioEngine;
  }

  get ctx() {
    return this.engine.ctx;
  }

  /**
   * Helper: Ensure AudioContext is ready
   */
  async ensureAudio() {
    if (!this.engine.isUnlocked) {
      await this.engine.init();
    }
  }

  /**
   * Generic Polyphonic Tone with ADSR Envelope
   */
  playTone(freq, duration = 0.5, type = 'sine', startTime = null, gain = 0.18) {
    if (!this.ctx) return;
    const t = Math.max(this.ctx.currentTime, startTime || this.ctx.currentTime);
    const dur = Math.max(0.04, duration);

    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    // Dynamic ADSR envelope based on duration (strictly monotonic)
    const attack = Math.min(0.02, dur * 0.15);
    const decay = Math.min(0.08, dur * 0.25);
    const sustain = gain * 0.7;
    const release = Math.min(0.1, dur * 0.3);

    const tAtt = t + attack;
    const tDec = tAtt + decay;
    const tRel = Math.max(tDec + 0.005, t + dur - release);
    const tEnd = Math.max(tRel + 0.005, t + dur);

    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(gain, tAtt);
    env.gain.linearRampToValueAtTime(sustain, tDec);
    if (tRel > tDec) {
      env.gain.setValueAtTime(sustain, tRel);
    }
    env.gain.linearRampToValueAtTime(0.0001, tEnd);

    osc.connect(env);
    this.engine.connect(env);

    osc.start(t);
    osc.stop(tEnd + 0.05);

    return { osc, env };
  }

  /**
   * Karplus-Strong Physical Modeling Plucked String (Guzheng, Harp, Acoustic Guitar)
   * Computed directly in an AudioBuffer to ensure mathematical stability,
   * completely eliminating runaway feedback delay loops or self-excitation artifacts.
   */
  playPluck(freq, duration = 1.4, startTime = null, gain = 0.22, brightness = 0.5) {
    if (!this.ctx) return;
    const t = Math.max(this.ctx.currentTime, startTime || this.ctx.currentTime);
    const dur = Math.max(0.04, duration);
    const sampleRate = this.ctx.sampleRate;

    // Constrain frequency to valid range
    const f = Math.max(40, Math.min(3000, freq));
    const period = Math.max(2, Math.round(sampleRate / f));
    const numSamples = Math.max(period * 2, Math.floor(sampleRate * dur));

    // Generate Karplus-Strong string buffer
    const audioBuffer = this.ctx.createBuffer(1, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // Initial excitation: shaped random noise impulse over one period
    for (let i = 0; i < period; i++) {
      const window = Math.sin((Math.PI * i) / period);
      channelData[i] = (Math.random() * 2 - 1) * window;
    }

    // Karplus-Strong averaging feedback loop: y[i] = 0.5 * (y[i - P] + y[i - P - 1]) * decay
    const decayFactor = Math.min(0.994, 0.988 + (80 / f) * 0.005);
    for (let i = period; i < numSamples; i++) {
      const p1 = channelData[i - period];
      const p2 = (i - period - 1 >= 0) ? channelData[i - period - 1] : channelData[i - period];
      channelData[i] = 0.5 * (p1 + p2) * decayFactor;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;

    const env = this.ctx.createGain();
    const tSus = t + dur * 0.7;
    const tEnd = t + dur;
    env.gain.setValueAtTime(gain, t);
    if (tSus > t + 0.005) {
      env.gain.setValueAtTime(gain, tSus);
    }
    env.gain.linearRampToValueAtTime(0.0001, tEnd);

    source.connect(env);
    this.engine.connect(env);

    source.start(t);
    source.stop(tEnd + 0.05);
  }

  /**
   * FM Synthesizer: Rhodes Electric Piano
   * 2-operator frequency modulation with bell-like attack and warm chorus/tremolo
   */
  playRhodes(freq, duration = 1.2, startTime = null, gain = 0.18) {
    if (!this.ctx) return;
    const t = Math.max(this.ctx.currentTime, startTime || this.ctx.currentTime);
    const dur = Math.max(0.04, duration);

    // Carrier Oscillator
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(freq, t);

    // Modulator Oscillator (harmonic ratio 2:1 for crystalline chime)
    const modulator = this.ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(freq * 2, t);

    // Modulation Index Envelope (gentle chime decay)
    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(freq * 0.35, t);
    modGain.gain.linearRampToValueAtTime(0.01, t + Math.min(0.25, dur * 0.6));

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    // Main Amplifier Envelope
    const env = this.ctx.createGain();
    const att = Math.min(0.015, dur * 0.1);
    const dec = Math.min(0.18, dur * 0.4);
    const tAtt = t + att;
    const tDec = tAtt + dec;
    const tEnd = Math.max(tDec + 0.01, t + dur);

    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(gain, tAtt);
    env.gain.linearRampToValueAtTime(gain * 0.5, tDec);
    env.gain.linearRampToValueAtTime(0.0001, tEnd);

    // Separate Tremolo Gain Node in series
    const tremoloGain = this.ctx.createGain();
    tremoloGain.gain.setValueAtTime(0.9, t);

    const tremoloOsc = this.ctx.createOscillator();
    tremoloOsc.type = 'sine';
    tremoloOsc.frequency.setValueAtTime(4.5, t);
    const tremoloAmp = this.ctx.createGain();
    tremoloAmp.gain.setValueAtTime(0.12, t);

    tremoloOsc.connect(tremoloAmp);
    tremoloAmp.connect(tremoloGain.gain);

    carrier.connect(env);
    env.connect(tremoloGain);
    this.engine.connect(tremoloGain);

    modulator.start(t);
    carrier.start(t);
    tremoloOsc.start(t);

    modulator.stop(tEnd);
    carrier.stop(tEnd);
    tremoloOsc.stop(tEnd);
  }

  /**
   * Bamboo Flute / Dizi / Ney
   * Pure sine oscillator + subtle 2nd harmonic + soft breath sound + warm lowpass filter
   */
  playFlute(freq, duration = 1.0, startTime = null, gain = 0.18) {
    if (!this.ctx) return;
    const t = Math.max(this.ctx.currentTime, startTime || this.ctx.currentTime);
    const dur = Math.max(0.04, duration);

    // Tone Oscillator
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Subtle warm 2nd harmonic overtone
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, t);
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.04, t);
    osc2.connect(osc2Gain);

    // Vibrato LFO
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(5.5, t);
    lfoGain.gain.setValueAtTime(0, t);
    const tVib = t + Math.min(0.25, dur * 0.5);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.015, tVib);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Soft breath noise burst at attack
    const noiseDuration = Math.min(0.12, dur * 0.5);
    const bufferSize = Math.max(128, Math.floor(this.ctx.sampleRate * noiseDuration));
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(freq * 1.5, t);
    noiseFilter.Q.setValueAtTime(1.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.015, t);
    noiseGain.gain.linearRampToValueAtTime(0.0001, t + noiseDuration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    // Master Tone Lowpass Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(3000, freq * 3.5), t);
    filter.Q.setValueAtTime(0.7, t);

    const env = this.ctx.createGain();
    const att = Math.min(0.06, dur * 0.2);
    const rel = Math.min(0.08, dur * 0.25);
    const tAtt = t + att;
    const tRel = Math.max(tAtt + 0.005, t + dur - rel);
    const tEnd = Math.max(tRel + 0.005, t + dur);

    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(gain, tAtt);
    if (tRel > tAtt) {
      env.gain.setValueAtTime(gain * 0.85, tRel);
    }
    env.gain.linearRampToValueAtTime(0.0001, tEnd);

    osc.connect(filter);
    osc2Gain.connect(filter);
    noiseGain.connect(filter);
    filter.connect(env);

    this.engine.connect(env);

    osc.start(t);
    osc2.start(t);
    lfo.start(t);
    noise.start(t);

    osc.stop(tEnd);
    osc2.stop(tEnd);
    lfo.stop(tEnd);
    noise.stop(t + noiseDuration);
  }

  /**
   * Bowed String / Violin / Cello
   * Warm sawtooth with gentle lowpass acoustic resonance and natural bowing envelope
   */
  playViolin(freq, duration = 1.0, startTime = null, gain = 0.18) {
    if (!this.ctx) return;
    const t = Math.max(this.ctx.currentTime, startTime || this.ctx.currentTime);
    const dur = Math.max(0.04, duration);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    // Warm body resonance lowpass filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(2200, freq * 3.2), t);
    filter.Q.setValueAtTime(0.8, t);

    // Natural Vibrato
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(6.0, t);
    lfoGain.gain.setValueAtTime(0, t);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.012, t + Math.min(0.2, dur * 0.5));
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const env = this.ctx.createGain();
    const att = Math.min(0.06, dur * 0.2);
    const rel = Math.min(0.08, dur * 0.25);
    const tAtt = t + att;
    const tRel = Math.max(tAtt + 0.005, t + dur - rel);
    const tEnd = Math.max(tRel + 0.005, t + dur);

    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(gain, tAtt);
    if (tRel > tAtt) {
      env.gain.setValueAtTime(gain * 0.8, tRel);
    }
    env.gain.linearRampToValueAtTime(0.0001, tEnd);

    osc.connect(filter);
    filter.connect(env);
    this.engine.connect(env);

    osc.start(t);
    lfo.start(t);
    osc.stop(tEnd);
    lfo.stop(tEnd);
  }

  /**
   * Harpsichord / Baroque Continuo
   * Snappy metallic tone with upper register clarity
   */
  playHarpsichord(freq, duration = 0.8, startTime = null, gain = 0.15) {
    if (!this.ctx) return;
    const t = Math.max(this.ctx.currentTime, startTime || this.ctx.currentTime);
    const dur = Math.max(0.04, duration);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, t);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 2, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, t);

    const env = this.ctx.createGain();
    const tDec = t + Math.min(0.12, dur * 0.4);
    const tEnd = Math.max(tDec + 0.01, t + dur);

    env.gain.setValueAtTime(gain, t);
    env.gain.linearRampToValueAtTime(gain * 0.3, tDec);
    env.gain.linearRampToValueAtTime(0.0001, tEnd);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(env);
    this.engine.connect(env);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(tEnd);
    osc2.stop(tEnd);
  }

  /**
   * Retro Synth Lead / Cyberpunk Arp Bass
   */
  playSynth(freq, duration = 0.6, startTime = null, gain = 0.18, isBass = false) {
    if (!this.ctx) return;
    const t = Math.max(this.ctx.currentTime, startTime || this.ctx.currentTime);
    const dur = Math.max(0.04, duration);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, t);

    const osc2 = this.ctx.createOscillator();
    osc2.type = isBass ? 'triangle' : 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.003, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const startCutoff = isBass ? 700 : 2200;
    const endCutoff = isBass ? 120 : 500;
    filter.frequency.setValueAtTime(startCutoff, t);
    filter.frequency.linearRampToValueAtTime(endCutoff, t + dur * 0.7);
    filter.Q.setValueAtTime(1.5, t);

    const env = this.ctx.createGain();
    const att = Math.min(0.015, dur * 0.1);
    const dec = Math.min(0.12, dur * 0.35);
    const tAtt = t + att;
    const tDec = tAtt + dec;
    const tEnd = Math.max(tDec + 0.01, t + dur);

    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(gain, tAtt);
    env.gain.linearRampToValueAtTime(gain * 0.6, tDec);
    env.gain.linearRampToValueAtTime(0.0001, tEnd);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(env);
    this.engine.connect(env);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(tEnd);
    osc2.stop(tEnd);
  }

  /**
   * Deep Warm Bass (Upright, Dub Sub, or Reggae)
   */
  playBass(freq, duration = 0.8, startTime = null, gain = 0.22, style = 'upright') {
    if (!this.ctx) return;
    const t = Math.max(this.ctx.currentTime, startTime || this.ctx.currentTime);
    const dur = Math.max(0.04, duration);

    const osc = this.ctx.createOscillator();
    osc.type = style === 'sub' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(style === 'sub' ? 160 : 320, t);

    const env = this.ctx.createGain();
    const att = Math.min(0.02, dur * 0.1);
    const tAtt = t + att;
    const tEnd = Math.max(tAtt + 0.01, t + dur);

    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(gain, tAtt);
    env.gain.linearRampToValueAtTime(0.0001, tEnd);

    osc.connect(filter);
    filter.connect(env);
    this.engine.connect(env);

    osc.start(t);
    osc.stop(tEnd);
  }

  /**
   * Synthesized Drum Machine Elements (Kick, Snare, Hi-Hat, Clave, Bongo, Bodhran)
   */
  playDrum(type = 'kick', startTime = null, velocity = 0.5) {
    if (!this.ctx) return;
    const t = Math.max(this.ctx.currentTime, startTime || this.ctx.currentTime);

    switch (type) {
      case 'kick': {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.linearRampToValueAtTime(42, t + 0.09);

        const kickGain = velocity * 0.35;
        env.gain.setValueAtTime(kickGain, t);
        env.gain.linearRampToValueAtTime(0.0001, t + 0.28);

        osc.connect(env);
        this.engine.connect(env);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      }
      case 'snare': {
        // Snare Tone
        const osc = this.ctx.createOscillator();
        const oscEnv = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(170, t);
        oscEnv.gain.setValueAtTime(velocity * 0.18, t);
        oscEnv.gain.linearRampToValueAtTime(0.0001, t + 0.08);
        osc.connect(oscEnv);
        this.engine.connect(oscEnv);
        osc.start(t);
        osc.stop(t + 0.1);

        // Snare Wires Noise
        const dur = 0.16;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(1200, t);

        const noiseEnv = this.ctx.createGain();
        noiseEnv.gain.setValueAtTime(velocity * 0.22, t);
        noiseEnv.gain.linearRampToValueAtTime(0.0001, t + dur);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseEnv);
        this.engine.connect(noiseEnv);
        noise.start(t);
        noise.stop(t + dur + 0.02);
        break;
      }
      case 'hihat':
      case 'closedHat': {
        const dur = 0.04;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7500, t);

        const env = this.ctx.createGain();
        env.gain.setValueAtTime(velocity * 0.15, t);
        env.gain.linearRampToValueAtTime(0.0001, t + dur);

        noise.connect(filter);
        filter.connect(env);
        this.engine.connect(env);
        noise.start(t);
        noise.stop(t + dur + 0.01);
        break;
      }
      case 'clave':
      case 'woodblock': {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'clave' ? 2200 : 1100, t);

        const claveGain = velocity * 0.22;
        env.gain.setValueAtTime(claveGain, t);
        env.gain.linearRampToValueAtTime(0.0001, t + 0.045);

        osc.connect(env);
        this.engine.connect(env);
        osc.start(t);
        osc.stop(t + 0.05);
        break;
      }
      case 'bongo':
      case 'bodhran': {
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'sine';
        const startPitch = type === 'bongo' ? 380 : 105;
        osc.frequency.setValueAtTime(startPitch, t);
        osc.frequency.linearRampToValueAtTime(startPitch * 0.7, t + 0.09);

        const drumGain = velocity * 0.25;
        env.gain.setValueAtTime(drumGain, t);
        env.gain.linearRampToValueAtTime(0.0001, t + 0.16);

        osc.connect(env);
        this.engine.connect(env);
        osc.start(t);
        osc.stop(t + 0.18);
        break;
      }
    }
  }

  /**
   * Dispatch instrument playback by named preset
   */
  playInstrument(instName, freq, duration, startTime = null, gain = 0.18) {
    switch (instName) {
      case 'guzheng':
      case 'acousticGuitar':
      case 'pluck':
        return this.playPluck(freq, duration, startTime, gain, 0.5);
      case 'rhodes':
        return this.playRhodes(freq, duration, startTime, gain);
      case 'flute':
      case 'dizi':
      case 'tinWhistle':
        return this.playFlute(freq, duration, startTime, gain);
      case 'violin':
        return this.playViolin(freq, duration, startTime, gain);
      case 'cello':
        return this.playViolin(freq, duration, startTime, gain * 1.15);
      case 'erhuDrone':
        return this.playViolin(freq, duration, startTime, gain * 0.9);
      case 'harpsichord':
        return this.playHarpsichord(freq, duration, startTime, gain);
      case 'leadSynth':
        return this.playSynth(freq, duration, startTime, gain, false);
      case 'arpBass':
        return this.playSynth(freq, duration, startTime, gain * 1.2, true);
      case 'uprightBass':
        return this.playBass(freq, duration, startTime, gain * 1.2, 'upright');
      case 'subDubBass':
        return this.playBass(freq, duration, startTime, gain * 1.2, 'sub');
      case 'droneBass':
        return this.playBass(freq, duration, startTime, gain * 1.1, 'upright');
      case 'retroPad':
      case 'guitarSkank':
      case 'organ':
      default:
        return this.playTone(freq, duration, 'triangle', startTime, gain * 0.8);
    }
  }
}

export const instruments = new SynthInstruments();
