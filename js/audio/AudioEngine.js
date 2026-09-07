/**
 * AudioEngine.js
 * Central Web Audio API Manager: Master Bus, Dynamic Compression, Real-time Visualizer Taps, and Audio Unlock.
 */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.analyser = null;
    this.isUnlocked = false;
    this.volume = 0.35;
    this.bpm = 120;
    this.onStateChangeCallbacks = [];
  }

  /**
   * Create a smooth soft-clipping curve (tanh-based) for the master limiter
   */
  makeDistortionCurve(n_samples = 2048) {
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // Smooth hyperbolic tangent soft-limiter: limits output strictly to (-0.95, +0.95)
      curve[i] = Math.tanh(x * 1.2) * 0.95;
    }
    return curve;
  }

  /**
   * Initialize or resume the Web Audio context on user gesture
   */
  async init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Compressor to level out polyphonic spikes
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-20, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.002, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      // Master Gain (comfortable gentle level)
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      // Master Brickwall Soft Limiter (prevents digital clipping/screeching completely)
      this.limiter = this.ctx.createWaveShaper();
      this.limiter.curve = this.makeDistortionCurve();
      this.limiter.oversample = '2x';

      // Analyser Node for Oscilloscopes & FFT Spectrum Visualizers
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.85;

      // Audio Graph routing: Sound Sources -> Compressor -> Master Gain -> Limiter -> Analyser -> Destination
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.limiter);
      this.limiter.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.isUnlocked = this.ctx.state === 'running';
    this.notifyStateChange();
    return this.isUnlocked;
  }

  /**
   * Set Master Output Volume [0.0 - 1.0]
   */
  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Set global BPM
   */
  setBpm(bpm) {
    this.bpm = Math.max(30, Math.min(240, bpm));
  }

  /**
   * Get current AudioContext timestamp
   */
  get currentTime() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /**
   * Connect an audio node to the master compression input
   */
  connect(node) {
    if (this.compressor) {
      node.connect(this.compressor);
    }
  }

  /**
   * Subscribe to audio context state changes (e.g. running vs suspended)
   */
  onStateChange(fn) {
    this.onStateChangeCallbacks.push(fn);
  }

  notifyStateChange() {
    this.onStateChangeCallbacks.forEach(fn => fn(this.isUnlocked, this.ctx ? this.ctx.state : 'uninitialized'));
  }

  /**
   * Get waveform array for live oscilloscope rendering (Time Domain)
   */
  getWaveformData(outputArray) {
    if (!this.analyser) return;
    this.analyser.getByteTimeDomainData(outputArray);
  }

  /**
   * Get frequency spectrum array for FFT bar graph rendering (Frequency Domain)
   */
  getFrequencyData(outputArray) {
    if (!this.analyser) return;
    this.analyser.getByteFrequencyData(outputArray);
  }
}

// Global Singleton Instance
export const audioEngine = new AudioEngine();
