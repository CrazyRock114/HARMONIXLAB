/**
 * HarmonicSeries.js
 * Visual & acoustic exploration of the Overtone Ladder (n = 1..16),
 * cents deviations from Equal Temperament, and the Pythagorean Comma spiral.
 */

import { TuningSystems } from '../audio/TuningSystems.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class HarmonicSeries {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.fundamentalFreq = 130.81; // C3
    this.harmonics = TuningSystems.getHarmonicSeries(this.fundamentalFreq, 16);
    this.activeHarmonics = new Set([1]);

    this.initDOM();
    this.initSpiralCanvas();
    this.renderLadder();
    this.renderSpiral();

    if (typeof i18n.onLanguageChange === 'function') {
      this.unsubscribeI18n = i18n.onLanguageChange(() => {
        this.renderLadder();
        this.renderSpiral();
        i18n.applyDomTranslations(this.container);
      });
    }
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="lab-grid">
        <!-- Harmonic Ladder -->
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🪜</span> <span data-i18n="physics.harmonicTitle">The Natural Overtone Ladder</span></h3>
            <span class="badge" data-i18n="physics.harmonicBadge">Acoustic Physics</span>
          </div>
          <p class="panel-desc" data-i18n="physics.harmonicDesc">
            When any physical body vibrates, it resonates not only at its fundamental pitch \(f_0\), but at integer multiples (\(2f_0, 3f_0, 4f_0...\)). 
            Notice how the <strong>Major Triad (4 : 5 : 6)</strong> emerges directly from nature!
          </p>

          <div class="controls-row align-center">
            <label data-i18n="physics.fundamentalNote">Fundamental Note:</label>
            <select id="fundamentalSelect" class="select-input">
              <option value="65.41">C2 (65.4 Hz)</option>
              <option value="110.0">A2 (110.0 Hz)</option>
              <option value="130.81" selected>C3 (130.8 Hz)</option>
              <option value="146.83">D3 (146.8 Hz)</option>
              <option value="196.0">G3 (196.0 Hz)</option>
            </select>
            <button class="btn btn-primary" id="playTriadBtn" data-i18n="physics.playTriad">▶ Play Nature's Triad (4:5:6)</button>
            <button class="btn btn-accent" id="playFullChordBtn" data-i18n="physics.playFullChord">▶ Play Full Overtone Chord</button>
          </div>

          <div class="harmonics-ladder" id="harmonicsLadder"></div>
        </div>

        <!-- Pythagorean Comma & Temperament Dilemma -->
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🌀</span> <span data-i18n="physics.commaTitle">The Pythagorean Comma & The Tuning Dilemma</span></h3>
            <span class="badge" data-i18n="physics.commaBadge">The Great Dilemma</span>
          </div>
          <p class="panel-desc" data-i18n="physics.commaDesc">
            Can pure mathematics close the circle? Pythagoras discovered that stacking 12 pure fifths \((3/2)^{12}\) yields <strong>129.746</strong>, while 7 pure octaves \(2^7\) equals <strong>128.000</strong>.
            The difference is the <strong>Pythagorean Comma</strong> (\(23.46\) cents). The circle never closes naturally—it forms an infinite spiral!
          </p>

          <div class="canvas-wrapper flex-center">
            <canvas id="commaSpiralCanvas" width="480" height="340"></canvas>
          </div>

          <div class="comma-summary" id="commaSummary"></div>

          <div class="controls-row justify-center">
            <button class="btn btn-pill active" id="btnShowSpiral" data-i18n="physics.viewSpiral">View Pythagorean Spiral</button>
            <button class="btn btn-pill" id="btnCompare12Tet" data-i18n="physics.compare12Tet">Compare 12-TET Solution</button>
            <button class="btn btn-accent" id="btnHearComma" data-i18n="physics.hearComma">🔊 Hear the Comma Clash</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  initSpiralCanvas() {
    this.spiralCanvas = document.getElementById('commaSpiralCanvas');
    this.spiralCtx = this.spiralCanvas.getContext('2d');
    this.showTetComparison = false;
  }

  bindEvents() {
    const fundSelect = this.container.querySelector('#fundamentalSelect');
    fundSelect.addEventListener('change', (e) => {
      this.fundamentalFreq = parseFloat(e.target.value);
      this.harmonics = TuningSystems.getHarmonicSeries(this.fundamentalFreq, 16);
      this.renderLadder();
    });

    const playTriadBtn = this.container.querySelector('#playTriadBtn');
    playTriadBtn.addEventListener('click', async () => {
      await audioEngine.init();
      const f0 = this.fundamentalFreq;
      [4, 5, 6].forEach(n => {
        const osc = audioEngine.ctx.createOscillator();
        const gain = audioEngine.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f0 * n, audioEngine.currentTime);
        gain.gain.setValueAtTime(0.09, audioEngine.currentTime);
        gain.gain.linearRampToValueAtTime(0.0001, audioEngine.currentTime + 1.8);
        osc.connect(gain);
        audioEngine.connect(gain);
        osc.start();
        osc.stop(audioEngine.currentTime + 1.85);
      });
    });

    const playFullChordBtn = this.container.querySelector('#playFullChordBtn');
    playFullChordBtn.addEventListener('click', async () => {
      await audioEngine.init();
      const f0 = this.fundamentalFreq;
      for (let n = 1; n <= 8; n++) {
        const osc = audioEngine.ctx.createOscillator();
        const gain = audioEngine.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f0 * n, audioEngine.currentTime);
        const amp = (0.08 / Math.sqrt(n));
        gain.gain.setValueAtTime(amp, audioEngine.currentTime);
        gain.gain.linearRampToValueAtTime(0.0001, audioEngine.currentTime + 2.5);
        osc.connect(gain);
        audioEngine.connect(gain);
        osc.start();
        osc.stop(audioEngine.currentTime + 2.55);
      }
    });

    const btnShowSpiral = this.container.querySelector('#btnShowSpiral');
    const btnCompare12Tet = this.container.querySelector('#btnCompare12Tet');
    btnShowSpiral.addEventListener('click', () => {
      btnShowSpiral.classList.add('active');
      btnCompare12Tet.classList.remove('active');
      this.showTetComparison = false;
      this.renderSpiral();
    });
    btnCompare12Tet.addEventListener('click', () => {
      btnCompare12Tet.classList.add('active');
      btnShowSpiral.classList.remove('active');
      this.showTetComparison = true;
      this.renderSpiral();
    });

    const btnHearComma = this.container.querySelector('#btnHearComma');
    btnHearComma.addEventListener('click', async () => {
      await audioEngine.init();
      // Play pure C6 (~1046 Hz) vs B#6 (~1060 Hz) at safe, comfortable levels
      const fBase = 261.63; // C4
      const c6PureOctaves = fBase * Math.pow(2, 2); // 1046.5 Hz
      const bSharp6PureFifths = (fBase * Math.pow(1.5, 12)) / Math.pow(2, 5); // ~1060.7 Hz

      const oscA = audioEngine.ctx.createOscillator();
      const oscB = audioEngine.ctx.createOscillator();
      const gain = audioEngine.ctx.createGain();

      oscA.frequency.setValueAtTime(c6PureOctaves, audioEngine.currentTime);
      oscB.frequency.setValueAtTime(bSharp6PureFifths, audioEngine.currentTime);

      // Low volume for high frequencies
      gain.gain.setValueAtTime(0.04, audioEngine.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, audioEngine.currentTime + 2.5);

      oscA.connect(gain);
      oscB.connect(gain);
      audioEngine.connect(gain);

      oscA.start();
      oscB.start();
      oscA.stop(audioEngine.currentTime + 2.55);
      oscB.stop(audioEngine.currentTime + 2.55);
    });
  }

  renderLadder() {
    const ladder = this.container.querySelector('#harmonicsLadder');
    ladder.innerHTML = '';

    this.harmonics.forEach(h => {
      const row = document.createElement('div');
      row.className = `harmonic-row ${h.n <= 6 ? 'nature-triad' : ''}`;

      // Deviation badge styling
      let devBadge = '';
      if (Math.abs(h.deviation) < 3) {
        devBadge = `<span class="badge badge-success" data-i18n="app.inTune">${i18n.t('app.inTune', 'In tune')}</span>`;
      } else if (h.deviation < 0) {
        devBadge = `<span class="badge badge-warning">${h.deviation}¢ ${i18n.t('app.flat', 'flat')}</span>`;
      } else {
        devBadge = `<span class="badge badge-warning">+${h.deviation}¢ ${i18n.t('app.sharp', 'sharp')}</span>`;
      }

      row.innerHTML = `
        <div class="harmonic-num">#${h.n}</div>
        <div class="harmonic-info">
          <div class="harmonic-title">
            <strong>${h.noteEstimate}</strong> (${h.intervalName})
            ${devBadge}
          </div>
          <div class="harmonic-meta">
            <span>Freq: <strong>${h.freq} Hz</strong></span> | 
            <span>Ratio: <strong>${h.n}:1</strong></span> | 
            <span>Total Cents: <strong>${h.centsFromRoot}¢</strong></span>
          </div>
        </div>
        <button class="btn btn-sm btn-icon-play" data-n="${h.n}">▶</button>
      `;

      const playBtn = row.querySelector('.btn-icon-play');
      playBtn.addEventListener('click', async () => {
        await audioEngine.init();
        const osc = audioEngine.ctx.createOscillator();
        const gain = audioEngine.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(h.freq, audioEngine.currentTime);
        gain.gain.setValueAtTime(0.12, audioEngine.currentTime);
        gain.gain.linearRampToValueAtTime(0.0001, audioEngine.currentTime + 1.2);
        osc.connect(gain);
        audioEngine.connect(gain);
        osc.start();
        osc.stop(audioEngine.currentTime + 1.25);
      });

      ladder.appendChild(row);
    });
  }

  renderSpiral() {
    const ctx = this.spiralCtx;
    const width = this.spiralCanvas.width;
    const height = this.spiralCanvas.height;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    const fifthNotes = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#'];
    const commaData = TuningSystems.getPythagoreanComma();

    // Draw reference circle (12-TET closed clock)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 110, 0, Math.PI * 2);
    ctx.stroke();

    // 12 fifths spiral points
    const points = [];
    const baseRadius = 80;
    const radiusGrowth = this.showTetComparison ? 0 : 3.5; // grows outward if Pythagorean

    for (let i = 0; i <= 12; i++) {
      // Each step in circle of fifths is 7 semitones = 7/12 * 2pi radians
      const angle = (i * 7 * (Math.PI * 2) / 12) - Math.PI / 2;
      const r = baseRadius + i * radiusGrowth;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push({ x, y, note: fifthNotes[i], index: i, angle, r });
    }

    // Connect points
    ctx.strokeStyle = this.showTetComparison ? '#10b981' : '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Draw nodes
    points.forEach((p, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === 12;

      ctx.fillStyle = isStart ? '#00f2fe' : isEnd ? '#f43f5e' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(p.x, p.y, isEnd || isStart ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();

      // Labels
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelDist = 18;
      const lx = cx + (p.r + labelDist) * Math.cos(p.angle);
      const ly = cy + (p.r + labelDist) * Math.sin(p.angle);
      ctx.fillText(p.note, lx, ly);
    });

    // If Pythagorean, highlight the gap between C and B#
    if (!this.showTetComparison) {
      const pC = points[0];
      const pBSharp = points[12];

      ctx.strokeStyle = '#f43f5e';
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pC.x, pC.y);
      ctx.lineTo(pBSharp.x, pBSharp.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f43f5e';
      ctx.font = '10px monospace';
      ctx.fillText('Comma (+23.5¢)', (pC.x + pBSharp.x) / 2 + 50, (pC.y + pBSharp.y) / 2);
    }

    const summary = this.container.querySelector('#commaSummary');
    if (this.showTetComparison) {
      summary.innerHTML = `
        <div class="alert alert-success">
          <strong data-i18n="physics.tet12SolutionTitle">${i18n.t('physics.tet12SolutionTitle')}</strong>
          <span data-i18n="physics.tet12SolutionText">${i18n.t('physics.tet12SolutionText')}</span>
        </div>
      `;
    } else {
      summary.innerHTML = `
        <div class="alert alert-warning">
          <strong data-i18n="physics.pythagoreanDilemmaTitle">${i18n.t('physics.pythagoreanDilemmaTitle')}</strong>
          <span data-i18n="physics.pythagoreanDilemmaText">${i18n.t('physics.pythagoreanDilemmaText')}</span>
        </div>
      `;
    }
  }
}
