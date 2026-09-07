/**
 * WorldGrooves.js
 * Cross-cultural rhythm engine: Latin Claves, Flamenco 12-beat Compás,
 * Balkan odd meters (7/8, 11/8), and an interactive Swing/Microtiming slider.
 */

import { instruments } from '../audio/SynthInstruments.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class WorldGrooves {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.grooves = [
      {
        id: 'son_clave_32',
        nameKey: 'rhythm.grooveSonClave',
        name: 'Cuban Son Clave (3:2)',
        region: 'Cuba / Caribbean',
        meter: '4/4',
        bpm: 100,
        pattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0],
        drum: 'clave',
        descKey: 'rhythm.grooveSonClaveDesc'
      },
      {
        id: 'son_clave_23',
        nameKey: 'rhythm.grooveRumbaClave',
        name: 'Cuban Son Clave (2:3)',
        region: 'Cuba / Caribbean',
        meter: '4/4',
        bpm: 100,
        pattern: [0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
        drum: 'clave',
        descKey: 'rhythm.grooveRumbaClaveDesc'
      },
      {
        id: 'bossa_nova',
        nameKey: 'rhythm.grooveBossaName',
        name: 'Brazilian Bossa Nova Clave',
        region: 'Brazil',
        meter: '4/4',
        bpm: 120,
        pattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        drum: 'woodblock',
        descKey: 'rhythm.grooveBossaDesc'
      },
      {
        id: 'flamenco_solea',
        nameKey: 'rhythm.grooveFlamenco',
        name: 'Flamenco Compás (Soleá 12-beat)',
        region: 'Andalusia, Spain',
        meter: '12-Beat Cycle',
        bpm: 90,
        pattern: [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1],
        drum: 'clave',
        descKey: 'rhythm.grooveFlamencoDesc'
      },
      {
        id: 'balkan_7_8',
        nameKey: 'rhythm.grooveBalkan78',
        name: 'Balkan Kalamatianos (7/8)',
        region: 'Greece / Bulgaria / Balkans',
        meter: '7/8 (3 + 2 + 2)',
        bpm: 130,
        pattern: [1, 0, 0, 1, 0, 1, 0],
        drum: 'bongo',
        descKey: 'rhythm.grooveBalkan78Desc'
      },
      {
        id: 'balkan_11_8',
        nameKey: 'rhythm.grooveBalkan118',
        name: 'Balkan Kopanitsa (11/8)',
        region: 'Bulgaria',
        meter: '11/8 (2 + 2 + 3 + 2 + 2)',
        bpm: 140,
        pattern: [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
        drum: 'bongo',
        descKey: 'rhythm.grooveBalkan118Desc'
      }
    ];

    this.selectedGroove = this.grooves[0];
    this.isPlaying = false;
    this.currentStep = 0;
    this.timerId = null;
    this.swingAmount = 0; // 0 = straight, 0.33 = triplet swing, 0.5 = heavy swing

    this.initDOM();
    this.renderGrooveList();
    this.updateGrooveUI();

    this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="lab-grid">
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🌍</span> <span data-i18n="rhythm.grooveTitle">World Groove Explorer</span></h3>
            <span class="badge" id="grooveRegionBadge">Cuba / Caribbean</span>
          </div>
          <p class="panel-desc" id="grooveDescText"></p>

          <div class="groove-pattern-display" id="groovePatternDisplay"></div>

          <div class="controls-row justify-between align-center">
            <button class="btn btn-primary" id="btnToggleGroove" data-i18n="rhythm.playGroove">▶ Play Groove</button>
            <div class="tempo-control">
              <label><span data-i18n="rhythm.tempo">Tempo</span>: <span id="grooveBpmVal" class="mono-value">100 BPM</span></label>
              <input type="range" id="grooveBpmSlider" min="60" max="180" step="2" value="100">
            </div>
          </div>
        </div>

        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🎷</span> <span data-i18n="rhythm.swingTitle">The Science of Swing & Microtiming</span></h3>
            <span class="badge" data-i18n="rhythm.swingBadge">Groove Physics</span>
          </div>
          <p class="panel-desc" data-i18n="rhythm.swingDesc">
            In Western classical music, eighth notes are played mathematically straight (\(50\% : 50\%\)). 
            In <strong>Jazz, Blues, and Hip-Hop</strong>, the second note is delayed (\(60\% : 40\%\) or \(67\% : 33\%\) triplet feel). 
            Adjust the slider below to hear straight rhythm morph into infectious swing!
          </p>

          <div class="slider-group">
            <label><span data-i18n="rhythm.swingRatio">Swing Ratio:</span> <span id="swingRatioVal" class="mono-value highlight-amber">50% (Straight)</span></label>
            <input type="range" id="swingSlider" min="0" max="0.5" step="0.05" value="0">
          </div>

          <div class="grooves-selection-list">
            <h4 data-i18n="rhythm.selectCulturalGroove">${i18n.t('rhythm.selectCulturalGroove')}</h4>
            <div id="groovesSelectionList"></div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderGrooveList() {
    const list = this.container.querySelector('#groovesSelectionList');
    if (!list) return;
    list.innerHTML = this.grooves.map((g) => {
      const isActive = this.selectedGroove && this.selectedGroove.id === g.id;
      return `
        <button class="btn btn-pill ${isActive ? 'active' : ''}" data-id="${g.id}" data-i18n="${g.nameKey}">
          ${i18n.t(g.nameKey)}
        </button>
      `;
    }).join('');
    this.bindGrooveButtons();
  }

  bindEvents() {
    const toggleBtn = this.container.querySelector('#btnToggleGroove');
    toggleBtn.addEventListener('click', async () => {
      await audioEngine.init();
      if (this.isPlaying) {
        this.stop();
        toggleBtn.textContent = i18n.t('rhythm.playGroove');
        toggleBtn.setAttribute('data-i18n', 'rhythm.playGroove');
        toggleBtn.classList.remove('btn-danger');
        toggleBtn.classList.add('btn-primary');
      } else {
        this.start();
        toggleBtn.textContent = i18n.t('rhythm.stopGroove');
        toggleBtn.setAttribute('data-i18n', 'rhythm.stopGroove');
        toggleBtn.classList.remove('btn-primary');
        toggleBtn.classList.add('btn-danger');
      }
    });

    const bpmSlider = this.container.querySelector('#grooveBpmSlider');
    const bpmVal = this.container.querySelector('#grooveBpmVal');
    bpmSlider.addEventListener('input', (e) => {
      this.selectedGroove.bpm = parseInt(e.target.value, 10);
      bpmVal.textContent = `${this.selectedGroove.bpm} BPM`;
    });

    const swingSlider = this.container.querySelector('#swingSlider');
    const swingVal = this.container.querySelector('#swingRatioVal');
    swingSlider.addEventListener('input', (e) => {
      this.swingAmount = parseFloat(e.target.value);
      if (this.swingAmount === 0) swingVal.textContent = i18n.t('rhythm.grooveStraight');
      else if (this.swingAmount <= 0.2) swingVal.textContent = i18n.t('rhythm.grooveLightSwing');
      else if (this.swingAmount <= 0.35) swingVal.textContent = i18n.t('rhythm.grooveSwing');
      else swingVal.textContent = i18n.t('rhythm.grooveHardSwing');
    });
  }

  bindGrooveButtons() {
    const grooveBtns = this.container.querySelectorAll('#groovesSelectionList button');
    grooveBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        grooveBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const id = btn.dataset.id;
        this.selectedGroove = this.grooves.find(g => g.id === id);
        this.updateGrooveUI();
        this.currentStep = 0;
      });
    });
  }

  updateGrooveUI() {
    const g = this.selectedGroove;
    this.container.querySelector('#grooveRegionBadge').textContent = g.region;
    this.container.querySelector('#grooveDescText').textContent = i18n.t(g.descKey);
    this.container.querySelector('#grooveBpmSlider').value = g.bpm;
    this.container.querySelector('#grooveBpmVal').textContent = `${g.bpm} BPM`;

    const display = this.container.querySelector('#groovePatternDisplay');
    display.innerHTML = '';

    g.pattern.forEach((val, idx) => {
      const step = document.createElement('div');
      step.className = `groove-step ${val ? 'hit' : 'rest'} ${this.isPlaying && this.currentStep === idx ? 'active' : ''}`;
      step.textContent = val ? '●' : '·';
      display.appendChild(step);
    });
  }

  start() {
    this.isPlaying = true;
    this.currentStep = 0;
    this.tick();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) clearTimeout(this.timerId);
    this.updateGrooveUI();
  }

  tick() {
    if (!this.isPlaying) return;

    const g = this.selectedGroove;
    const len = g.pattern.length;
    const stepIdx = this.currentStep % len;

    if (g.pattern[stepIdx] === 1) {
      instruments.playDrum(g.drum, null, 0.9);
      // Background metronome pulse
      instruments.playDrum('hihat', null, 0.3);
    } else {
      instruments.playDrum('hihat', null, 0.15);
    }

    // Update active highlight in UI
    const steps = this.container.querySelectorAll('.groove-step');
    steps.forEach((s, idx) => {
      s.classList.toggle('active', idx === stepIdx);
    });

    this.currentStep++;

    // Base step duration (16th note in 4/4)
    let stepDuration = (60000 / g.bpm) / 4;

    // Apply swing delay to odd steps (off-beats)
    if (this.swingAmount > 0 && len === 16) {
      if (stepIdx % 2 === 0) {
        stepDuration *= (1 + this.swingAmount);
      } else {
        stepDuration *= (1 - this.swingAmount);
      }
    }

    this.timerId = setTimeout(() => this.tick(), stepDuration);
  }

  updateLanguage() {
    i18n.applyDomTranslations(this.container);
    this.renderGrooveList();
    this.updateGrooveUI();
  }

  destroy() {
    this.stop();
  }
}
