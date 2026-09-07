/**
 * FourierLab.js
 * Additive Synthesis & Fourier Spectrum: 16 Harmonic Drawbars.
 * Real-time waveform rendering and multi-oscillator sound synthesis.
 */

import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class FourierLab {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.numHarmonics = 16;
    this.harmonics = new Array(this.numHarmonics).fill(0);
    this.harmonics[0] = 1.0; // Fundamental default

    this.pitch = 220; // A3
    this.fundamentalFreq = 220; // Default fundamental frequency
    this.amplitudes = Array.from({ length: this.numHarmonics }, (_, i) => 1 / (i + 1));
    this.isPlaying = false;
    this.oscillators = [];
    this.gains = [];
    this.masterGain = null;

    this.initDOM();
    this.initCanvas();
    this.bindEvents();
    this.applyPreset('saw');
    this.renderWaveform();
    this.startAnimationLoop();

    this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="lab-grid">
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🎛️</span> <span data-i18n="timbre.fourierTitle">Additive Fourier Synthesizer</span></h3>
            <span class="badge" data-i18n="timbre.fourierBadge">Harmonic Decomposition</span>
          </div>
          <p class="panel-desc" data-i18n="timbre.fourierDesc">
            Joseph Fourier proved that <em>any</em> periodic sound waveform is simply a sum of pure sine waves at integer harmonic multiples. 
            Shape the 16 harmonic drawbars below to forge your own acoustic timbre from scratch!
          </p>

          <div class="canvas-wrapper">
            <canvas id="fourierCanvas" width="600" height="200"></canvas>
          </div>

          <!-- Presets -->
          <div class="controls-row justify-center presets-row" id="fourierPresets">
            <button class="btn btn-pill" data-preset="sine" data-i18n="timbre.presetSine">Pure Sine (Flute)</button>
            <button class="btn btn-pill active" data-preset="saw" data-i18n="timbre.presetSaw">Sawtooth (Violin / Brass)</button>
            <button class="btn btn-pill" data-preset="square" data-i18n="timbre.presetSquare">Square (Clarinet / Chiptune)</button>
            <button class="btn btn-pill" data-preset="organ" data-i18n="timbre.presetOrgan">Church Organ (Drawbars)</button>
            <button class="btn btn-pill" data-preset="bell" data-i18n="timbre.presetBell">FM Metallic Bell</button>
          </div>

          <div class="controls-row justify-between align-center">
            <button class="btn btn-primary" id="btnToggleFourierSound" data-i18n="timbre.auditionTimbre">🔊 Audition Timbre</button>
            <div class="pitch-control">
              <label><span data-i18n="timbre.pitch">Pitch</span>: <span id="fourierPitchVal" class="mono-value">A3 (220 Hz)</span></label>
              <input type="range" id="fourierPitchSlider" min="110" max="440" step="5" value="220">
            </div>
          </div>
        </div>

        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">📊</span> <span data-i18n="timbre.drawbarsTitle">16 Harmonic Drawbars</span></h3>
            <span class="badge" data-i18n="timbre.drawbarsBadge">Spectrum Distribution</span>
          </div>

          <p class="drawbar-hint-text" data-i18n="timbre.drawbarsHint">
            💡 Drag drawbars to sculpt harmonics & audition overtones. Click 'Audition Timbre' to hear the full additive composite!
          </p>

          <div class="drawbars-container" id="drawbarsContainer"></div>

          <div class="theory-callout" style="margin-top: 1rem;">
            <h4 data-i18n="timbre.acousticFingerprintTitle">💡 Acoustic Fingerprint Insight:</h4>
            <p data-i18n="timbre.acousticFingerprintDesc">
              • <strong>Clarinet</strong> produces almost exclusively <em>odd harmonics</em> (1, 3, 5, 7...) because its cylindrical tube is closed at the mouthpiece end.<br>
              • <strong>Violin & Brass</strong> produce <em>all harmonics</em> (even & odd), creating rich, warm brilliance.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  initCanvas() {
    this.canvas = document.getElementById('fourierCanvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    const toggleBtn = this.container.querySelector('#btnToggleFourierSound');
    toggleBtn.addEventListener('click', async () => {
      await audioEngine.init();
      if (this.isPlaying) {
        this.stopAudio();
      } else {
        this.startAudio();
        if (this.isPlaying) {
          toggleBtn.textContent = i18n.t('timbre.stopTimbre');
          toggleBtn.setAttribute('data-i18n', 'timbre.stopTimbre');
          toggleBtn.classList.remove('btn-primary');
          toggleBtn.classList.add('btn-danger');
        }
      }
    });

    const pitchSlider = this.container.querySelector('#fourierPitchSlider');
    const pitchVal = this.container.querySelector('#fourierPitchVal');
    pitchSlider.addEventListener('input', (e) => {
      this.fundamentalFreq = parseFloat(e.target.value) || 220;
      this.pitch = this.fundamentalFreq;
      pitchVal.textContent = `${this.fundamentalFreq} Hz`;
      if (this.isPlaying) {
        this.updateOscillatorFrequencies();
      }
    });

    // Preset buttons
    const presetBtns = this.container.querySelectorAll('#fourierPresets button');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.applyPreset(btn.dataset.preset);
      });
    });
  }

  applyPreset(type) {
    if (type === 'sine') {
      this.amplitudes = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    } else if (type === 'saw') {
      this.amplitudes = Array.from({ length: 16 }, (_, i) => 1 / (i + 1));
    } else if (type === 'square') {
      this.amplitudes = Array.from({ length: 16 }, (_, i) => ((i + 1) % 2 === 1 ? 1 / (i + 1) : 0));
    } else if (type === 'organ') {
      this.amplitudes = [1.0, 0.8, 0.4, 0.7, 0.2, 0.5, 0.1, 0.3, 0.05, 0.2, 0, 0.1, 0, 0, 0, 0];
    } else if (type === 'bell') {
      this.amplitudes = [1.0, 0.2, 0.7, 0.1, 0.6, 0.05, 0.8, 0.02, 0.4, 0.01, 0.3, 0.01, 0.2, 0.01, 0.1, 0.05];
    }

    this.renderDrawbars();
    this.updateGainNodes();
    this.renderWaveform();
  }

  renderDrawbars() {
    const container = this.container.querySelector('#drawbarsContainer');
    container.innerHTML = '';

    for (let i = 0; i < 16; i++) {
      const col = document.createElement('div');
      col.className = `drawbar-col ${(i + 1) % 2 === 1 ? 'is-odd' : 'is-even'}`;

      const valBadge = document.createElement('span');
      valBadge.className = 'drawbar-val';
      const amp = this.amplitudes[i] ?? 0;
      valBadge.textContent = `${Math.round(amp * 100)}%`;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'vertical-drawbar';
      slider.setAttribute('orient', 'vertical');
      slider.setAttribute('aria-label', `Harmonic #${i + 1}`);
      slider.min = '0';
      slider.max = '1';
      slider.step = '0.02';
      slider.value = amp.toString();

      slider.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value) || 0;
        this.amplitudes[i] = v;
        valBadge.textContent = `${Math.round(v * 100)}%`;
        if (this.isPlaying) {
          this.updateGainNodes();
        } else {
          this.previewHarmonic(i, v);
        }
        this.renderWaveform();
      });

      const label = document.createElement('span');
      label.className = 'drawbar-label';
      label.textContent = `#${i + 1}`;
      label.title = `Harmonic #${i + 1} (${i + 1}×)`;

      col.appendChild(valBadge);
      col.appendChild(slider);
      col.appendChild(label);
      container.appendChild(col);
    }
  }

  async previewHarmonic(harmonicIndex, amplitude) {
    if (this.isPlaying || amplitude <= 0.01) return;
    try {
      await audioEngine.init();
      if (!audioEngine.ctx) return;

      const t = audioEngine.currentTime;
      const baseFreq = this.fundamentalFreq || this.pitch || 220;
      const freq = baseFreq * (harmonicIndex + 1);

      if (this.previewOsc) {
        try { this.previewOsc.stop(); this.previewOsc.disconnect(); } catch (e) {}
      }
      if (this.previewGain) {
        try { this.previewGain.disconnect(); } catch (e) {}
      }

      this.previewOsc = audioEngine.ctx.createOscillator();
      this.previewGain = audioEngine.ctx.createGain();

      this.previewOsc.type = 'sine';
      this.previewOsc.frequency.setValueAtTime(freq, t);

      const amp = Math.min(0.2, amplitude * 0.2);
      this.previewGain.gain.setValueAtTime(0.001, t);
      this.previewGain.gain.linearRampToValueAtTime(amp, t + 0.02);
      this.previewGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

      this.previewOsc.connect(this.previewGain);
      audioEngine.connect(this.previewGain);

      this.previewOsc.start(t);
      this.previewOsc.stop(t + 0.3);
    } catch (e) {
      // Audio preview error gracefully ignored
    }
  }

  startAudio() {
    if (!audioEngine.ctx) return;
    this.stopAudio();

    const t = audioEngine.currentTime;
    this.masterGain = audioEngine.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, t);
    this.masterGain.gain.linearRampToValueAtTime(0.35, t + 0.04);

    this.oscillators = [];
    this.gains = [];

    const ampSum = this.amplitudes.reduce((acc, v) => acc + v, 0) || 1;
    const norm = Math.max(1, Math.sqrt(ampSum));
    const baseFreq = this.fundamentalFreq || this.pitch || 220;

    for (let i = 0; i < 16; i++) {
      const osc = audioEngine.ctx.createOscillator();
      const gain = audioEngine.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * (i + 1), t);

      const amp = ((this.amplitudes[i] ?? 0) / norm) * (0.45 / (1 + i * 0.12));
      gain.gain.setValueAtTime(Math.max(0, amp), t);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      this.oscillators.push(osc);
      this.gains.push(gain);
    }

    audioEngine.connect(this.masterGain);
    this.isPlaying = true;
  }

  updateGainNodes() {
    if (!this.isPlaying || !audioEngine.ctx) return;
    const ampSum = this.amplitudes.reduce((acc, v) => acc + v, 0) || 1;
    const norm = Math.max(1, Math.sqrt(ampSum));

    for (let i = 0; i < 16; i++) {
      if (this.gains[i]) {
        const amp = ((this.amplitudes[i] ?? 0) / norm) * (0.45 / (1 + i * 0.12));
        this.gains[i].gain.setTargetAtTime(Math.max(0, amp), audioEngine.currentTime, 0.02);
      }
    }
  }

  updateOscillatorFrequencies() {
    if (!this.isPlaying || !audioEngine.ctx) return;
    const baseFreq = this.fundamentalFreq || this.pitch || 220;
    const t = audioEngine.currentTime;
    for (let i = 0; i < 16; i++) {
      if (this.oscillators[i]) {
        this.oscillators[i].frequency.setTargetAtTime(baseFreq * (i + 1), t, 0.02);
      }
    }
  }

  stopAudio() {
    this.oscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch (e) {}
    });
    this.gains.forEach(g => {
      try { g.disconnect(); } catch (e) {}
    });
    if (this.masterGain) {
      try { this.masterGain.disconnect(); } catch (e) {}
      this.masterGain = null;
    }
    this.oscillators = [];
    this.gains = [];
    this.isPlaying = false;

    const toggleBtn = this.container ? this.container.querySelector('#btnToggleFourierSound') : null;
    if (toggleBtn) {
      toggleBtn.textContent = i18n.t('timbre.auditionTimbre');
      if (typeof toggleBtn.setAttribute === 'function') {
        toggleBtn.setAttribute('data-i18n', 'timbre.auditionTimbre');
      }
      if (toggleBtn.classList) {
        toggleBtn.classList.remove('btn-danger');
        toggleBtn.classList.add('btn-primary');
      }
    }
  }

  startAnimationLoop() {
    let t = 0;
    const loop = () => {
      t += 0.03;
      this.renderWaveform(t);
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  renderWaveform(time = 0) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Center grid line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();

    // Calculate synthesized Fourier curve
    // y(x) = sum( A_k * sin( 2 * pi * k * (x/width * 2) - time ) )
    ctx.lineWidth = 2.5;
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#00f2fe');
    grad.addColorStop(0.5, '#a855f7');
    grad.addColorStop(1, '#f59e0b');
    ctx.strokeStyle = grad;
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      let sum = 0;
      const normalizedX = (x / width) * Math.PI * 4; // 2 cycles

      for (let k = 1; k <= 16; k++) {
        const amp = this.amplitudes[k - 1];
        if (amp > 0) {
          sum += amp * Math.sin(k * normalizedX - time * 2);
        }
      }

      // Scale amplitude to fit canvas
      const y = cy - sum * 45;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('Synthesized Time-Domain Waveform y(t) = Σ Aₖ · sin(kωt)', 12, 20);
  }

  updateLanguage() {
    i18n.applyDomTranslations(this.container);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.stopAudio();
    if (this.previewOsc) {
      try { this.previewOsc.stop(); this.previewOsc.disconnect(); } catch (e) {}
      this.previewOsc = null;
    }
    if (this.previewGain) {
      try { this.previewGain.disconnect(); } catch (e) {}
      this.previewGain = null;
    }
    if (this.unsubscribeI18n) this.unsubscribeI18n();
  }
}
