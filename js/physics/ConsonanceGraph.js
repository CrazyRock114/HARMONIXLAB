/**
 * ConsonanceGraph.js
 * Psychoacoustics of Harmony: Helmholtz & Plomp-Levelt Roughness Curve.
 * Interactive real-time test tone slider showing why intervals sound sweet or harsh.
 */

import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class ConsonanceGraph {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.baseFreq = 261.63; // C4
    this.currentRatio = 1.5; // Perfect 5th (3:2)
    this.isPlaying = false;
    this.osc1 = null;
    this.osc2 = null;
    this.gain = null;

    this.initDOM();
    this.initCanvas();
    this.renderGraph();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="panel glass-panel">
        <div class="panel-header">
          <h3><span class="icon">📈</span> <span data-i18n="physics.consonanceTitle">Consonance, Dissonance & Psychoacoustic Roughness</span></h3>
          <span class="badge" data-i18n="physics.consonanceBadge">Plomp-Levelt Theory (1965)</span>
        </div>
        <p class="panel-desc" data-i18n="physics.consonanceDesc">
          Why does a minor second sound harsh, while a perfect fifth sounds pristine? In the inner ear (cochlea), adjacent frequencies within the 
          <strong>critical bandwidth</strong> interfere and produce rapid roughness. Simple integer ratios (\(2:1, 3:2, 4:3\)) align overtones, eliminating sensory roughness!
        </p>

        <div class="canvas-wrapper">
          <canvas id="consonanceCanvas" width="700" height="260"></canvas>
        </div>

        <div class="consonance-controls">
          <div class="slider-group">
            <label><span data-i18n="physics.intervalRatio">Interval Ratio / Test Tone:</span> <span id="currentIntervalLabel" class="mono-value highlight-cyan">1.500 (Perfect 5th, G4)</span></label>
            <input type="range" id="ratioSlider" min="1.0" max="2.0" step="0.005" value="1.5">
          </div>

          <div class="interval-quick-buttons" id="quickIntervals">
            <button class="btn btn-sm btn-pill" data-ratio="1.0">Unison (1:1)</button>
            <button class="btn btn-sm btn-pill" data-ratio="1.0667">m2 (16:15)</button>
            <button class="btn btn-sm btn-pill" data-ratio="1.125">M2 (9:8)</button>
            <button class="btn btn-sm btn-pill" data-ratio="1.2">m3 (6:5)</button>
            <button class="btn btn-sm btn-pill" data-ratio="1.25">M3 (5:4)</button>
            <button class="btn btn-sm btn-pill" data-ratio="1.3333">P4 (4:3)</button>
            <button class="btn btn-sm btn-pill" data-ratio="1.4142">Tritone (√2)</button>
            <button class="btn btn-sm btn-pill active" data-ratio="1.5">P5 (3:2)</button>
            <button class="btn btn-sm btn-pill" data-ratio="1.6">m6 (8:5)</button>
            <button class="btn btn-sm btn-pill" data-ratio="1.6667">M6 (5:3)</button>
            <button class="btn btn-sm btn-pill" data-ratio="1.875">M7 (15:8)</button>
            <button class="btn btn-sm btn-pill" data-ratio="2.0">Octave (2:1)</button>
          </div>

          <div class="controls-row justify-between align-center">
            <div id="psychoStats" class="physics-stats">
              <span><span data-i18n="physics.fundamental">Fundamental</span>: <strong>261.6 Hz (C4)</strong></span> | 
              <span><span data-i18n="physics.testTone">Test Tone</span>: <strong id="testToneFreq">392.4 Hz (G4)</strong></span> | 
              <span><span data-i18n="physics.roughness">Roughness</span>: <strong id="roughnessLevel" class="text-success"><span class="badge badge-success" data-i18n="physics.pureConsonance">${i18n.t('physics.pureConsonance')}</span></strong></span>
            </div>
            <button class="btn btn-primary" id="toggleAudioBtn" data-i18n="physics.auditionInterval">🔊 Audition Interval</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  initCanvas() {
    this.canvas = document.getElementById('consonanceCanvas');
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Approximate Plomp-Levelt roughness calculation between two complex tones with 6 harmonics
   */
  calculateRoughness(ratio) {
    // Plomp-Levelt standard formula approximation for harmonic tones
    const f0 = 261.63;
    const f1 = f0 * ratio;
    let totalDissonance = 0;

    // Harmonic overtones
    const harmonics = 6;
    for (let i = 1; i <= harmonics; i++) {
      const freqA = f0 * i;
      const ampA = 1 / i;
      for (let j = 1; j <= harmonics; j++) {
        const freqB = f1 * j;
        const ampB = 1 / j;

        const fMin = Math.min(freqA, freqB);
        const fMax = Math.max(freqA, freqB);
        const s = 0.24 / (0.021 * fMin + 19);
        const fDiff = fMax - fMin;

        // Plomp-Levelt standard curve: d = e * (e^(-a*s*fDiff) - e^(-b*s*fDiff))
        const a = 3.5;
        const b = 5.75;
        const x = s * fDiff;
        const pairDissonance = ampA * ampB * (Math.exp(-a * x) - Math.exp(-b * x));
        if (pairDissonance > 0) totalDissonance += pairDissonance;
      }
    }
    return totalDissonance;
  }

  bindEvents() {
    const slider = this.container.querySelector('#ratioSlider');
    const label = this.container.querySelector('#currentIntervalLabel');
    const testFreq = this.container.querySelector('#testToneFreq');
    const roughnessLevel = this.container.querySelector('#roughnessLevel');
    const quickBtns = this.container.querySelectorAll('#quickIntervals button');
    const toggleBtn = this.container.querySelector('#toggleAudioBtn');

    const updateRatio = (r) => {
      this.currentRatio = r;
      slider.value = r;
      const f = this.baseFreq * r;
      testFreq.textContent = `${f.toFixed(1)} Hz`;

      // Roughness text
      const d = this.calculateRoughness(r);
      if (d < 0.25) {
        roughnessLevel.innerHTML = `<span class="badge badge-success" data-i18n="physics.pureConsonance">${i18n.t('physics.pureConsonance')}</span>`;
      } else if (d < 0.45) {
        roughnessLevel.innerHTML = `<span class="badge badge-warning" data-i18n="physics.mildTension">${i18n.t('physics.mildTension')}</span>`;
      } else {
        roughnessLevel.innerHTML = `<span class="badge badge-danger" data-i18n="physics.sharpDissonance">${i18n.t('physics.sharpDissonance')}</span>`;
      }

      // Update sound if playing
      if (this.isPlaying && this.osc2) {
        this.osc2.frequency.setTargetAtTime(f, audioEngine.currentTime, 0.02);
      }

      this.renderGraph();
    };

    if (typeof i18n.onLanguageChange === 'function') {
      this.unsubscribeI18n = i18n.onLanguageChange(() => {
        updateRatio(this.currentRatio);
        i18n.applyDomTranslations(this.container);
      });
    }

    slider.addEventListener('input', (e) => {
      quickBtns.forEach(b => b.classList.remove('active'));
      const r = parseFloat(e.target.value);
      label.textContent = `${r.toFixed(3)}`;
      updateRatio(r);
    });

    quickBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        quickBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const r = parseFloat(btn.dataset.ratio);
        label.textContent = `${r.toFixed(3)} (${btn.textContent})`;
        updateRatio(r);
      });
    });

    let isPending = false;
    toggleBtn.addEventListener('click', async (e) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      if (isPending) return;
      isPending = true;
      try {
        await audioEngine.init();
        if (this.isPlaying) {
          this.stopAudio();
        } else {
          this.startAudio();
        }
      } finally {
        isPending = false;
      }
    });
  }

  updateToggleButton(isPlaying) {
    const toggleBtn = this.container ? this.container.querySelector('#btnToggleConsonanceSound') : null;
    if (!toggleBtn) return;
    if (isPlaying) {
      toggleBtn.textContent = '⏹ Stop Sound';
      toggleBtn.classList.remove('btn-primary');
      toggleBtn.classList.add('btn-danger');
    } else {
      toggleBtn.textContent = '🔊 Audition Interval';
      toggleBtn.classList.remove('btn-danger');
      toggleBtn.classList.add('btn-primary');
    }
  }

  startAudio() {
    if (!audioEngine.ctx) return;
    this.stopAudio();

    audioEngine.requestPlayback('consonanceGraph', () => this.stopAudio());

    this.gain = audioEngine.ctx.createGain();
    this.gain.gain.setValueAtTime(0.10, audioEngine.currentTime);

    // Fundamental note (warm sawtooth with gentle lowpass filter)
    this.osc1 = audioEngine.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.setValueAtTime(this.baseFreq, audioEngine.currentTime);

    const filter1 = audioEngine.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(1100, audioEngine.currentTime);

    this.osc1.connect(filter1);
    filter1.connect(this.gain);

    // Test tone
    this.osc2 = audioEngine.ctx.createOscillator();
    this.osc2.type = 'sawtooth';
    this.osc2.frequency.setValueAtTime(this.baseFreq * this.currentRatio, audioEngine.currentTime);

    const filter2 = audioEngine.ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(1100, audioEngine.currentTime);

    this.osc2.connect(filter2);
    filter2.connect(this.gain);

    audioEngine.connect(this.gain);

    this.osc1.start();
    this.osc2.start();
    this.isPlaying = true;
    this.updateToggleButton(true);
  }

  stopAudio() {
    if (this.osc1) { try { this.osc1.stop(); this.osc1.disconnect(); } catch (e) {} this.osc1 = null; }
    if (this.osc2) { try { this.osc2.stop(); this.osc2.disconnect(); } catch (e) {} this.osc2 = null; }
    if (this.gain) { try { this.gain.disconnect(); } catch (e) {} this.gain = null; }
    this.isPlaying = false;
    audioEngine.releasePlayback('consonanceGraph');
    this.updateToggleButton(false);
  }

  stop() {
    this.stopAudio();
  }

  renderGraph() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const padX = 50;
    const padY = 30;
    const graphWidth = width - padX * 2;
    const graphHeight = height - padY * 2;

    ctx.clearRect(0, 0, width, height);

    // Precalculate sample points if not cached
    if (!this.curvePoints) {
      this.curvePoints = [];
      const steps = 140;
      let maxD = 0;
      for (let i = 0; i <= steps; i++) {
        const ratio = 1.0 + (i / steps);
        const d = this.calculateRoughness(ratio);
        if (d > maxD) maxD = d;
        this.curvePoints.push({ ratio, d });
      }
      // Normalize
      this.curvePoints.forEach(p => p.normD = p.d / (maxD || 1));
    }

    // Draw Axes & Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, padY);
    ctx.lineTo(padX, height - padY);
    ctx.lineTo(width - padX, height - padY);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Max Dissonance', padX - 8, padY + 10);
    ctx.fillText('Consonance', padX - 8, height - padY);

    // Draw Named Intervals Vertical Marker Guides
    const landmarkIntervals = [
      { name: '1:1', r: 1.0 },
      { name: 'm2', r: 1.0667 },
      { name: 'M2', r: 1.125 },
      { name: 'm3', r: 1.2 },
      { name: 'M3', r: 1.25 },
      { name: 'P4', r: 1.3333 },
      { name: 'Tri', r: 1.4142 },
      { name: 'P5', r: 1.5 },
      { name: 'm6', r: 1.6 },
      { name: 'M6', r: 1.6667 },
      { name: 'm7', r: 1.7778 },
      { name: 'M7', r: 1.875 },
      { name: '2:1', r: 2.0 }
    ];

    landmarkIntervals.forEach(item => {
      const x = padX + (item.r - 1.0) * graphWidth;
      ctx.strokeStyle = item.r === 1.5 || item.r === 2.0 || item.r === 1.0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, height - padY);
      ctx.stroke();

      ctx.fillStyle = item.r === 1.5 || item.r === 2.0 ? '#38bdf8' : '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, x, height - padY + 16);
    });

    // Draw Roughness Curve
    ctx.lineWidth = 2.5;
    const curveGrad = ctx.createLinearGradient(padX, 0, width - padX, 0);
    curveGrad.addColorStop(0, '#10b981');   // 1:1 Consonant
    curveGrad.addColorStop(0.1, '#f43f5e'); // m2 Harsh
    curveGrad.addColorStop(0.5, '#00f2fe'); // P5 Consonant
    curveGrad.addColorStop(0.85, '#f43f5e');// M7 Harsh
    curveGrad.addColorStop(1, '#10b981');   // 2:1 Consonant
    ctx.strokeStyle = curveGrad;

    ctx.beginPath();
    this.curvePoints.forEach((p, idx) => {
      const x = padX + (p.ratio - 1.0) * graphWidth;
      const y = (height - padY) - (p.normD * graphHeight * 0.85);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(width - padX, height - padY);
    ctx.lineTo(padX, height - padY);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
    ctx.fill();

    // Current Test Tone Indicator
    const curX = padX + (this.currentRatio - 1.0) * graphWidth;
    const curD = this.calculateRoughness(this.currentRatio);
    const maxD = this.curvePoints[0] ? Math.max(...this.curvePoints.map(p => p.d)) : 1;
    const curY = (height - padY) - ((curD / maxD) * graphHeight * 0.85);

    // Indicator line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(curX, padY);
    ctx.lineTo(curX, height - padY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing dot
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(curX, curY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  destroy() {
    this.stopAudio();
  }
}
