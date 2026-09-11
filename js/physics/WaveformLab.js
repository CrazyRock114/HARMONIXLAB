/**
 * WaveformLab.js
 * Visual & physical simulations of sound waves: Standing waves on strings,
 * constructive & destructive wave superposition, and acoustic beating.
 */

import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class WaveformLab {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    // Simulation states
    this.standingMode = 1; // n = 1, 2, 3, 4, 5, 6
    this.f1 = 440;
    this.f2 = 444;
    this.a1 = 1.0;
    this.a2 = 1.0;
    this.phase2 = 0; // phase offset in radians
    this.isPlayingBeats = false;
    this.osc1 = null;
    this.osc2 = null;
    this.gainNode = null;

    this.initDOM();
    this.initCanvases();
    this.startAnimationLoop();

    if (typeof i18n.onLanguageChange === 'function') {
      this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
    }
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="lab-grid">
        <!-- Standing Waves Section -->
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">〰️</span> <span data-i18n="physics.standingTitle">The Vibrating String & Standing Waves</span></h3>
            <span class="badge" data-i18n="physics.standingBadge">Mersenne's Law</span>
          </div>
          <p class="panel-desc" data-i18n="physics.standingDesc">
            A musical string vibrates in discrete harmonic modes with fixed <strong>nodes</strong> (zero motion) and <strong>antinodes</strong> (maximum vibration). 
            Halving the string doubles its frequency (\(2:1\) ratio = one octave up).
          </p>
          <div class="canvas-wrapper">
            <canvas id="standingWaveCanvas" width="600" height="180"></canvas>
          </div>
          <div class="controls-row">
            <div class="mode-buttons" id="standingModes">
              <button class="btn btn-pill active" data-mode="1" data-i18n="physics.harmonicN1">${i18n.t('physics.harmonicN1')}</button>
              <button class="btn btn-pill" data-mode="2" data-i18n="physics.harmonicN2">${i18n.t('physics.harmonicN2')}</button>
              <button class="btn btn-pill" data-mode="3" data-i18n="physics.harmonicN3">${i18n.t('physics.harmonicN3')}</button>
              <button class="btn btn-pill" data-mode="4" data-i18n="physics.harmonicN4">${i18n.t('physics.harmonicN4')}</button>
              <button class="btn btn-pill" data-mode="5" data-i18n="physics.harmonicN5">${i18n.t('physics.harmonicN5')}</button>
            </div>
            <button class="btn btn-accent" id="playHarmonicBtn" data-i18n="physics.hearHarmonic">🔊 Hear Harmonic</button>
          </div>
          <div class="physics-stats" id="standingStats"></div>
        </div>

        <!-- Superposition & Acoustic Beats Section -->
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">⚡</span> <span data-i18n="physics.beatsTitle">Wave Interference & Acoustic Beats</span></h3>
            <span class="badge" data-i18n="physics.beatsBadge">Superposition Principle</span>
          </div>
          <p class="panel-desc" data-i18n="physics.beatsDesc">
            When two sound waves overlap, their pressures add: \(y(t) = y_1(t) + y_2(t)\). 
            When frequencies are slightly detuned (\(f_1 \approx f_2\)), they periodically phase in and out of sync, creating an audible pulsing volume modulation at <strong>beat frequency \(|f_1 - f_2|\)</strong>.
          </p>
          <div class="canvas-wrapper">
            <canvas id="beatCanvas" width="600" height="220"></canvas>
          </div>
          <div class="slider-controls">
            <div class="slider-group">
              <label><span data-i18n="physics.freq1">Frequency 1 (f₁)</span>: <span id="f1Val" class="mono-value">440.0 Hz</span></label>
              <input type="range" id="f1Slider" min="200" max="600" step="1" value="440">
            </div>
            <div class="slider-group">
              <label><span data-i18n="physics.freq2">Frequency 2 (f₂)</span>: <span id="f2Val" class="mono-value">444.0 Hz</span></label>
              <input type="range" id="f2Slider" min="200" max="600" step="0.5" value="444">
            </div>
            <div class="slider-group">
              <label><span data-i18n="physics.phaseShift">Phase Shift</span> (\(\Delta\phi\)): <span id="phaseVal" class="mono-value">0°</span></label>
              <input type="range" id="phaseSlider" min="0" max="360" step="5" value="0">
            </div>
          </div>
          <div class="controls-row justify-between align-center">
            <div class="beat-metric">
              <span data-i18n="physics.beatFreq">Beat Frequency</span>: <strong id="beatFreqVal" class="highlight-cyan">4.0 Hz</strong> 
              <span class="muted-note">(4 <span data-i18n="physics.pulsesPerSec">volume pulses per second</span>)</span>
            </div>
            <button class="btn btn-primary" id="toggleBeatsBtn" data-i18n="physics.startAudio">🔊 Start Audio</button>
          </div>
        </div>
      </div>
    `;

    this.updateStandingStats();
    this.bindEvents();
  }

  initCanvases() {
    this.standingCanvas = document.getElementById('standingWaveCanvas');
    this.standingCtx = this.standingCanvas.getContext('2d');

    this.beatCanvas = document.getElementById('beatCanvas');
    this.beatCtx = this.beatCanvas.getContext('2d');
  }

  bindEvents() {
    // Mode Buttons
    const modeBtns = this.container.querySelectorAll('#standingModes button');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.standingMode = parseInt(btn.dataset.mode, 10);
        this.updateStandingStats();
      });
    });

    // Play Harmonic Sound
    const playHarmonicBtn = this.container.querySelector('#playHarmonicBtn');
    playHarmonicBtn.addEventListener('click', async () => {
      await audioEngine.init();
      const fundamental = 130.81; // C3
      const n = this.standingMode;
      const freq = fundamental * n;
      const t = audioEngine.currentTime;

      // Equal-loudness compensation:
      // Lower frequencies (n=1 at 130Hz) require higher gain to match perceived volume of higher modes
      const baseGain = Math.min(0.38, 0.12 * Math.pow(4.5 / n, 0.7));

      // Fundamental oscillator
      const osc = audioEngine.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      // Warm overtone resonance (essential for vibrating string physics & mobile speaker projection)
      const oscOvertone = audioEngine.ctx.createOscillator();
      oscOvertone.type = 'triangle';
      oscOvertone.frequency.setValueAtTime(freq * 2, t);

      const gain = audioEngine.ctx.createGain();
      gain.gain.setValueAtTime(baseGain, t);
      gain.gain.linearRampToValueAtTime(0.0001, t + 1.3);

      const overtoneGain = audioEngine.ctx.createGain();
      overtoneGain.gain.setValueAtTime(baseGain * 0.35, t);
      overtoneGain.gain.linearRampToValueAtTime(0.0001, t + 1.1);

      osc.connect(gain);
      oscOvertone.connect(overtoneGain);
      audioEngine.connect(gain);
      audioEngine.connect(overtoneGain);

      osc.start(t);
      oscOvertone.start(t);
      osc.stop(t + 1.35);
      oscOvertone.stop(t + 1.35);
    });

    // Frequency Sliders
    const f1Slider = this.container.querySelector('#f1Slider');
    const f2Slider = this.container.querySelector('#f2Slider');
    const phaseSlider = this.container.querySelector('#phaseSlider');
    const f1Val = this.container.querySelector('#f1Val');
    const f2Val = this.container.querySelector('#f2Val');
    const phaseVal = this.container.querySelector('#phaseVal');
    const beatFreqVal = this.container.querySelector('#beatFreqVal');

    const updateBeats = () => {
      this.f1 = parseFloat(f1Slider.value);
      this.f2 = parseFloat(f2Slider.value);
      this.phase2 = (parseFloat(phaseSlider.value) * Math.PI) / 180;

      f1Val.textContent = `${this.f1.toFixed(1)} Hz`;
      f2Val.textContent = `${this.f2.toFixed(1)} Hz`;
      phaseVal.textContent = `${phaseSlider.value}°`;
      const diff = Math.abs(this.f1 - this.f2);
      beatFreqVal.textContent = `${diff.toFixed(1)} Hz`;

      if (this.isPlayingBeats && this.osc1 && this.osc2) {
        this.osc1.frequency.setTargetAtTime(this.f1, audioEngine.currentTime, 0.02);
        this.osc2.frequency.setTargetAtTime(this.f2, audioEngine.currentTime, 0.02);
      }
    };

    f1Slider.addEventListener('input', updateBeats);
    f2Slider.addEventListener('input', updateBeats);
    phaseSlider.addEventListener('input', updateBeats);

    // Toggle Beats Audio
    const toggleBeatsBtn = this.container.querySelector('#toggleBeatsBtn');
    let isPendingBeats = false;
    toggleBeatsBtn.addEventListener('click', async (e) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      if (isPendingBeats) return;
      isPendingBeats = true;
      try {
        await audioEngine.init();
        if (this.isPlayingBeats) {
          this.stopBeatsAudio();
        } else {
          this.startBeatsAudio();
        }
      } finally {
        isPendingBeats = false;
      }
    });
  }

  updateStandingStats() {
    const statsContainer = this.container.querySelector('#standingStats');
    if (!statsContainer) return;
    const n = this.standingMode;
    const intervalKeys = ['unison', 'octave', 'octaveFifth', 'twoOctaves', 'twoOctavesMajThird'];
    const intervalName = i18n.t(`physics.${intervalKeys[n - 1] || 'unison'}`);
    statsContainer.innerHTML = `
      <span><span data-i18n="physics.nodes">${i18n.t('physics.nodes')}</span>: <strong>${n + 1}</strong></span> | 
      <span><span data-i18n="physics.antinodes">${i18n.t('physics.antinodes')}</span>: <strong>${n}</strong></span> | 
      <span><span data-i18n="physics.wavelength">${i18n.t('physics.wavelength')}</span> (\\(\\lambda\\)): <strong>\\(${n === 1 ? '2L' : '2L/' + n}\\)</strong></span> | 
      <span><span data-i18n="physics.interval">${i18n.t('physics.interval')}</span>: <strong>${intervalName}</strong></span>
    `;
  }

  updateLanguage() {
    const modeBtns = this.container.querySelectorAll('#standingModes button');
    modeBtns.forEach(btn => {
      const mode = btn.dataset.mode;
      btn.textContent = i18n.t(`physics.harmonicN${mode}`);
    });

    this.updateStandingStats();

    const toggleBeats = this.container.querySelector('#toggleBeatsBtn');
    if (toggleBeats) {
      const key = this.isPlayingBeats ? 'physics.stopAudio' : 'physics.startAudio';
      toggleBeats.textContent = i18n.t(key);
      toggleBeats.setAttribute('data-i18n', key);
    }

    i18n.applyDomTranslations(this.container);
  }

  updateBeatsButton(isPlaying) {
    const toggleBeats = this.container ? this.container.querySelector('#toggleBeatsBtn') : null;
    if (!toggleBeats) return;
    const key = isPlaying ? 'physics.stopAudio' : 'physics.startAudio';
    toggleBeats.textContent = i18n.t(key);
    toggleBeats.setAttribute('data-i18n', key);
    if (isPlaying) {
      toggleBeats.classList.remove('btn-primary');
      toggleBeats.classList.add('btn-danger');
    } else {
      toggleBeats.classList.remove('btn-danger');
      toggleBeats.classList.add('btn-primary');
    }
  }

  startBeatsAudio() {
    if (!audioEngine.ctx) return;
    this.stopBeatsAudio();

    audioEngine.requestPlayback('waveformLab', () => this.stopBeatsAudio());

    this.gainNode = audioEngine.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.10, audioEngine.currentTime);

    this.osc1 = audioEngine.ctx.createOscillator();
    this.osc1.type = 'sine';
    this.osc1.frequency.setValueAtTime(this.f1, audioEngine.currentTime);

    this.osc2 = audioEngine.ctx.createOscillator();
    this.osc2.type = 'sine';
    this.osc2.frequency.setValueAtTime(this.f2, audioEngine.currentTime);

    this.osc1.connect(this.gainNode);
    this.osc2.connect(this.gainNode);
    audioEngine.connect(this.gainNode);

    this.osc1.start();
    this.osc2.start();
    this.isPlayingBeats = true;
    this.updateBeatsButton(true);
  }

  stopBeatsAudio() {
    if (this.osc1) {
      try { this.osc1.stop(); this.osc1.disconnect(); } catch (e) {}
      this.osc1 = null;
    }
    if (this.osc2) {
      try { this.osc2.stop(); this.osc2.disconnect(); } catch (e) {}
      this.osc2 = null;
    }
    if (this.gainNode) {
      try { this.gainNode.disconnect(); } catch (e) {}
      this.gainNode = null;
    }
    this.isPlayingBeats = false;
    audioEngine.releasePlayback('waveformLab');
    this.updateBeatsButton(false);
  }

  stopAudio() {
    this.stopBeatsAudio();
  }

  stop() {
    this.stopBeatsAudio();
  }

  startAnimationLoop() {
    let t = 0;
    const render = () => {
      t += 0.04;
      this.renderStandingWave(t);
      this.renderSuperpositionAndBeats(t);
      this.animId = requestAnimationFrame(render);
    };
    render();
  }

  renderStandingWave(time) {
    const ctx = this.standingCtx;
    const width = this.standingCanvas.width;
    const height = this.standingCanvas.height;
    const centerY = height / 2;
    const n = this.standingMode;

    ctx.clearRect(0, 0, width, height);

    // Background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // String boundary endpoints (bridges)
    const padding = 35;
    const stringLen = width - padding * 2;

    // Draw string bridges
    ctx.fillStyle = '#64748b';
    ctx.fillRect(padding - 4, centerY - 25, 8, 50);
    ctx.fillRect(width - padding - 4, centerY - 25, 8, 50);

    // Oscillation factor
    const omega = time * (1.8 + n * 0.4);
    const amp = Math.sin(omega) * 45;

    // Draw envelope guide
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let x = 0; x <= stringLen; x += 2) {
      const k = (n * Math.PI * x) / stringLen;
      const y = centerY + 45 * Math.sin(k);
      if (x === 0) ctx.moveTo(padding + x, y);
      else ctx.lineTo(padding + x, y);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let x = 0; x <= stringLen; x += 2) {
      const k = (n * Math.PI * x) / stringLen;
      const y = centerY - 45 * Math.sin(k);
      if (x === 0) ctx.moveTo(padding + x, y);
      else ctx.lineTo(padding + x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw vibrating string with glowing gradient
    ctx.lineWidth = 3.5;
    const grad = ctx.createLinearGradient(padding, 0, width - padding, 0);
    grad.addColorStop(0, '#00f2fe');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(1, '#818cf8');
    ctx.strokeStyle = grad;
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    for (let x = 0; x <= stringLen; x += 2) {
      const k = (n * Math.PI * x) / stringLen;
      const y = centerY + amp * Math.sin(k);
      if (x === 0) ctx.moveTo(padding + x, y);
      else ctx.lineTo(padding + x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Nodes (stationary red dots) and Antinodes (glowing markers)
    for (let i = 0; i <= n; i++) {
      const nodeX = padding + (i * stringLen) / n;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(nodeX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Node label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Node ${i}`, nodeX, centerY + 20);
    }
  }

  renderSuperpositionAndBeats(time) {
    const ctx = this.beatCtx;
    const width = this.beatCanvas.width;
    const height = this.beatCanvas.height;

    ctx.clearRect(0, 0, width, height);

    // Section 1: Wave 1 (Cyan)
    // Section 2: Wave 2 (Violet)
    // Section 3: Sum Wave y1 + y2 (Golden Yellow with Beat Envelope)
    const y1Center = 40;
    const y2Center = 95;
    const sumCenter = 170;

    // Frequency display scaling for visualization (normalize to visible cycles)
    const baseFreq = 2.0;
    const diff = (this.f2 - this.f1) * 0.4;
    const simF1 = baseFreq;
    const simF2 = baseFreq + diff;

    // Wave 1
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#00f2fe';
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const phase = (x / width) * Math.PI * 8 * simF1 - time * 2;
      const y = y1Center + Math.sin(phase) * 16;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#00f2fe';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`y₁: ${this.f1.toFixed(1)} Hz`, 10, y1Center - 20);

    // Wave 2
    ctx.strokeStyle = '#a855f7';
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const phase = (x / width) * Math.PI * 8 * simF2 - time * 2 + this.phase2;
      const y = y2Center + Math.sin(phase) * 16;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#a855f7';
    ctx.fillText(`y₂: ${this.f2.toFixed(1)} Hz`, 10, y2Center - 20);

    // Sum wave y1 + y2
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 6;
    ctx.beginPath();

    const sumPoints = [];
    for (let x = 0; x < width; x++) {
      const p1 = (x / width) * Math.PI * 8 * simF1 - time * 2;
      const p2 = (x / width) * Math.PI * 8 * simF2 - time * 2 + this.phase2;
      const ySum = (Math.sin(p1) + Math.sin(p2)) * 18;
      const y = sumCenter + ySum;
      sumPoints.push(y);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Envelope outline (dashed white) showing beats
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const envelope = 2 * Math.cos(((simF1 - simF2) * (x / width) * Math.PI * 4 - this.phase2 / 2)) * 18;
      const y = sumCenter + Math.abs(envelope);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const envelope = 2 * Math.cos(((simF1 - simF2) * (x / width) * Math.PI * 4 - this.phase2 / 2)) * 18;
      const y = sumCenter - Math.abs(envelope);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`Sum: y₁ + y₂ (Beats = ${Math.abs(this.f1 - this.f2).toFixed(1)} Hz)`, 10, sumCenter - 28);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.stopBeatsAudio();
  }
}
