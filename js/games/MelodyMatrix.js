/**
 * MelodyMatrix.js
 * World Melody Matrix: 16-step intuitive sequencer quantized to global modes.
 * Eliminates "wrong notes" by locking the pitch grid to the selected cultural mode.
 */

import { ScalesData } from '../audio/ScalesData.js';
import { TuningSystems } from '../audio/TuningSystems.js';
import { instruments } from '../audio/SynthInstruments.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class MelodyMatrix {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scales = [
      { id: 'chinese_gong', name: 'Chinese Gong (Pentatonic)', intervals: [0, 2, 4, 7, 9, 12], inst: 'guzheng' },
      { id: 'japanese_hirajoshi', name: 'Japanese Hirajoshi (Zen)', intervals: [0, 2, 3, 7, 8, 12], inst: 'pluck' },
      { id: 'arabic_hijaz', name: 'Arabic Maqam Hijaz', intervals: [0, 1, 4, 5, 7, 8, 10, 12], inst: 'flute' },
      { id: 'indian_bhairav', name: 'Indian Raga Bhairav', intervals: [0, 1, 4, 5, 7, 8, 11, 12], inst: 'flute' },
      { id: 'blues', name: 'Blues Hexatonic', intervals: [0, 3, 5, 6, 7, 10, 12], inst: 'rhodes' },
      { id: 'lydian', name: 'Futuristic Lydian', intervals: [0, 2, 4, 6, 7, 9, 11, 12], inst: 'leadSynth' }
    ];

    this.selectedScale = this.scales[0];
    this.rootMidi = 60; // C4
    this.steps = 16;
    this.bpm = 112;
    this.isPlaying = false;
    this.currentStep = 0;
    this.timerId = null;

    // Grid matrix: [row][col] (boolean)
    this.grid = [];
    this.resetGrid();

    // Default pleasant pentatonic preset pattern
    this.loadDefaultPreset();

    this.initDOM();
    this.renderMatrix();

    if (typeof i18n.onLanguageChange === 'function') {
      this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
    }
  }

  getScaleName(id) {
    const map = {
      chinese_gong: 'games.scaleGong',
      japanese_hirajoshi: 'games.scaleHirajoshi',
      arabic_hijaz: 'games.scaleHijaz',
      indian_bhairav: 'games.scaleBhairav',
      blues: 'games.scaleBlues',
      lydian: 'games.scaleLydian'
    };
    return i18n.t(map[id] || id);
  }

  resetGrid() {
    const numRows = this.selectedScale.intervals.length;
    this.grid = Array.from({ length: numRows }, () => new Array(this.steps).fill(false));
  }

  loadDefaultPreset() {
    this.resetGrid();
    const rows = this.selectedScale.intervals.length;
    // Simple ascending cascade
    const preset = [0, 1, 2, 4, 3, 2, 1, 0, 2, 3, 4, 5 % rows, 4, 2, 1, 0];
    preset.forEach((rowIdx, colIdx) => {
      const r = Math.min(rows - 1, rowIdx);
      this.grid[r][colIdx] = true;
    });
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="matrix-layout">
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🎼</span> <span data-i18n="games.matrixTitle">World Melody Matrix (Modal Step Sequencer)</span></h3>
            <span class="badge" id="matrixScaleBadge">${this.getScaleName(this.selectedScale.id)}</span>
          </div>
          <p class="panel-desc" data-i18n="games.matrixDesc">
            Paint melodies directly onto the grid. Because every row is locked to the selected cultural mode, 
            <strong>there are no "wrong notes"</strong>—every combination produces authentic harmony!
          </p>

          <div class="controls-row justify-between align-center flex-wrap">
            <div class="matrix-scale-selector">
              <label data-i18n="games.selectCulturalMode">Select Cultural Mode:</label>
              <select id="matrixScaleSelect" class="select-input">
                ${this.scales.map(s => `<option value="${s.id}">${this.getScaleName(s.id)}</option>`).join('')}
              </select>
            </div>

            <div class="matrix-instrument-selector">
              <label data-i18n="games.instrument">Instrument:</label>
              <select id="matrixInstSelect" class="select-input">
                <option value="guzheng" data-i18n="games.instGuzheng">${i18n.t('games.instGuzheng')}</option>
                <option value="flute" data-i18n="games.instFlute">${i18n.t('games.instFlute')}</option>
                <option value="rhodes" data-i18n="games.instRhodes">${i18n.t('games.instRhodes')}</option>
                <option value="leadSynth" data-i18n="games.instLeadSynth">${i18n.t('games.instLeadSynth')}</option>
              </select>
            </div>

            <div class="transport-buttons">
              <button class="btn btn-primary" id="btnToggleMatrix" data-i18n="games.playLoop">▶ Play Loop</button>
              <button class="btn btn-pill" id="btnRandomizeMatrix" data-i18n="games.randomize">🎲 Randomize</button>
              <button class="btn btn-pill" id="btnClearMatrix" data-i18n="games.clear">🧹 Clear</button>
            </div>
          </div>

          <div class="matrix-grid-container" id="matrixGridContainer"></div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  updateLanguage() {
    const badge = this.container.querySelector('#matrixScaleBadge');
    if (badge) badge.textContent = this.getScaleName(this.selectedScale.id);

    const scaleSelect = this.container.querySelector('#matrixScaleSelect');
    if (scaleSelect) {
      scaleSelect.querySelectorAll('option').forEach(opt => {
        opt.textContent = this.getScaleName(opt.value);
      });
    }

    const instSelect = this.container.querySelector('#matrixInstSelect');
    if (instSelect) {
      instSelect.querySelectorAll('option').forEach(opt => {
        if (opt.value === 'guzheng') opt.textContent = i18n.t('games.instGuzheng');
        else if (opt.value === 'flute') opt.textContent = i18n.t('games.instFlute');
        else if (opt.value === 'rhodes') opt.textContent = i18n.t('games.instRhodes');
        else if (opt.value === 'leadSynth') opt.textContent = i18n.t('games.instLeadSynth');
      });
    }

    const toggleBtn = this.container.querySelector('#btnToggleMatrix');
    if (toggleBtn) {
      const key = this.isPlaying ? 'games.stopLoop' : 'games.playLoop';
      toggleBtn.textContent = i18n.t(key);
      toggleBtn.setAttribute('data-i18n', key);
    }

    i18n.applyDomTranslations(this.container);
  }

  bindEvents() {
    const scaleSelect = this.container.querySelector('#matrixScaleSelect');
    scaleSelect.addEventListener('change', (e) => {
      const id = e.target.value;
      this.selectedScale = this.scales.find(s => s.id === id);
      this.container.querySelector('#matrixScaleBadge').textContent = this.getScaleName(this.selectedScale.id);
      this.container.querySelector('#matrixInstSelect').value = this.selectedScale.inst;
      this.resetGrid();
      this.loadDefaultPreset();
      this.renderMatrix();
    });

    const toggleBtn = this.container.querySelector('#btnToggleMatrix');
    let isPending = false;
    toggleBtn.addEventListener('click', async (e) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      if (isPending) return;
      isPending = true;
      try {
        await audioEngine.init();
        if (this.isPlaying) {
          this.stop();
        } else {
          await this.start();
        }
      } finally {
        isPending = false;
      }
    });

    const clearBtn = this.container.querySelector('#btnClearMatrix');
    clearBtn.addEventListener('click', () => {
      this.resetGrid();
      this.renderMatrix();
    });

    const randBtn = this.container.querySelector('#btnRandomizeMatrix');
    randBtn.addEventListener('click', () => {
      this.resetGrid();
      const numRows = this.selectedScale.intervals.length;
      for (let col = 0; col < this.steps; col++) {
        if (Math.random() > 0.3) {
          const row = Math.floor(Math.random() * numRows);
          this.grid[row][col] = true;
        }
      }
      this.renderMatrix();
    });
  }

  renderMatrix() {
    const container = this.container.querySelector('#matrixGridContainer');
    container.innerHTML = '';

    const numRows = this.selectedScale.intervals.length;

    // Rows from top (highest pitch) to bottom (root pitch)
    for (let r = numRows - 1; r >= 0; r--) {
      const interval = this.selectedScale.intervals[r];
      const midi = this.rootMidi + interval;
      const noteName = TuningSystems.midiToNoteName(midi);

      const rowElem = document.createElement('div');
      rowElem.className = 'matrix-row';

      const label = document.createElement('div');
      label.className = 'matrix-row-label';
      label.textContent = noteName;
      rowElem.appendChild(label);

      const cellsWrapper = document.createElement('div');
      cellsWrapper.className = 'matrix-cells-wrapper';

      for (let c = 0; c < this.steps; c++) {
        const cell = document.createElement('div');
        const isActive = this.grid[r][c];
        const isCurrent = this.isPlaying && (this.currentStep % this.steps === c);

        cell.className = `matrix-cell ${isActive ? 'active' : ''} ${isCurrent ? 'current-step' : ''}`;
        if (c % 4 === 0) cell.classList.add('beat-down');

        cell.addEventListener('click', () => {
          this.grid[r][c] = !this.grid[r][c];
          cell.classList.toggle('active', this.grid[r][c]);
          if (this.grid[r][c]) {
            // Audition note
            const freq = TuningSystems.midiToFreq(midi);
            const inst = this.container.querySelector('#matrixInstSelect').value;
            instruments.playInstrument(inst, freq, 0.6, null, 0.4);
          }
        });

        cellsWrapper.appendChild(cell);
      }

      rowElem.appendChild(cellsWrapper);
      container.appendChild(rowElem);
    }
  }

  updateToggleButton(isPlaying) {
    const toggleBtn = this.container ? this.container.querySelector('#btnToggleMatrix') : null;
    if (!toggleBtn) return;
    if (isPlaying) {
      toggleBtn.textContent = i18n.t('games.stopLoop');
      toggleBtn.setAttribute('data-i18n', 'games.stopLoop');
      toggleBtn.classList.remove('btn-primary');
      toggleBtn.classList.add('btn-danger');
    } else {
      toggleBtn.textContent = i18n.t('games.playLoop');
      toggleBtn.setAttribute('data-i18n', 'games.playLoop');
      toggleBtn.classList.remove('btn-danger');
      toggleBtn.classList.add('btn-primary');
    }
  }

  async start() {
    if (this.isPlaying) return;
    await instruments.ensureAudio();
    audioEngine.requestPlayback('melodyMatrix', () => this.stop());
    this.isPlaying = true;
    this.currentStep = 0;
    this.updateToggleButton(true);
    this.tick();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) clearTimeout(this.timerId);
    audioEngine.releasePlayback('melodyMatrix');
    this.updateToggleButton(false);
    this.renderMatrix();
  }

  tick() {
    if (!this.isPlaying) return;

    const col = this.currentStep % this.steps;
    const numRows = this.selectedScale.intervals.length;
    const inst = this.container.querySelector('#matrixInstSelect').value;

    for (let r = 0; r < numRows; r++) {
      if (this.grid[r][col]) {
        const interval = this.selectedScale.intervals[r];
        const midi = this.rootMidi + interval;
        const freq = TuningSystems.midiToFreq(midi);
        instruments.playInstrument(inst, freq, 0.7, null, 0.38);
      }
    }

    // Subtle rhythmic pulse on 1st beat of each measure
    if (col % 4 === 0) {
      instruments.playDrum('hihat', null, 0.2);
    }

    // Update current step highlighting without full redraw
    const allCells = this.container.querySelectorAll('.matrix-cell');
    allCells.forEach(c => c.classList.remove('current-step'));

    const activeColCells = this.container.querySelectorAll(`.matrix-cells-wrapper .matrix-cell:nth-child(${col + 1})`);
    activeColCells.forEach(c => c.classList.add('current-step'));

    this.currentStep++;
    const stepDuration = (60000 / this.bpm) / 4;
    this.timerId = setTimeout(() => this.tick(), stepDuration);
  }

  destroy() {
    this.stop();
  }
}
