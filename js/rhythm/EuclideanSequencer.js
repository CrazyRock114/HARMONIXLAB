/**
 * EuclideanSequencer.js
 * Mathematical rhythms generated via Bjorklund's Euclidean algorithm E(k, n).
 * Interactive multi-ring circular sequencer with real-time synthesized percussion and visual fireworks.
 */

import { instruments } from '../audio/SynthInstruments.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class EuclideanSequencer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    // 3 Tracks: Kick, Snare/Clave, Hi-Hat
    this.tracks = [
      { id: 'track1', nameKey: 'rhythm.trackKick', pulses: 4, steps: 16, rotate: 0, drum: 'kick', color: '#f43f5e', mute: false },
      { id: 'track2', nameKey: 'rhythm.trackClave', pulses: 5, steps: 16, rotate: 0, drum: 'clave', color: '#00f2fe', mute: false },
      { id: 'track3', nameKey: 'rhythm.trackHihat', pulses: 8, steps: 16, rotate: 0, drum: 'hihat', color: '#facc15', mute: false }
    ];

    this.bpm = 110;
    this.isPlaying = false;
    this.currentStep = 0;
    this.timerId = null;

    this.initDOM();
    this.initCanvas();
    this.render();

    this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
  }

  /**
   * Bjorklund's Euclidean Algorithm
   * Distribute k pulses into n steps as evenly as possible.
   */
  static generateEuclidean(k, n, rotate = 0) {
    if (k <= 0) return new Array(n).fill(0);
    if (k >= n) return new Array(n).fill(1);

    let seq1 = [];
    for (let i = 0; i < k; i++) seq1.push([1]);
    let seq2 = [];
    for (let i = 0; i < n - k; i++) seq2.push([0]);

    while (seq2.length > 1) {
      const minLen = Math.min(seq1.length, seq2.length);
      const newSeq1 = [];
      for (let i = 0; i < minLen; i++) {
        newSeq1.push(seq1[i].concat(seq2[i]));
      }
      if (seq1.length > seq2.length) {
        seq2 = seq1.slice(minLen);
      } else {
        seq2 = seq2.slice(minLen);
      }
      seq1 = newSeq1;
    }

    const pattern = [];
    seq1.forEach(g => pattern.push(...g));
    seq2.forEach(g => pattern.push(...g));

    // Apply circular rotation offset
    const rot = ((rotate % n) + n) % n;
    return pattern.slice(rot).concat(pattern.slice(0, rot));
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="lab-grid">
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🥁</span> <span data-i18n="rhythm.euclidTitle">Circular Euclidean Rhythm Generator</span></h3>
            <span class="badge" data-i18n="rhythm.euclidBadge">Bjorklund's Algorithm</span>
          </div>
          <p class="panel-desc" data-i18n="rhythm.euclidDesc">
            Computer scientist Godfried Toussaint discovered in 2005 that Euclid's 2,300-year-old GCD algorithm 
            generates nearly all traditional musical rhythms across human cultures when distributing pulses in a cycle!
          </p>

          <div class="canvas-wrapper flex-center">
            <canvas id="euclideanCanvas" width="440" height="440"></canvas>
          </div>

          <div class="controls-row justify-center align-center">
            <button class="btn btn-primary" id="btnToggleSequencer" data-i18n="rhythm.startSequencer">▶ Start Sequencer</button>
            <div class="tempo-control">
              <label><span data-i18n="rhythm.tempo">Tempo</span>: <span id="euclidBpmVal" class="mono-value">110 BPM</span></label>
              <input type="range" id="euclidBpmSlider" min="60" max="180" step="2" value="110">
            </div>
          </div>
        </div>

        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🌍</span> <span data-i18n="rhythm.worldPresets">World Rhythm Presets</span></h3>
            <span class="badge" data-i18n="rhythm.ethnoMath">Ethno-Math</span>
          </div>

          <div class="rhythm-presets-grid" id="rhythmPresets">
            <button class="btn btn-pill" data-k="3" data-n="8" data-drum="clave" data-i18n="rhythm.presetTresillo">Cuban Tresillo E(3, 8)</button>
            <button class="btn btn-pill" data-k="5" data-n="8" data-drum="clave" data-i18n="rhythm.presetCinquillo">Cinquillo / Habanera E(5, 8)</button>
            <button class="btn btn-pill" data-k="7" data-n="12" data-drum="clave" data-i18n="rhythm.presetWestAfrican">West African Bell E(7, 12)</button>
            <button class="btn btn-pill" data-k="5" data-n="16" data-drum="clave" data-i18n="rhythm.presetBossa">Bossa Nova Clave E(5, 16)</button>
            <button class="btn btn-pill" data-k="7" data-n="8" data-drum="woodblock" data-i18n="rhythm.presetBulgarian">Bulgarian Ruchenitsa E(7, 8)</button>
            <button class="btn btn-pill" data-k="4" data-n="12" data-drum="kick" data-i18n="rhythm.presetAfrobeat">Afrobeat 12/8 Pulse E(4, 12)</button>
          </div>

          <!-- Track Controls -->
          <div class="track-controls-container" id="trackControls">
            ${this.tracks.map((t, idx) => `
              <div class="track-card" style="border-left: 4px solid ${t.color}">
                <div class="track-card-header">
                  <strong data-i18n="${t.nameKey}">${i18n.t(t.nameKey)}</strong>
                  <button class="btn btn-sm btn-mute" data-track="${idx}" data-i18n="rhythm.mute">Mute</button>
                </div>
                <div class="track-card-sliders">
                  <label><span data-i18n="rhythm.pulses">Pulses</span>: <span id="pulseVal_${idx}">${t.pulses}</span></label>
                  <input type="range" class="pulse-slider" data-track="${idx}" min="1" max="16" value="${t.pulses}">
                  <label><span data-i18n="rhythm.steps">Steps</span>: <span id="stepVal_${idx}">${t.steps}</span></label>
                  <input type="range" class="step-slider" data-track="${idx}" min="4" max="24" value="${t.steps}">
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  initCanvas() {
    this.canvas = document.getElementById('euclideanCanvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    const toggleBtn = this.container.querySelector('#btnToggleSequencer');
    toggleBtn.addEventListener('click', () => {
      if (this.isPlaying) {
        this.stop();
        toggleBtn.textContent = i18n.t('rhythm.startSequencer');
        toggleBtn.setAttribute('data-i18n', 'rhythm.startSequencer');
        toggleBtn.classList.remove('btn-danger');
        toggleBtn.classList.add('btn-primary');
      } else {
        this.start();
        toggleBtn.textContent = i18n.t('rhythm.stopSequencer');
        toggleBtn.setAttribute('data-i18n', 'rhythm.stopSequencer');
        toggleBtn.classList.remove('btn-primary');
        toggleBtn.classList.add('btn-danger');
      }
    });

    const bpmSlider = this.container.querySelector('#euclidBpmSlider');
    const bpmVal = this.container.querySelector('#euclidBpmVal');
    bpmSlider.addEventListener('input', (e) => {
      this.bpm = parseInt(e.target.value, 10);
      bpmVal.textContent = `${this.bpm} BPM`;
      if (this.isPlaying) {
        this.restartTimer();
      }
    });

    // Preset buttons
    const presetBtns = this.container.querySelectorAll('#rhythmPresets button');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const k = parseInt(btn.dataset.k, 10);
        const n = parseInt(btn.dataset.n, 10);
        this.tracks[1].pulses = k;
        this.tracks[1].steps = n;
        this.container.querySelector('#pulseVal_1').textContent = k;
        this.container.querySelector('#stepVal_1').textContent = n;
        this.render();
      });
    });

    // Track sliders & mute
    this.tracks.forEach((t, idx) => {
      const pSlider = this.container.querySelector(`.pulse-slider[data-track="${idx}"]`);
      const sSlider = this.container.querySelector(`.step-slider[data-track="${idx}"]`);
      const muteBtn = this.container.querySelector(`.btn-mute[data-track="${idx}"]`);

      pSlider.addEventListener('input', (e) => {
        t.pulses = parseInt(e.target.value, 10);
        this.container.querySelector(`#pulseVal_${idx}`).textContent = t.pulses;
        this.render();
      });

      sSlider.addEventListener('input', (e) => {
        t.steps = parseInt(e.target.value, 10);
        this.container.querySelector(`#stepVal_${idx}`).textContent = t.steps;
        this.render();
      });

      muteBtn.addEventListener('click', () => {
        t.mute = !t.mute;
        muteBtn.classList.toggle('active', t.mute);
        muteBtn.textContent = t.mute ? 'Unmute' : 'Mute';
        this.render();
      });
    });
  }

  async start() {
    await instruments.ensureAudio();
    this.isPlaying = true;
    this.currentStep = 0;
    this.tick();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) clearTimeout(this.timerId);
    this.render();
  }

  restartTimer() {
    if (this.timerId) clearTimeout(this.timerId);
    this.tick();
  }

  tick() {
    if (!this.isPlaying) return;

    // Trigger sounds for active pulses
    this.tracks.forEach(track => {
      if (track.mute) return;
      const pattern = EuclideanSequencer.generateEuclidean(track.pulses, track.steps, track.rotate);
      const stepIndex = this.currentStep % track.steps;
      if (pattern[stepIndex] === 1) {
        instruments.playDrum(track.drum, null, 0.85);
      }
    });

    this.render();
    this.currentStep++;

    const stepDurationMs = (60000 / this.bpm) / 4; // 16th notes
    this.timerId = setTimeout(() => this.tick(), stepDurationMs);
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Radii for tracks: Inner (track 0), Mid (track 1), Outer (track 2)
    const ringRadii = [80, 130, 185];

    this.tracks.forEach((track, tIdx) => {
      const r = ringRadii[tIdx];
      const pattern = EuclideanSequencer.generateEuclidean(track.pulses, track.steps, track.rotate);
      const steps = track.steps;

      // Draw ring circle
      ctx.strokeStyle = track.mute ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Draw step dots
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2 - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        const isPulse = pattern[i] === 1;
        const isCurrent = this.isPlaying && (this.currentStep % steps === i);

        ctx.fillStyle = isCurrent ? '#ffffff' : (isPulse ? track.color : 'rgba(255, 255, 255, 0.1)');
        ctx.shadowColor = isCurrent ? track.color : 'transparent';
        ctx.shadowBlur = isCurrent ? 14 : 0;

        ctx.beginPath();
        ctx.arc(x, y, isPulse ? (isCurrent ? 9 : 7) : 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Center Hub
    ctx.fillStyle = '#0a0e17';
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = this.isPlaying ? '#00f2fe' : '#64748b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const hubText = this.isPlaying ? i18n.t('rhythm.statePulsing') : i18n.t('rhythm.statePaused');
    ctx.fillText(hubText, cx, cy);
  }

  updateLanguage() {
    i18n.applyDomTranslations(this.container);
    this.render();
  }

  destroy() {
    this.stop();
  }
}
