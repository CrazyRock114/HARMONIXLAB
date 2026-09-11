/**
 * StyleChameleon.js
 * The Chameleon Jukebox: Rearrange the same musical piece into 6 radically distinct genres in real-time!
 * Supports Beethoven's "Ode to Joy", "Greensleeves", "Twinkle Variations", and "Minuet in G".
 * Real-time multi-track Web Audio arrangement with live piano roll visualizer.
 */

import { ScalesData } from '../audio/ScalesData.js';
import { TuningSystems } from '../audio/TuningSystems.js';
import { instruments } from '../audio/SynthInstruments.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class StyleChameleon {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.motifs = ScalesData.motifs;
    this.styles = ScalesData.styles;

    this.currentMotif = this.motifs.odeToJoy;
    this.currentStyle = this.styles[0]; // Classical
    this.isPlaying = false;
    this.currentNoteIndex = 0;
    this.timerId = null;

    // Track Mutes
    this.mutes = { lead: false, chords: false, bass: false, drums: false };

    this.initDOM();
    this.initCanvas();
    this.renderPianoRoll();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="chameleon-layout">
        <!-- Header & Motif Selector -->
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🦎</span> <span data-i18n="games.chameleonTitle">The Chameleon Jukebox (Style Re-Arranger)</span></h3>
            <span class="badge" id="currentStyleBadge">${this.getStyleName(this.currentStyle.id)}</span>
          </div>
          <p class="panel-desc" data-i18n="games.chameleonDesc">
            Music is a shape-shifter! Pick a classic motif below, then switch styles in real-time. 
            Watch and hear how the <strong>exact same melody</strong> transforms through cultural scales, instrumentation, and rhythmic grooves!
          </p>

          <div class="controls-row justify-between align-center flex-wrap">
            <div class="motif-selector-group">
              <label data-i18n="games.selectMotif">Select Melodic Motif:</label>
              <select id="motifSelect" class="select-input">
                <option value="odeToJoy" data-i18n="games.motifOdeToJoy">${i18n.t('games.motifOdeToJoy')}</option>
                <option value="greensleeves" data-i18n="games.motifGreensleeves">${i18n.t('games.motifGreensleeves')}</option>
                <option value="twinkle" data-i18n="games.motifTwinkle">${i18n.t('games.motifTwinkle')}</option>
                <option value="bachMinuet" data-i18n="games.motifBachMinuet">${i18n.t('games.motifBachMinuet')}</option>
              </select>
            </div>

            <div class="transport-buttons">
              <button class="btn btn-primary btn-lg" id="btnTogglePlayback" data-i18n="games.startPlaying">▶ Start Playing</button>
              <div class="tempo-control inline-flex align-center">
                <label><span data-i18n="games.bpm">BPM</span>: <span id="chameleonBpmVal" class="mono-value">108</span></label>
                <input type="range" id="chameleonBpmSlider" min="60" max="160" step="2" value="108">
              </div>
            </div>
          </div>
        </div>

        <!-- 6 Genre Style Cards -->
        <div class="styles-grid" id="stylesGrid"></div>

        <!-- Live Piano Roll & Mixer -->
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🎹</span> <span data-i18n="games.realtimeMixer">Real-time Arrangement & Mixer</span></h3>
            <div class="mixer-controls" id="mixerControls">
              <button class="btn btn-sm btn-pill" data-track="lead"></button>
              <button class="btn btn-sm btn-pill" data-track="chords"></button>
              <button class="btn btn-sm btn-pill" data-track="bass"></button>
              <button class="btn btn-sm btn-pill" data-track="drums"></button>
            </div>
          </div>

          <div class="canvas-wrapper">
            <canvas id="pianoRollCanvas" width="800" height="180"></canvas>
          </div>
        </div>
      </div>
    `;

    this.renderStylesGrid();
    this.updateMixerUI();
    this.bindEvents();

    if (typeof i18n.onLanguageChange === 'function') {
      this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
    }
  }

  getStyleName(id) {
    const map = {
      classical: 'games.styleClassical',
      jazz: 'games.styleJazz',
      jazz_bossa: 'games.styleJazz',
      cyberpunk: 'games.styleCyberpunk',
      sizhu: 'games.styleSizhu',
      reggae: 'games.styleReggae',
      reggae_dub: 'games.styleReggae',
      celtic: 'games.styleCeltic',
      celtic_jig: 'games.styleCeltic'
    };
    return i18n.t(map[id] || id);
  }

  getStyleDesc(id) {
    const map = {
      classical: 'games.styleClassicalDesc',
      jazz: 'games.styleJazzDesc',
      jazz_bossa: 'games.styleJazzDesc',
      cyberpunk: 'games.styleCyberpunkDesc',
      sizhu: 'games.styleSizhuDesc',
      reggae: 'games.styleReggaeDesc',
      reggae_dub: 'games.styleReggaeDesc',
      celtic: 'games.styleCelticDesc',
      celtic_jig: 'games.styleCelticDesc'
    };
    return i18n.t(map[id] || id);
  }

  renderStylesGrid() {
    const grid = this.container.querySelector('#stylesGrid');
    if (!grid) return;
    grid.innerHTML = this.styles.map(s => {
      const isCur = s.id === this.currentStyle.id;
      return `
        <div class="style-card ${isCur ? 'active' : ''}" data-id="${s.id}">
          <div class="style-icon">${s.icon}</div>
          <div class="style-info">
            <h4>${this.getStyleName(s.id)}</h4>
            <p class="style-groove">${this.getStyleDesc(s.id)}</p>
            <div class="style-tags">
              <span class="badge badge-sm">${s.meter}</span>
              <span class="badge badge-sm">${s.bpm} BPM</span>
              <span class="badge badge-sm">${s.instruments.lead}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const cards = grid.querySelectorAll('.style-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const styleId = card.dataset.id;
        this.currentStyle = this.styles.find(s => s.id === styleId);
        this.container.querySelector('#currentStyleBadge').textContent = this.getStyleName(this.currentStyle.id);
        this.container.querySelector('#chameleonBpmSlider').value = this.currentStyle.bpm;
        this.container.querySelector('#chameleonBpmVal').textContent = this.currentStyle.bpm;
        this.renderPianoRoll();
      });
    });
  }

  updateMixerUI() {
    const tracks = ['lead', 'chords', 'bass', 'drums'];
    tracks.forEach(track => {
      const btn = this.container.querySelector(`button[data-track="${track}"]`);
      if (btn) {
        const trackName = i18n.t(`games.${track}`);
        const state = this.mutes[track] ? i18n.t('app.mute') : i18n.t('app.on');
        btn.textContent = `${trackName}: ${state}`;
      }
    });
  }

  updateLanguage() {
    const badge = this.container.querySelector('#currentStyleBadge');
    if (badge) badge.textContent = this.getStyleName(this.currentStyle.id);

    this.renderStylesGrid();

    const motifSelect = this.container.querySelector('#motifSelect');
    if (motifSelect) {
      motifSelect.querySelectorAll('option').forEach(opt => {
        if (opt.value === 'odeToJoy') opt.textContent = i18n.t('games.motifOdeToJoy');
        else if (opt.value === 'greensleeves') opt.textContent = i18n.t('games.motifGreensleeves');
        else if (opt.value === 'twinkle') opt.textContent = i18n.t('games.motifTwinkle');
        else if (opt.value === 'bachMinuet') opt.textContent = i18n.t('games.motifBachMinuet');
      });
    }

    this.updateMixerUI();
    i18n.applyDomTranslations(this.container);
  }

  initCanvas() {
    this.canvas = document.getElementById('pianoRollCanvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    const motifSelect = this.container.querySelector('#motifSelect');
    motifSelect.addEventListener('change', (e) => {
      this.currentMotif = this.motifs[e.target.value];
      this.currentNoteIndex = 0;
      this.renderPianoRoll();
    });

    const toggleBtn = this.container.querySelector('#btnTogglePlayback');
    toggleBtn.addEventListener('click', async () => {
      await audioEngine.init();
      if (this.isPlaying) {
        this.stop();
        toggleBtn.textContent = i18n.t('games.startPlaying');
        toggleBtn.setAttribute('data-i18n', 'games.startPlaying');
        toggleBtn.classList.remove('btn-danger');
        toggleBtn.classList.add('btn-primary');
      } else {
        this.start();
        toggleBtn.textContent = i18n.t('games.stopPlaying');
        toggleBtn.setAttribute('data-i18n', 'games.stopPlaying');
        toggleBtn.classList.remove('btn-primary');
        toggleBtn.classList.add('btn-danger');
      }
    });

    const bpmSlider = this.container.querySelector('#chameleonBpmSlider');
    const bpmVal = this.container.querySelector('#chameleonBpmVal');
    bpmSlider.addEventListener('input', (e) => {
      this.currentStyle.bpm = parseInt(e.target.value, 10);
      bpmVal.textContent = this.currentStyle.bpm;
    });

    // Mixer Buttons
    const mixerBtns = this.container.querySelectorAll('#mixerControls button');
    mixerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const track = btn.dataset.track;
        this.mutes[track] = !this.mutes[track];
        btn.classList.toggle('active-muted', this.mutes[track]);
        this.updateMixerUI();
      });
    });
  }

  async start() {
    await instruments.ensureAudio();
    if (audioEngine.ctx && audioEngine.ctx.state === 'suspended') {
      try { await audioEngine.ctx.resume(); } catch (e) {}
    }
    this.isPlaying = true;
    this.currentNoteIndex = 0;
    if (this.timerId) clearTimeout(this.timerId);
    this.tick();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.renderPianoRoll();
  }

  /**
   * Quantize semitone step based on current genre's scale (e.g. pentatonic quantization for Chinese style)
   */
  adaptPitchForStyle(step) {
    const sId = this.currentStyle.id;
    if (sId === 'sizhu') {
      // Quantize to Pentatonic (0, 2, 4, 7, 9)
      const pentatonic = [0, 2, 4, 7, 9, 12, 14, 16];
      let closest = pentatonic[0];
      let minDiff = 999;
      pentatonic.forEach(p => {
        const diff = Math.abs(p - step);
        if (diff < minDiff) {
          minDiff = diff;
          closest = p;
        }
      });
      return closest;
    } else if (sId === 'cyberpunk') {
      // Phrygian flavor: if major 3rd (4) appears, flatten to minor 3rd (3)
      if (step === 4) return 3;
      if (step === 11) return 10;
      return step;
    } else if (sId === 'reggae_dub') {
      // Mixolydian: b7 (10 instead of 11)
      if (step === 11) return 10;
      return step;
    }
    return step;
  }

  tick() {
    if (!this.isPlaying) return;

    const notes = this.currentMotif.notes;
    const note = notes[this.currentNoteIndex];
    const root = this.currentMotif.rootMidi;
    const style = this.currentStyle;

    const adaptedStep = this.adaptPitchForStyle(note.step);
    const leadMidi = root + adaptedStep;
    const leadFreq = TuningSystems.midiToFreq(leadMidi);

    const step16thDuration = (60000 / style.bpm) / 4;
    const noteDurationMs = Math.max(50, note.dur * step16thDuration);

    try {
      // 1. Play Lead Instrument
      if (!this.mutes.lead) {
        instruments.playInstrument(style.instruments.lead, leadFreq, (noteDurationMs / 1000) * 0.95, null, 0.4);
      }

      // 2. Play Bass & Chords
      if (!this.mutes.bass) {
        const bassMidi = root - 24 + (((adaptedStep % 12) + 12) % 12);
        const bassFreq = TuningSystems.midiToFreq(bassMidi);
        instruments.playInstrument(style.instruments.bass, bassFreq, Math.max(0.2, (noteDurationMs / 1000) * 1.1), null, 0.45);
      }

      if (!this.mutes.chords) {
        // Voicing based on genre
        let chordIntervals = [0, 4, 7]; // Major triad default
        if (style.id === 'jazz_bossa') {
          // Jazz Major 9th or Minor 9th
          chordIntervals = [0, 4, 7, 11, 14];
        } else if (style.id === 'sizhu') {
          chordIntervals = [0, 7, 12]; // Open 5ths / octaves
        } else if (style.id === 'cyberpunk') {
          chordIntervals = [0, 3, 7, 10]; // Minor 7th
        } else if (style.id === 'reggae_dub') {
          chordIntervals = [0, 4, 7]; // Staccato triad
        }

        chordIntervals.forEach(ci => {
          const chordFreq = TuningSystems.midiToFreq(root - 12 + ci);
          instruments.playInstrument(style.instruments.chords, chordFreq, Math.max(0.15, (noteDurationMs / 1000) * 0.9), null, 0.22);
        });
      }

      // 3. Play Drum Groove per genre
      if (!this.mutes.drums) {
        if (style.id === 'jazz_bossa') {
          instruments.playDrum('clave', null, 0.5);
          instruments.playDrum('hihat', null, 0.3);
        } else if (style.id === 'cyberpunk') {
          instruments.playDrum('kick', null, 0.85);
          if (this.currentNoteIndex % 2 === 1) instruments.playDrum('snare', null, 0.7);
          instruments.playDrum('hihat', null, 0.4);
        } else if (style.id === 'sizhu') {
          if (this.currentNoteIndex % 4 === 0) instruments.playDrum('woodblock', null, 0.6);
        } else if (style.id === 'reggae_dub') {
          // One drop: snare + kick together on 3rd beat
          if (this.currentNoteIndex % 2 === 1) {
            instruments.playDrum('snare', null, 0.8);
            instruments.playDrum('kick', null, 0.7);
          }
          instruments.playDrum('hihat', null, 0.3);
        } else if (style.id === 'celtic_jig') {
          instruments.playDrum('bodhran', null, 0.7);
        }
      }

      this.renderPianoRoll();
    } catch (err) {
      console.warn('StyleChameleon audio/render glitch:', err);
    }

    // Always advance note index and schedule next tick so playback never halts!
    if (this.isPlaying) {
      this.currentNoteIndex = (this.currentNoteIndex + 1) % notes.length;
      this.timerId = setTimeout(() => this.tick(), noteDurationMs);
    }
  }

  renderPianoRoll() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const notes = this.currentMotif.notes;

    ctx.clearRect(0, 0, width, height);

    // Background grid
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);

    // Pitch range min and max
    const steps = notes.map(n => this.adaptPitchForStyle(n.step));
    const minStep = Math.min(...steps, 0);
    const maxStep = Math.max(...steps, 12);
    const range = Math.max(1, maxStep - minStep + 4);

    // Timeline mapping
    const totalDuration = notes.reduce((sum, n) => sum + n.dur, 0);
    let currentX = 20;
    const usableWidth = width - 40;

    notes.forEach((n, idx) => {
      const w = (n.dur / totalDuration) * usableWidth;
      const adapted = this.adaptPitchForStyle(n.step);
      const normY = (adapted - minStep + 1) / range;
      const y = height - 25 - normY * (height - 50);
      const isCurrent = this.isPlaying && idx === ((this.currentNoteIndex - 1 + notes.length) % notes.length);

      // Note bar
      ctx.fillStyle = isCurrent ? '#ffffff' : (this.currentStyle.id === 'cyberpunk' ? '#f43f5e' : (this.currentStyle.id === 'sizhu' ? '#f59e0b' : '#00f2fe'));
      ctx.shadowColor = isCurrent ? '#00f2fe' : 'transparent';
      ctx.shadowBlur = isCurrent ? 12 : 0;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(currentX, y, Math.max(8, w - 3), 14, 4);
      } else {
        ctx.rect(currentX, y, Math.max(8, w - 3), 14);
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Note label
      if (w > 20) {
        ctx.fillStyle = isCurrent ? '#0a0e17' : '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(TuningSystems.NOTE_NAMES[(this.currentMotif.rootMidi + adapted) % 12], currentX + 4, y + 10);
      }

      currentX += w;
    });
  }

  destroy() {
    this.stop();
  }
}
