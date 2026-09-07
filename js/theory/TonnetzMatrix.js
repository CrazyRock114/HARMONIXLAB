/**
 * TonnetzMatrix.js
 * Euler's Tone Lattice (Tonnetz) & Neo-Riemannian Chord Transformations.
 * Interactive 2D geometric network where triads form triangles and harmonic operations flip them.
 */

import { TuningSystems } from '../audio/TuningSystems.js';
import { instruments } from '../audio/SynthInstruments.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class TonnetzMatrix {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    // Pitch Class Lattice Coordinates
    this.rows = 5;
    this.cols = 7;
    this.currentNode = { r: 2, c: 3 }; // Center C
    this.currentChord = 'C';
    this.currentChordType = 'maj'; // 'maj' or 'min'

    // Active triad: e.g. C Major [60, 64, 67]
    this.activeChord = { root: 60, type: 'major', notes: [60, 64, 67], name: 'C Major' };

    this.initDOM();
    this.initCanvas();
    this.render();
    this.updateInfo();
    this.bindEvents();

    this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="lab-grid">
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🕸️</span> <span data-i18n="theory.tonnetzTitle">Euler's Tonnetz (Harmonic Lattice)</span></h3>
            <span class="badge" data-i18n="theory.tonnetzBadge">Neo-Riemannian Geometry</span>
          </div>
          <p class="panel-desc" data-i18n="theory.tonnetzDesc">
            Leonhard Euler (1739) mapped harmony into a 2D geometric web: <strong>Horizontal</strong> = Perfect 5ths, 
            <strong>Diagonal Up</strong> = Major 3rds, <strong>Diagonal Down</strong> = Minor 3rds. 
            Every <strong>triangle</strong> is a complete chord!
          </p>

          <div class="canvas-wrapper flex-center">
            <canvas id="tonnetzCanvas" width="560" height="340"></canvas>
          </div>

          <div class="controls-row justify-center transform-buttons">
            <button class="btn btn-pill active" id="btnTransformP" data-i18n="theory.transformP"><strong>P</strong> (Parallel: C ↔ Cm)</button>
            <button class="btn btn-pill" id="btnTransformR" data-i18n="theory.transformR"><strong>R</strong> (Relative: C ↔ Am)</button>
            <button class="btn btn-pill" id="btnTransformL" data-i18n="theory.transformL"><strong>L</strong> (Leading-Tone: C ↔ Em)</button>
            <button class="btn btn-accent" id="btnPlayTonnetzChord" data-i18n="theory.playChordBtn">🔊 Play Chord</button>
          </div>
        </div>

        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">📐</span> <span data-i18n="theory.voiceLeadingTitle">Voice Leading Geometry</span></h3>
            <span class="badge highlight-cyan" id="chordBadge">C Major</span>
          </div>

          <div class="tonnetz-info-card" id="tonnetzInfoCard">
            <div class="current-notes-display">
              <span data-i18n="theory.pitches">Pitches:</span> <strong id="currentChordNotes" class="highlight-cyan">C4 (261.6 Hz) • E4 (329.6 Hz) • G4 (392.0 Hz)</strong>
            </div>
            <p id="transformExplanation" class="panel-desc" style="margin-top: 1rem;">
              <strong data-i18n="theory.triangleShape">Triangle Shape:</strong> <span data-i18n="theory.tonnetzVoiceExpl">Upward-pointing triangles form Major Triads; downward-pointing triangles form Minor Triads. Notice how moving between related chords only moves a single vertex by a semitone (parsimonious voice leading)!</span>
            </p>
          </div>

          <div class="film-scoring-box">
            <h4 data-i18n="theory.filmScoringTitle">🎬 Hollywood & Sci-Fi Harmonic Secret:</h4>
            <p data-i18n="theory.filmScoringDesc">
              Film composers (John Williams, Hans Zimmer in <em>Interstellar</em>) use Tonnetz moves like 
              <strong>Chromatic Mediant Shifts</strong> (e.g. C Major to E Major via two quick flips) to create sudden, spine-tingling wonder without traditional cadences!
            </p>
          </div>
        </div>
      </div>
    `;
  }

  initCanvas() {
    this.canvas = document.getElementById('tonnetzCanvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    const btnP = this.container.querySelector('#btnTransformP');
    const btnR = this.container.querySelector('#btnTransformR');
    const btnL = this.container.querySelector('#btnTransformL');
    const btnPlay = this.container.querySelector('#btnPlayTonnetzChord');

    btnP.addEventListener('click', () => this.applyTransformation('P'));
    btnR.addEventListener('click', () => this.applyTransformation('R'));
    btnL.addEventListener('click', () => this.applyTransformation('L'));
    btnPlay.addEventListener('click', () => this.playCurrentChord());

    // Click canvas to select nearby chord
    this.canvas.addEventListener('click', (e) => {
      this.playCurrentChord();
    });
  }

  applyTransformation(type) {
    const { root, type: chordType } = this.activeChord;
    const isMajor = chordType === 'major';

    if (type === 'P') {
      // Parallel: C Maj (C E G) <-> C Min (C Eb G)
      this.activeChord = {
        root,
        type: isMajor ? 'minor' : 'major',
        notes: isMajor ? [root, root + 3, root + 7] : [root, root + 4, root + 7],
        name: isMajor ? `${TuningSystems.NOTE_NAMES[root % 12]} Minor` : `${TuningSystems.NOTE_NAMES[root % 12]} Major`
      };
    } else if (type === 'R') {
      // Relative: C Maj (C E G) <-> A Min (A C E)
      const newRoot = isMajor ? root - 3 : root + 3;
      const newType = isMajor ? 'minor' : 'major';
      this.activeChord = {
        root: newRoot,
        type: newType,
        notes: newType === 'major' ? [newRoot, newRoot + 4, newRoot + 7] : [newRoot, newRoot + 3, newRoot + 7],
        name: `${TuningSystems.NOTE_NAMES[(newRoot + 12) % 12]} ${newType === 'major' ? 'Major' : 'Minor'}`
      };
    } else if (type === 'L') {
      // Leading-Tone Exchange: C Maj (C E G) <-> E Min (E G B)
      const newRoot = isMajor ? root + 4 : root - 4;
      const newType = isMajor ? 'minor' : 'major';
      this.activeChord = {
        root: newRoot,
        type: newType,
        notes: newType === 'major' ? [newRoot, newRoot + 4, newRoot + 7] : [newRoot, newRoot + 3, newRoot + 7],
        name: `${TuningSystems.NOTE_NAMES[(newRoot + 12) % 12]} ${newType === 'major' ? 'Major' : 'Minor'}`
      };
    }

    this.updateInfo();
    this.render();
    this.playCurrentChord();
  }

  updateInfo() {
    const rootName = TuningSystems.NOTE_NAMES[(this.activeChord.root + 12) % 12];
    const typeLabel = this.activeChord.type === 'major' ? i18n.t('theory.chordMajor') : i18n.t('theory.chordMinor');
    this.container.querySelector('#chordBadge').textContent = `${rootName} ${typeLabel}`;
    const noteNames = this.activeChord.notes.map(m => {
      const name = TuningSystems.midiToNoteName(m);
      const freq = TuningSystems.midiToFreq(m).toFixed(1);
      return `${name} (${freq} Hz)`;
    }).join(' • ');
    this.container.querySelector('#currentChordNotes').textContent = noteNames;
  }

  updateLanguage() {
    i18n.applyDomTranslations(this.container);
    this.updateInfo();
  }

  async playCurrentChord() {
    await instruments.ensureAudio();
    this.activeChord.notes.forEach(m => {
      const freq = TuningSystems.midiToFreq(m);
      instruments.playRhodes(freq, 2.0, null, 0.32);
    });
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Lattice grid configuration
    const cols = 7;
    const rows = 5;
    const spacingX = width / (cols + 1);
    const spacingY = height / (rows + 1);

    // Node coordinates map: row, col -> pitch
    // Horizontal step = +7 semitones (5th)
    // Diagonal step = +4 semitones (Maj 3rd)
    const baseMidi = 48; // C3
    const nodes = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Stagger every other row
        const offsetX = (r % 2) * (spacingX / 2);
        const x = (c + 1) * spacingX + offsetX - (spacingX / 4);
        const y = (r + 1) * spacingY;

        const midi = (baseMidi + c * 7 + r * 4) % 12;
        nodes.push({ x, y, r, c, midi });
      }
    }

    // Draw connection lines (triangles)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
        // Connect if adjacent
        if (dist < spacingX * 1.25) {
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.stroke();
        }
      }
    }

    // Active chord pitch classes (mod 12)
    const activePitchClasses = new Set(this.activeChord.notes.map(m => m % 12));

    // Highlight active chord triangles
    const activeNodes = nodes.filter(n => activePitchClasses.has(n.midi));
    if (activeNodes.length >= 3) {
      // Find a tight triangle
      for (let i = 0; i < activeNodes.length; i++) {
        for (let j = i + 1; j < activeNodes.length; j++) {
          for (let k = j + 1; k < activeNodes.length; k++) {
            const a = activeNodes[i], b = activeNodes[j], c = activeNodes[k];
            const d1 = Math.hypot(a.x - b.x, a.y - b.y);
            const d2 = Math.hypot(b.x - c.x, b.y - c.y);
            const d3 = Math.hypot(c.x - a.x, c.y - a.y);
            if (d1 < spacingX * 1.3 && d2 < spacingX * 1.3 && d3 < spacingX * 1.3) {
              // Fill triangle
              ctx.fillStyle = this.activeChord.type === 'major' ? 'rgba(0, 242, 254, 0.25)' : 'rgba(168, 85, 247, 0.25)';
              ctx.strokeStyle = this.activeChord.type === 'major' ? '#00f2fe' : '#a855f7';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.lineTo(c.x, c.y);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            }
          }
        }
      }
    }

    // Draw Nodes
    nodes.forEach(n => {
      const isActive = activePitchClasses.has(n.midi);

      ctx.fillStyle = isActive ? '#00f2fe' : '#1e293b';
      ctx.shadowColor = isActive ? '#00f2fe' : 'transparent';
      ctx.shadowBlur = isActive ? 12 : 0;
      ctx.beginPath();
      ctx.arc(n.x, n.y, isActive ? 14 : 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Note text
      ctx.fillStyle = isActive ? '#0a0e17' : '#e2e8f0';
      ctx.font = isActive ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(TuningSystems.NOTE_NAMES[n.midi], n.x, n.y);
    });
  }
}
