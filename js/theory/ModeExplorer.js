/**
 * ModeExplorer.js
 * The 7 Diatonic Modes arranged by the Brightness Spectrum (Lydian to Locrian).
 * Interactive Parallel Mode Switcher on a fixed tonic (C) with live audio comparison.
 */

import { ScalesData } from '../audio/ScalesData.js';
import { TuningSystems } from '../audio/TuningSystems.js';
import { instruments } from '../audio/SynthInstruments.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class ModeExplorer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.modes = ScalesData.diatonicModes;
    this.selectedMode = this.modes[0]; // Lydian (brightest)
    this.tonicMidi = 60; // C4
    this.activeTimeouts = [];

    this.initDOM();
    this.renderLadder();
    this.renderKeyboard();
    this.updateModeDetails();
    this.bindEvents();

    this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
  }

  getModeName(m) {
    const capId = m.id.charAt(0).toUpperCase() + m.id.slice(1);
    return i18n.t(`theory.mode${capId}Name`) || m.name;
  }

  getModeCharacteristic(m) {
    const capId = m.id.charAt(0).toUpperCase() + m.id.slice(1);
    return i18n.t(`theory.mode${capId}Char`) || m.characteristic;
  }

  getModeMood(m) {
    const capId = m.id.charAt(0).toUpperCase() + m.id.slice(1);
    return i18n.t(`theory.mode${capId}Mood`) || m.mood;
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="lab-grid">
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🌈</span> <span data-i18n="theory.modesTitle">The Mode Brightness Spectrum</span></h3>
            <span class="badge" data-i18n="theory.modesBadge">Modal Color</span>
          </div>
          <p class="panel-desc" data-i18n="theory.modesDesc">
            The 7 modes are not just random permutations—they form a smooth emotional gradient from 
            <strong>brightest (+1 sharp)</strong> to <strong>darkest (-5 flats)</strong>. 
            By flattening one note at each step, we descend into darker harmonic territory.
          </p>

          <div class="brightness-ladder" id="brightnessLadder"></div>

          <div class="controls-row justify-center align-center">
            <button class="btn btn-primary" id="btnPlayScale" data-i18n="theory.playScaleAsc">🎶 Play Scale Ascending</button>
            <button class="btn btn-accent" id="btnPlayMotif" data-i18n="theory.playCharMelody">🎵 Play Characteristic Melody</button>
          </div>
        </div>

        <div class="panel glass-panel">
          <div class="panel-header">
            <h3 id="modeTitle">Lydian Mode</h3>
            <span class="badge" id="modeCharacteristicBadge">#4 (Augmented 4th)</span>
          </div>

          <p class="panel-desc" id="modeMoodDesc"></p>

          <!-- Interactive Piano Keyboard Visualization -->
          <div class="piano-wrapper">
            <div class="piano-keyboard" id="modalPiano"></div>
          </div>

          <div class="formula-display" id="formulaDisplay"></div>

          <div class="famous-examples-box" id="famousExamplesBox"></div>
        </div>
      </div>
    `;
  }

  renderLadder() {
    const ladder = this.container.querySelector('#brightnessLadder');
    if (!ladder) return;
    ladder.innerHTML = this.modes.map((m) => {
      const isActive = this.selectedMode && this.selectedMode.id === m.id;
      return `
        <div class="ladder-item ${isActive ? 'active' : ''}" data-id="${m.id}" style="--mode-color: ${m.color}">
          <div class="ladder-rank">#${m.brightness}</div>
          <div class="ladder-name">
            <strong>${this.getModeName(m)}</strong>
            <span class="ladder-characteristic">${this.getModeCharacteristic(m)}</span>
          </div>
          <button class="btn btn-sm btn-icon-play" data-mode="${m.id}">▶</button>
        </div>
      `;
    }).join('');
    this.bindLadderEvents();
  }

  bindLadderEvents() {
    const ladderItems = this.container.querySelectorAll('.ladder-item');
    ladderItems.forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-icon-play')) return;
        ladderItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const modeId = item.dataset.id;
        this.selectedMode = this.modes.find(m => m.id === modeId);
        this.renderKeyboard();
        this.updateModeDetails();
      });

      const playBtn = item.querySelector('.btn-icon-play');
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const modeId = item.dataset.id;
        this.selectedMode = this.modes.find(m => m.id === modeId);
        ladderItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.renderKeyboard();
        this.updateModeDetails();
        this.playScale();
      });
    });
  }

  bindEvents() {
    const btnPlayScale = this.container.querySelector('#btnPlayScale');
    btnPlayScale.addEventListener('click', () => this.playScale());

    const btnPlayMotif = this.container.querySelector('#btnPlayMotif');
    btnPlayMotif.addEventListener('click', () => this.playMotif());
  }

  updateModeDetails() {
    const m = this.selectedMode;
    const modeName = this.getModeName(m);
    const modeChar = this.getModeCharacteristic(m);
    const modeMood = this.getModeMood(m);

    this.container.querySelector('#modeTitle').textContent = `${modeName} ${i18n.t('theory.modeTonic')}`;
    this.container.querySelector('#modeCharacteristicBadge').textContent = modeChar;
    this.container.querySelector('#modeMoodDesc').textContent = modeMood;

    const formula = this.container.querySelector('#formulaDisplay');
    formula.innerHTML = `
      <div class="formula-pill">
        <span class="formula-label" data-i18n="theory.formula">${i18n.t('theory.formula')}</span>
        <strong class="formula-code">${m.formula}</strong>
      </div>
    `;

    const examplesBox = this.container.querySelector('#famousExamplesBox');
    examplesBox.innerHTML = `
      <div class="examples-card">
        <span class="examples-header" data-i18n="theory.iconicExamples">${i18n.t('theory.iconicExamples')}</span>
        <ul>
          ${m.famousExamples.map(ex => `<li>${ex}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  updateLanguage() {
    i18n.applyDomTranslations(this.container);
    this.renderLadder();
    this.updateModeDetails();
  }

  renderKeyboard() {
    const piano = this.container.querySelector('#modalPiano');
    piano.innerHTML = '';

    // 1 Octave + 1 note (C4 to C5: 13 semitones)
    const activeIntervals = new Set(this.selectedMode.intervals);
    activeIntervals.add(12); // Octave

    // Note layout: 0 to 12 semitones
    const whiteKeySemitones = [0, 2, 4, 5, 7, 9, 11, 12];
    const blackKeySemitones = [1, 3, 6, 8, 10];

    // White keys
    const whiteContainer = document.createElement('div');
    whiteContainer.className = 'white-keys-container';

    whiteKeySemitones.forEach(semi => {
      const key = document.createElement('div');
      const isActive = activeIntervals.has(semi);
      key.className = `white-key ${isActive ? 'in-scale' : ''}`;
      key.dataset.semi = semi;
      key.innerHTML = `
        <span class="key-label">${TuningSystems.NOTE_NAMES[(this.tonicMidi + semi) % 12]}</span>
        ${isActive ? `<span class="degree-marker" style="background: ${this.selectedMode.color}"></span>` : ''}
      `;
      key.addEventListener('click', () => this.playKey(semi));
      whiteContainer.appendChild(key);
    });

    piano.appendChild(whiteContainer);

    // Black keys
    blackKeySemitones.forEach(semi => {
      const key = document.createElement('div');
      const isActive = activeIntervals.has(semi);
      key.className = `black-key ${isActive ? 'in-scale' : ''}`;
      key.dataset.semi = semi;

      // Position black key proportionally
      const positions = { 1: 10.5, 3: 23, 6: 48, 8: 60.5, 10: 73 };
      key.style.left = `${positions[semi]}%`;

      if (isActive) {
        key.innerHTML = `<span class="degree-marker" style="background: ${this.selectedMode.color}"></span>`;
      }
      key.addEventListener('click', () => this.playKey(semi));
      piano.appendChild(key);
    });
  }

  async playKey(semitone) {
    await instruments.ensureAudio();
    const freq = TuningSystems.midiToFreq(this.tonicMidi + semitone);
    instruments.playPluck(freq, 1.2, null, 0.4);
  }

  stop() {
    this.activeTimeouts.forEach(t => clearTimeout(t));
    this.activeTimeouts = [];
    audioEngine.releasePlayback('modeExplorer');
  }

  async playScale() {
    this.stop();
    await instruments.ensureAudio();
    audioEngine.requestPlayback('modeExplorer', () => this.stop());

    const scale = [...this.selectedMode.intervals, 12];
    scale.forEach((semi, idx) => {
      const freq = TuningSystems.midiToFreq(this.tonicMidi + semi);
      const timer = setTimeout(() => {
        instruments.playRhodes(freq, 0.9, null, 0.35);
      }, idx * 180);
      this.activeTimeouts.push(timer);
    });

    const endTimer = setTimeout(() => {
      this.stop();
    }, scale.length * 180 + 950);
    this.activeTimeouts.push(endTimer);
  }

  async playMotif() {
    this.stop();
    await instruments.ensureAudio();
    audioEngine.requestPlayback('modeExplorer', () => this.stop());

    const m = this.selectedMode.intervals;
    const melody = [
      { semi: m[0], dur: 0.25 },
      { semi: m[2], dur: 0.25 },
      { semi: m[4], dur: 0.25 },
      { semi: m[3], dur: 0.4 }, // characteristic 4th (or #4)
      { semi: m[5], dur: 0.3 }, // 6th
      { semi: m[6], dur: 0.3 }, // 7th
      { semi: 12,   dur: 0.6 }  // Octave
    ];

    let elapsed = 0;
    melody.forEach(n => {
      const timer = setTimeout(() => {
        const freq = TuningSystems.midiToFreq(this.tonicMidi + n.semi);
        instruments.playViolin(freq, n.dur * 1.5, null, 0.35);
      }, elapsed * 1000);
      this.activeTimeouts.push(timer);
      elapsed += n.dur;
    });

    const endTimer = setTimeout(() => {
      this.stop();
    }, elapsed * 1000 + 1000);
    this.activeTimeouts.push(endTimer);
  }
}
