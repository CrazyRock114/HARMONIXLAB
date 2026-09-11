/**
 * GlobalTraditions.js
 * Cross-cultural musical systems, non-Western tuning, and microtones.
 * Explores Chinese Sanfen Sunyi, Indian Ragas & Shrutis, Arabic Maqamat (24-TET), and Japanese scales.
 */

import { ScalesData } from '../audio/ScalesData.js';
import { TuningSystems } from '../audio/TuningSystems.js';
import { instruments } from '../audio/SynthInstruments.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class GlobalTraditions {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.traditions = ScalesData.worldTraditions;
    this.selected = this.traditions[0]; // Chinese Gong
    this.rootFreq = 261.63; // C4
    this.activeTimeouts = [];

    this.initDOM();
    this.renderTraditionsList();
    this.renderKeyboard();
    this.updateDetails();

    this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
  }

  getTraditionKey(t) {
    const map = {
      'chinese_gong': 'ChineseGong',
      'chinese_yu': 'ChineseYu',
      'indian_bhairav': 'IndianBhairav',
      'indian_yaman': 'IndianYaman',
      'arabic_hijaz': 'ArabicHijaz',
      'arabic_bayati': 'ArabicBayati',
      'japanese_hirajoshi': 'JapaneseHirajoshi',
      'japanese_insen': 'JapaneseInsen',
      'blues_hexatonic': 'Blues',
      'flamenco_gypsy': 'Flamenco'
    };
    return map[t.id] || '';
  }

  getTraditionName(t) {
    const k = this.getTraditionKey(t);
    return k ? (i18n.t(`theory.trad${k}Name`) || t.name) : t.name;
  }

  getTraditionRegion(t) {
    const k = this.getTraditionKey(t);
    return k ? (i18n.t(`theory.trad${k}Region`) || t.region) : t.region;
  }

  getTraditionTheory(t) {
    const k = this.getTraditionKey(t);
    return k ? (i18n.t(`theory.trad${k}Theory`) || t.theory) : t.theory;
  }

  getTraditionMood(t) {
    const k = this.getTraditionKey(t);
    return k ? (i18n.t(`theory.trad${k}Mood`) || t.mood) : t.mood;
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="lab-grid">
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🌏</span> <span data-i18n="theory.traditionsTitle">World Musical Traditions & Modes</span></h3>
            <span class="badge" data-i18n="theory.traditionsBadge">Cultural Ethnomusicology</span>
          </div>
          <p class="panel-desc" data-i18n="theory.traditionsDesc">
            Western 12-TET is just one of many brilliant human musical systems. Across Africa, Asia, and the Middle East, 
            musical cultures explored pentatonic simplicity, microtonal quarter-tones, and spiritual micro-intervals.
          </p>

          <div class="traditions-list" id="traditionsList"></div>
        </div>

        <div class="panel glass-panel">
          <div class="panel-header">
            <h3 id="traditionTitle">Chinese Pentatonic (Gong Mode)</h3>
            <span class="badge" id="traditionRegionBadge">East Asia</span>
          </div>

          <p class="panel-desc" id="traditionTheoryDesc"></p>

          <div class="cultural-instruments-tags" id="instrumentsTags"></div>

          <!-- Interactive Scale Key Pads -->
          <div class="scale-pads-wrapper">
            <div class="scale-pads" id="scalePads"></div>
          </div>

          <div class="controls-row justify-center">
            <button class="btn btn-primary" id="btnPlayWorldScale" data-i18n="theory.playFullScale">🔊 Play Full Scale</button>
            <button class="btn btn-accent" id="btnPlayWorldMelody" data-i18n="theory.playTradPhrasing">🎶 Play Traditional Phrasing</button>
          </div>

          <div class="alert alert-info" id="microtoneNotice" style="display: none;">
            <strong data-i18n="theory.microtoneAlertTitle">✨ Microtonal Quarter-Tone Alert:</strong> 
            <span data-i18n="theory.microtoneAlertDesc">This scale uses intervals impossible on a standard Western piano! Notice the 50-cent and 150-cent microtonal inflections.</span>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderTraditionsList() {
    const list = this.container.querySelector('#traditionsList');
    if (!list) return;
    list.innerHTML = this.traditions.map((t) => {
      const isActive = this.selected && this.selected.id === t.id;
      return `
        <div class="tradition-item ${isActive ? 'active' : ''}" data-id="${t.id}">
          <div class="tradition-icon" style="background: ${t.color}"></div>
          <div class="tradition-info">
            <strong>${this.getTraditionName(t)}</strong>
            <span class="tradition-region">${this.getTraditionRegion(t)}</span>
          </div>
        </div>
      `;
    }).join('');
    this.bindTraditionsEvents();
  }

  bindTraditionsEvents() {
    const items = this.container.querySelectorAll('.tradition-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const id = item.dataset.id;
        this.selected = this.traditions.find(t => t.id === id);
        this.updateDetails();
        this.renderKeyboard();
      });
    });
  }

  bindEvents() {
    const btnPlayScale = this.container.querySelector('#btnPlayWorldScale');
    btnPlayScale.addEventListener('click', () => this.playScale());

    const btnPlayMelody = this.container.querySelector('#btnPlayWorldMelody');
    btnPlayMelody.addEventListener('click', () => this.playMelody());
  }

  updateDetails() {
    const t = this.selected;
    this.container.querySelector('#traditionTitle').textContent = this.getTraditionName(t);
    this.container.querySelector('#traditionRegionBadge').textContent = this.getTraditionRegion(t);
    this.container.querySelector('#traditionTheoryDesc').innerHTML = `
      <strong data-i18n="theory.philosophyTuning">${i18n.t('theory.philosophyTuning')}</strong> ${this.getTraditionTheory(t)}<br>
      <span class="highlight-cyan" data-i18n="theory.moodRasa">${i18n.t('theory.moodRasa')}</span> <em>${this.getTraditionMood(t)}</em>
    `;

    // Instrument tags
    const tags = this.container.querySelector('#instrumentsTags');
    tags.innerHTML = `
      <span class="tags-label" data-i18n="theory.traditionalInstruments">${i18n.t('theory.traditionalInstruments')}</span>
      ${t.instruments.map(inst => `<span class="badge badge-pill">${inst}</span>`).join(' ')}
    `;

    // Check if microtonal
    const isMicrotonal = t.intervals.some(interval => interval % 1 !== 0);
    this.container.querySelector('#microtoneNotice').style.display = isMicrotonal ? 'block' : 'none';
  }

  updateLanguage() {
    i18n.applyDomTranslations(this.container);
    this.renderTraditionsList();
    this.updateDetails();
  }

  renderKeyboard() {
    const padsContainer = this.container.querySelector('#scalePads');
    padsContainer.innerHTML = '';

    const t = this.selected;
    t.intervals.forEach((interval, idx) => {
      const pad = document.createElement('div');
      pad.className = 'scale-pad';

      // Calculate frequency: supports quarter tones (0.5 semitone)
      const freq = this.rootFreq * Math.pow(2, interval / 12);
      const noteLabel = t.noteNames ? t.noteNames[idx] : (t.svaras ? t.svaras[idx] : `+${interval} st`);

      pad.innerHTML = `
        <span class="pad-name">${noteLabel}</span>
        <span class="pad-freq">${freq.toFixed(1)} Hz</span>
        <span class="pad-interval">${interval} st</span>
      `;

      pad.addEventListener('click', () => {
        this.playPad(interval);
        pad.classList.add('hit');
        setTimeout(() => pad.classList.remove('hit'), 200);
      });

      padsContainer.appendChild(pad);
    });
  }

  async playPad(interval) {
    await instruments.ensureAudio();
    const freq = this.rootFreq * Math.pow(2, interval / 12);

    // Pick instrument matching the cultural style
    if (this.selected.id.includes('chinese') || this.selected.id.includes('japanese')) {
      instruments.playPluck(freq, 1.4, null, 0.45);
    } else if (this.selected.id.includes('indian')) {
      instruments.playFlute(freq, 1.2, null, 0.4);
    } else if (this.selected.id.includes('arabic')) {
      instruments.playPluck(freq, 1.0, null, 0.4, 2500);
    } else {
      instruments.playRhodes(freq, 1.0, null, 0.35);
    }
  }

  stop() {
    this.activeTimeouts.forEach(t => clearTimeout(t));
    this.activeTimeouts = [];
    audioEngine.releasePlayback('globalTraditions');
  }

  async playScale() {
    this.stop();
    await instruments.ensureAudio();
    audioEngine.requestPlayback('globalTraditions', () => this.stop());

    const intervals = [...this.selected.intervals, 12];
    intervals.forEach((semi, idx) => {
      const timer = setTimeout(() => {
        this.playPad(semi);
      }, idx * 220);
      this.activeTimeouts.push(timer);
    });

    const endTimer = setTimeout(() => {
      this.stop();
    }, intervals.length * 220 + 1000);
    this.activeTimeouts.push(endTimer);
  }

  async playMelody() {
    this.stop();
    await instruments.ensureAudio();
    audioEngine.requestPlayback('globalTraditions', () => this.stop());

    const ints = this.selected.intervals;
    // Characteristic phrasing pattern for this mode
    const phrasing = [
      ints[0], ints[1], ints[2], ints[1], ints[0],
      ints[ints.length - 1], ints[ints.length - 2], ints[0]
    ];

    phrasing.forEach((semi, idx) => {
      const timer = setTimeout(() => {
        this.playPad(semi);
      }, idx * 240);
      this.activeTimeouts.push(timer);
    });

    const endTimer = setTimeout(() => {
      this.stop();
    }, phrasing.length * 240 + 1000);
    this.activeTimeouts.push(endTimer);
  }
}
