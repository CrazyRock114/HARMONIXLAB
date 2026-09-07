/**
 * CircleOfFifths.js
 * Interactive Circular Wheel of Fifths with Key Signatures, Relative Minors,
 * Geometric Chord Polygons, and Interactive Sound Triggers.
 */

import { TuningSystems } from '../audio/TuningSystems.js';
import { instruments } from '../audio/SynthInstruments.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class CircleOfFifths {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.selectedKeyIndex = 0; // C Major
    this.currentChordType = 'major'; // 'major', 'minor', 'maj7', 'dom7', 'dim'
    this.isPlaying = false;

    // 12 Keys around Circle (Clockwise = +1 sharp)
    this.keys = [
      { major: 'C',  minor: 'Am',  accidentals: 'Natural',  rootMidi: 60, angle: -Math.PI / 2 },
      { major: 'G',  minor: 'Em',  accidentals: '1 ♯',      rootMidi: 67, angle: -Math.PI / 2 + Math.PI / 6 },
      { major: 'D',  minor: 'Bm',  accidentals: '2 ♯',      rootMidi: 62, angle: -Math.PI / 2 + 2 * Math.PI / 6 },
      { major: 'A',  minor: 'F♯m', accidentals: '3 ♯',      rootMidi: 69, angle: -Math.PI / 2 + 3 * Math.PI / 6 },
      { major: 'E',  minor: 'C♯m', accidentals: '4 ♯',      rootMidi: 64, angle: -Math.PI / 2 + 4 * Math.PI / 6 },
      { major: 'B',  minor: 'G♯m', accidentals: '5 ♯',      rootMidi: 71, angle: -Math.PI / 2 + 5 * Math.PI / 6 },
      { major: 'F♯', minor: 'D♯m', accidentals: '6 ♯ / 6 ♭',rootMidi: 66, angle: -Math.PI / 2 + 6 * Math.PI / 6 },
      { major: 'D♭', minor: 'B♭m', accidentals: '5 ♭',      rootMidi: 61, angle: -Math.PI / 2 + 7 * Math.PI / 6 },
      { major: 'A♭', minor: 'Fm',  accidentals: '4 ♭',      rootMidi: 68, angle: -Math.PI / 2 + 8 * Math.PI / 6 },
      { major: 'E♭', minor: 'Cm',  accidentals: '3 ♭',      rootMidi: 63, angle: -Math.PI / 2 + 9 * Math.PI / 6 },
      { major: 'B♭', minor: 'Gm',  accidentals: '2 ♭',      rootMidi: 70, angle: -Math.PI / 2 + 10 * Math.PI / 6 },
      { major: 'F',  minor: 'Dm',  accidentals: '1 ♭',      rootMidi: 65, angle: -Math.PI / 2 + 11 * Math.PI / 6 }
    ];

    this.initDOM();
    this.initCanvas();
    this.bindEvents();
    this.updateKeyCard();
    this.render();

    this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="lab-grid">
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">⭕</span> <span data-i18n="theory.circleTitle">The Interactive Circle of Fifths</span></h3>
            <span class="badge" data-i18n="theory.circleBadge">Harmonic Clock</span>
          </div>
          <p class="panel-desc" data-i18n="theory.circleDesc">
            Moving clockwise adds <strong>sharps (\(\sharp\))</strong> via pure fifths (\(3:2\)). Moving counter-clockwise adds <strong>flats (\(\flat\))</strong>. 
            Click any key on the wheel to hear its harmony and explore its relative minor and geometric chord shapes.
          </p>

          <div class="canvas-wrapper flex-center">
            <canvas id="circleFifthsCanvas" width="460" height="460"></canvas>
          </div>

          <div class="controls-row justify-center chord-type-selector" id="chordTypeSelector">
            <button class="btn btn-sm btn-pill active" data-type="major" data-i18n="theory.chordMajor">Major Triad</button>
            <button class="btn btn-sm btn-pill" data-type="minor" data-i18n="theory.chordMinor">Minor Triad</button>
            <button class="btn btn-sm btn-pill" data-type="maj7" data-i18n="theory.chordMaj7">Major 7th</button>
            <button class="btn btn-sm btn-pill" data-type="dom7" data-i18n="theory.chordDom7">Dominant 7th</button>
            <button class="btn btn-sm btn-pill" data-type="dim" data-i18n="theory.chordDim">Diminished</button>
          </div>
        </div>

        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🔍</span> <span data-i18n="theory.selectedKeyArch">Selected Key Architecture</span></h3>
            <span class="badge" id="keyBadge">C Major / A Minor</span>
          </div>

          <div class="key-details-card" id="keyDetailsCard"></div>

          <div class="controls-row">
            <button class="btn btn-primary" id="btnPlayKeyChord" data-i18n="theory.playChord">🔊 Play Chord</button>
            <button class="btn btn-accent" id="btnPlayScaleRun" data-i18n="theory.playScaleArp">🎶 Play Scale Arpeggio</button>
          </div>

          <div class="theory-callout">
            <h4 data-i18n="theory.geomInsightTitle">💡 Geometric Harmony Insight:</h4>
            <p data-i18n="theory.geomInsightText">
              In Equal Temperament, every chord forms a distinct geometric polygon. Symmetrical chords like the 
              <strong>Diminished 7th</strong> form a perfect square, and the <strong>Augmented Triad</strong> forms an equilateral triangle. 
              Rotating the polygon transposes the chord without changing its internal shape!
            </p>
          </div>
        </div>
      </div>
    `;
  }

  initCanvas() {
    this.canvas = document.getElementById('circleFifthsCanvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    // Chord type buttons
    const chordBtns = this.container.querySelectorAll('#chordTypeSelector button');
    chordBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        chordBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentChordType = btn.dataset.type;
        this.render();
        this.playSelectedChord();
      });
    });

    // Canvas click to select key
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX - this.canvas.width / 2;
      const y = (e.clientY - rect.top) * scaleY - this.canvas.height / 2;

      const dist = Math.sqrt(x * x + y * y);
      if (dist >= 70 && dist <= 220) {
        // Calculate angle from 12 o'clock
        let angle = Math.atan2(y, x) + Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;
        const keyIndex = Math.floor((angle + Math.PI / 12) / (Math.PI / 6)) % 12;

        this.selectedKeyIndex = keyIndex;
        this.render();
        this.updateKeyCard();
        this.playSelectedChord();
      }
    });

    const btnPlayKeyChord = this.container.querySelector('#btnPlayKeyChord');
    btnPlayKeyChord.addEventListener('click', () => this.playSelectedChord());

    const btnPlayScaleRun = this.container.querySelector('#btnPlayScaleRun');
    btnPlayScaleRun.addEventListener('click', () => this.playScaleRun());
  }

  async playSelectedChord() {
    await instruments.ensureAudio();
    const key = this.keys[this.selectedKeyIndex];
    const root = key.rootMidi;

    // Chord intervals
    let intervals = [0, 4, 7]; // Major
    if (this.currentChordType === 'minor') intervals = [0, 3, 7];
    else if (this.currentChordType === 'maj7') intervals = [0, 4, 7, 11];
    else if (this.currentChordType === 'dom7') intervals = [0, 4, 7, 10];
    else if (this.currentChordType === 'dim') intervals = [0, 3, 6, 9];

    intervals.forEach((semitone, i) => {
      const freq = TuningSystems.midiToFreq(root + semitone);
      instruments.playRhodes(freq, 1.8, null, 0.28);
    });
  }

  async playScaleRun() {
    await instruments.ensureAudio();
    const key = this.keys[this.selectedKeyIndex];
    const root = key.rootMidi;
    const majorScale = [0, 2, 4, 5, 7, 9, 11, 12];

    majorScale.forEach((semitone, i) => {
      const freq = TuningSystems.midiToFreq(root + semitone);
      const delay = i * 0.12;
      setTimeout(() => {
        instruments.playPluck(freq, 0.8, null, 0.35);
      }, delay * 1000);
    });
  }

  updateKeyCard() {
    const key = this.keys[this.selectedKeyIndex];
    const badge = this.container.querySelector('#keyBadge');
    badge.textContent = `${key.major} Major / ${key.minor}`;

    const card = this.container.querySelector('#keyDetailsCard');
    const accidentalsDisplay = key.accidentals === 'Natural' ? i18n.t('theory.natural') : key.accidentals;
    card.innerHTML = `
      <div class="key-summary-grid">
        <div class="key-stat-box">
          <span class="stat-label" data-i18n="theory.keySignature">${i18n.t('theory.keySignature')}</span>
          <span class="stat-value highlight-cyan">${accidentalsDisplay}</span>
        </div>
        <div class="key-stat-box">
          <span class="stat-label" data-i18n="theory.parallelMinor">${i18n.t('theory.parallelMinor')}</span>
          <span class="stat-value">${key.major}m</span>
        </div>
        <div class="key-stat-box">
          <span class="stat-label" data-i18n="theory.relativeMinor">${i18n.t('theory.relativeMinor')}</span>
          <span class="stat-value highlight-violet">${key.minor}</span>
        </div>
        <div class="key-stat-box">
          <span class="stat-label" data-i18n="theory.dominant">${i18n.t('theory.dominant')}</span>
          <span class="stat-value highlight-amber">${this.keys[(this.selectedKeyIndex + 1) % 12].major}</span>
        </div>
        <div class="key-stat-box">
          <span class="stat-label" data-i18n="theory.subdominant">${i18n.t('theory.subdominant')}</span>
          <span class="stat-value">${this.keys[(this.selectedKeyIndex + 11) % 12].major}</span>
        </div>
        <div class="key-stat-box">
          <span class="stat-label" data-i18n="theory.baseRootPitch">${i18n.t('theory.baseRootPitch')}</span>
          <span class="stat-value">${TuningSystems.midiToFreq(key.rootMidi).toFixed(1)} Hz</span>
        </div>
      </div>
    `;
  }

  updateLanguage() {
    i18n.applyDomTranslations(this.container);
    this.updateKeyCard();
    this.render();
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    const outerRadius = 210;
    const midRadius = 140;
    const innerRadius = 80;

    // Draw background concentric tracks
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2, true);
    ctx.fill();

    // Slices
    for (let i = 0; i < 12; i++) {
      const startAngle = i * (Math.PI / 6) - Math.PI / 2 - Math.PI / 12;
      const endAngle = startAngle + Math.PI / 6;
      const isSelected = i === this.selectedKeyIndex;

      // Slice background
      ctx.fillStyle = isSelected ? 'rgba(0, 242, 254, 0.18)' : (i % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.15)');
      ctx.beginPath();
      ctx.arc(cx, cy, outerRadius, startAngle, endAngle);
      ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fill();

      // Border lines
      ctx.strokeStyle = isSelected ? '#00f2fe' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();

      const k = this.keys[i];
      const midAngle = k.angle;

      // Major Key label (outer track)
      const rMajor = (outerRadius + midRadius) / 2;
      const mx = cx + rMajor * Math.cos(midAngle);
      const my = cy + rMajor * Math.sin(midAngle);

      ctx.fillStyle = isSelected ? '#00f2fe' : '#f8fafc';
      ctx.font = isSelected ? 'bold 18px sans-serif' : '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(k.major, mx, my - 6);

      // Accidentals count
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      const accText = k.accidentals === 'Natural' ? i18n.t('theory.natural') : k.accidentals;
      ctx.fillText(accText, mx, my + 12);

      // Minor Key label (inner track)
      const rMinor = (midRadius + innerRadius) / 2;
      const minX = cx + rMinor * Math.cos(midAngle);
      const minY = cy + rMinor * Math.sin(midAngle);

      ctx.fillStyle = isSelected ? '#a855f7' : '#cbd5e1';
      ctx.font = isSelected ? 'bold 13px sans-serif' : '12px sans-serif';
      ctx.fillText(k.minor, minX, minY);
    }

    // Mid dividing circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, midRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Center circle
    ctx.fillStyle = '#0a0e17';
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.stroke();

    // Center text
    const selectedKey = this.keys[this.selectedKeyIndex];
    ctx.fillStyle = '#00f2fe';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(selectedKey.major, cx, cy - 10);

    ctx.fillStyle = '#a855f7';
    ctx.font = '13px sans-serif';
    ctx.fillText(selectedKey.minor, cx, cy + 12);
  }
}
