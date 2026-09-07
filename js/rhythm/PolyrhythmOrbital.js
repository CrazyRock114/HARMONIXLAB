/**
 * PolyrhythmOrbital.js
 * Concentric Celestial Orbital visualizer for Polyrhythms (3:2, 4:3, 5:4, 7:4).
 * Dual synchronized orbits with particle triggers and linear timeline grid.
 */

import { instruments } from '../audio/SynthInstruments.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class PolyrhythmOrbital {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.ratio = [3, 2]; // 3 against 2
    this.bpm = 80;
    this.isPlaying = false;
    this.r1Angle = -Math.PI / 2;
    this.r2Angle = -Math.PI / 2;
    this.lastTime = 0;
    this.animId = null;

    this.initDOM();
    this.initCanvas();
    this.render();

    this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="lab-grid">
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🪐</span> <span data-i18n="rhythm.orbitalTitle">Celestial Polyrhythm Orbitals</span></h3>
            <span class="badge" id="currentRatioBadge">3 : 2 ${i18n.t('rhythm.polyrhythmBadge')}</span>
          </div>
          <p class="panel-desc" data-i18n="rhythm.orbitalDesc">
            A polyrhythm occurs when two conflicting rhythmic subdivisions happen simultaneously in the same span of time. 
            Watch the two orbiting satellites: they start together at 12 o'clock, drift apart, and recombine in perfect mathematical synchrony!
          </p>

          <div class="canvas-wrapper flex-center">
            <canvas id="polyrhythmCanvas" width="440" height="420"></canvas>
          </div>

          <div class="controls-row justify-center align-center">
            <button class="btn btn-primary" id="btnToggleOrbital" data-i18n="rhythm.startOrbitals">▶ Start Orbitals</button>
            <div class="tempo-control">
              <label><span data-i18n="rhythm.tempo">Tempo</span>: <span id="orbitalBpmVal" class="mono-value">80 BPM</span></label>
              <input type="range" id="orbitalBpmSlider" min="40" max="140" step="2" value="80">
            </div>
          </div>
        </div>

        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">⚙️</span> <span data-i18n="rhythm.selectRatio">Select Polyrhythmic Ratio</span></h3>
            <span class="badge" data-i18n="rhythm.rhythmicCounterpoint">Rhythmic Counterpoint</span>
          </div>

          <div class="rhythm-presets-grid" id="polyrhythmPresets">
            <button class="btn btn-pill active" data-r1="3" data-r2="2" data-i18n="rhythm.ratio32">
              <strong>3 : 2</strong> ("Cold cup of tea")
            </button>
            <button class="btn btn-pill" data-r1="4" data-r2="3" data-i18n="rhythm.ratio43">
              <strong>4 : 3</strong> ("Pass the golden butter")
            </button>
            <button class="btn btn-pill" data-r1="5" data-r2="4" data-i18n="rhythm.ratio54">
              <strong>5 : 4</strong> (Complex Chopin / jazz)
            </button>
            <button class="btn btn-pill" data-r1="7" data-r2="4" data-i18n="rhythm.ratio74">
              <strong>7 : 4</strong> (West African / Bulgarian)
            </button>
          </div>

          <!-- Linear Grid Comparison -->
          <div class="linear-rhythm-grid" id="linearRhythmGrid">
            <h4 data-i18n="rhythm.linearTimeline">Linear Timeline Interlocking:</h4>
            <div class="linear-track" id="trackA"></div>
            <div class="linear-track" id="trackB"></div>
          </div>

          <div class="mnemonic-box" id="mnemonicBox">
            <h4 data-i18n="rhythm.mnemonicTitle">💡 Mnemonic Memory Aid:</h4>
            <p id="mnemonicText" class="panel-desc highlight-amber"></p>
          </div>
        </div>
      </div>
    `;

    this.updateMnemonic(this.ratio[0], this.ratio[1]);

    this.bindEvents();
    this.renderLinearGrid();
  }

  initCanvas() {
    this.canvas = document.getElementById('polyrhythmCanvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    const toggleBtn = this.container.querySelector('#btnToggleOrbital');
    toggleBtn.addEventListener('click', async () => {
      await audioEngine.init();
      if (this.isPlaying) {
        this.stop();
        toggleBtn.textContent = i18n.t('rhythm.startOrbitals');
        toggleBtn.setAttribute('data-i18n', 'rhythm.startOrbitals');
        toggleBtn.classList.remove('btn-danger');
        toggleBtn.classList.add('btn-primary');
      } else {
        this.start();
        toggleBtn.textContent = i18n.t('rhythm.stopOrbitals');
        toggleBtn.setAttribute('data-i18n', 'rhythm.stopOrbitals');
        toggleBtn.classList.remove('btn-primary');
        toggleBtn.classList.add('btn-danger');
      }
    });

    const bpmSlider = this.container.querySelector('#orbitalBpmSlider');
    const bpmVal = this.container.querySelector('#orbitalBpmVal');
    bpmSlider.addEventListener('input', (e) => {
      this.bpm = parseInt(e.target.value, 10);
      bpmVal.textContent = `${this.bpm} BPM`;
    });

    const presetBtns = this.container.querySelectorAll('#polyrhythmPresets button');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const r1 = parseInt(btn.dataset.r1, 10);
        const r2 = parseInt(btn.dataset.r2, 10);
        this.ratio = [r1, r2];
        this.container.querySelector('#currentRatioBadge').textContent = `${r1} : ${r2} ${i18n.t('rhythm.polyrhythmBadge')}`;
        this.updateMnemonic(r1, r2);
        this.renderLinearGrid();
        this.r1Angle = -Math.PI / 2;
        this.r2Angle = -Math.PI / 2;
        this.render();
      });
    });
  }

  updateMnemonic(r1, r2) {
    const desc = this.container.querySelector('#mnemonicText');
    if (!desc) return;
    if (r1 === 3 && r2 === 2) {
      desc.innerHTML = i18n.t('rhythm.mnemonic32Desc');
    } else if (r1 === 4 && r2 === 3) {
      desc.innerHTML = i18n.t('rhythm.mnemonic43Desc');
    } else if (r1 === 5 && r2 === 4) {
      desc.innerHTML = i18n.t('rhythm.mnemonic54Desc');
    } else {
      desc.innerHTML = i18n.t('rhythm.mnemonic74Desc');
    }
  }

  renderLinearGrid() {
    const trackA = this.container.querySelector('#trackA');
    const trackB = this.container.querySelector('#trackB');
    if (!trackA || !trackB) return;
    trackA.innerHTML = '';
    trackB.innerHTML = '';

    const [r1, r2] = this.ratio;

    trackA.innerHTML = `<span class="track-tag" style="color: #00f2fe">${r1} <span data-i18n="rhythm.pulses">${i18n.t('rhythm.pulses')}</span>:</span>`;
    for (let i = 0; i < r1; i++) {
      const marker = document.createElement('div');
      marker.className = 'linear-beat beat-cyan';
      marker.style.left = `${(i / r1) * 85 + 12}%`;
      marker.textContent = i + 1;
      trackA.appendChild(marker);
    }

    trackB.innerHTML = `<span class="track-tag" style="color: #f59e0b">${r2} <span data-i18n="rhythm.pulses">${i18n.t('rhythm.pulses')}</span>:</span>`;
    for (let i = 0; i < r2; i++) {
      const marker = document.createElement('div');
      marker.className = 'linear-beat beat-amber';
      marker.style.left = `${(i / r2) * 85 + 12}%`;
      marker.textContent = i + 1;
      trackB.appendChild(marker);
    }
  }

  updateLanguage() {
    i18n.applyDomTranslations(this.container);
    this.updateMnemonic(this.ratio[0], this.ratio[1]);
    this.renderLinearGrid();
    const badge = this.container.querySelector('#currentRatioBadge');
    if (badge) {
      badge.textContent = `${this.ratio[0]} : ${this.ratio[1]} ${i18n.t('rhythm.polyrhythmBadge')}`;
    }
  }

  start() {
    this.isPlaying = true;
    let lastTime = performance.now();

    const loop = (currentTime) => {
      if (!this.isPlaying) return;
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Base cycle frequency: 1 cycle = (60 / BPM) * 2 seconds
      const cycleDuration = (60 / this.bpm) * 2;
      const baseSpeed = (Math.PI * 2) / cycleDuration;

      const [r1, r2] = this.ratio;

      const prevR1 = this.r1Angle;
      const prevR2 = this.r2Angle;

      this.r1Angle += baseSpeed * r1 * dt;
      this.r2Angle += baseSpeed * r2 * dt;

      // Detect trigger crossing 12 o'clock (-PI / 2)
      const checkHit = (prevA, curA) => {
        const pMod = ((prevA + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const cMod = ((curA + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        return cMod < pMod;
      };

      if (checkHit(prevR1, this.r1Angle)) {
        instruments.playDrum('woodblock', null, 0.9);
      }

      if (checkHit(prevR2, this.r2Angle)) {
        instruments.playDrum('clave', null, 0.85);
      }

      this.render();
      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    this.isPlaying = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.render();
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    const [r1, r2] = this.ratio;
    const rOuter = 160;
    const rInner = 105;

    // Trigger line at 12 o'clock
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - rOuter - 25);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Outer Orbit Track (R1)
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Orbit Track (R2)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.stroke();

    // Fixed step markers on outer ring
    for (let i = 0; i < r1; i++) {
      const a = (i / r1) * Math.PI * 2 - Math.PI / 2;
      ctx.fillStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.beginPath();
      ctx.arc(cx + rOuter * Math.cos(a), cy + rOuter * Math.sin(a), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fixed step markers on inner ring
    for (let i = 0; i < r2; i++) {
      const a = (i / r2) * Math.PI * 2 - Math.PI / 2;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.beginPath();
      ctx.arc(cx + rInner * Math.cos(a), cy + rInner * Math.sin(a), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer Satellite
    const x1 = cx + rOuter * Math.cos(this.r1Angle);
    const y1 = cy + rOuter * Math.sin(this.r1Angle);
    ctx.fillStyle = '#00f2fe';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(x1, y1, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner Satellite
    const x2 = cx + rInner * Math.cos(this.r2Angle);
    const y2 = cy + rInner * Math.sin(this.r2Angle);
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(x2, y2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center Core
    ctx.fillStyle = '#0a0e17';
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${r1} : ${r2}`, cx, cy);
  }

  destroy() {
    this.stop();
  }
}
