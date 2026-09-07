/**
 * AdsrLab.js
 * Attack, Decay, Sustain, Release (ADSR) Envelope Sculptor and
 * the Famous "Blind Instrument" Psychoacoustic Experiment.
 */

import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class AdsrLab {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.attack = 0.05;  // seconds
    this.decay = 0.2;    // seconds
    this.sustain = 0.6;  // level 0..1
    this.release = 0.4;  // seconds

    // Blind experiment state
    this.mysteryInstrument = 'violin'; // 'violin' or 'trumpet'
    this.stripTransient = true;
    this.hasGuessed = false;

    this.initDOM();
    this.initCanvas();
    this.renderEnvelope();

    this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="lab-grid">
        <!-- ADSR Sculptor -->
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">📈</span> <span data-i18n="timbre.adsrTitle">ADSR Envelope Sculptor</span></h3>
            <span class="badge" data-i18n="timbre.adsrBadge">Dynamic Envelopes</span>
          </div>
          <p class="panel-desc" data-i18n="timbre.adsrDesc">
            Sound is not static—it evolves over time through four stages: 
            <strong>Attack</strong> (initial rise), <strong>Decay</strong> (settling), <strong>Sustain</strong> (held body), and <strong>Release</strong> (fade out).
          </p>

          <div class="canvas-wrapper flex-center">
            <canvas id="adsrCanvas" width="560" height="200"></canvas>
          </div>

          <div class="slider-controls">
            <div class="slider-group">
              <label><span data-i18n="timbre.attack">Attack</span>: <span id="valAttack" class="mono-value">0.05s</span></label>
              <input type="range" id="sliderAttack" min="0.005" max="1.5" step="0.01" value="0.05">
            </div>
            <div class="slider-group">
              <label><span data-i18n="timbre.decay">Decay</span>: <span id="valDecay" class="mono-value">0.20s</span></label>
              <input type="range" id="sliderDecay" min="0.01" max="1.5" step="0.01" value="0.2">
            </div>
            <div class="slider-group">
              <label><span data-i18n="timbre.sustain">Sustain Level</span>: <span id="valSustain" class="mono-value">60%</span></label>
              <input type="range" id="sliderSustain" min="0" max="1" step="0.05" value="0.6">
            </div>
            <div class="slider-group">
              <label><span data-i18n="timbre.release">Release</span>: <span id="valRelease" class="mono-value">0.40s</span></label>
              <input type="range" id="sliderRelease" min="0.02" max="2.5" step="0.02" value="0.4">
            </div>
          </div>

          <div class="controls-row justify-center">
            <button class="btn btn-primary" id="btnTestAdsrSound" data-i18n="timbre.triggerEnvelope">🔊 Trigger Envelope Note</button>
          </div>
        </div>

        <!-- Blind Instrument Psychoacoustic Challenge -->
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🎭</span> <span data-i18n="timbre.blindTitle">The "Blind Instrument" Experiment</span></h3>
            <span class="badge" data-i18n="timbre.blindBadge">Psychoacoustic Trick</span>
          </div>
          <p class="panel-desc" data-i18n="timbre.blindDesc">
            Can your ear tell a <strong>Violin</strong> from a <strong>Trumpet</strong> if the first 50 milliseconds of attack noise are stripped away?
            Acoustic research shows that our brains rely almost entirely on the initial transient click/scrape to distinguish acoustic instruments!
          </p>

          <div class="experiment-box">
            <div class="experiment-controls">
              <label class="toggle-container">
                <input type="checkbox" id="chkStripTransient" checked>
                <span class="toggle-slider"></span>
                <span class="toggle-label" data-i18n="timbre.stripTransient">Strip Attack Transient (First 50ms)</span>
              </label>

              <button class="btn btn-accent" id="btnPlayMysteryNote" data-i18n="timbre.playMysteryNote">🔊 Play Mystery Note (A4 440 Hz)</button>
            </div>

            <div class="quiz-options" id="quizOptions">
              <button class="btn btn-pill" data-guess="violin" data-i18n="timbre.guessViolin">🎻 It's a Violin!</button>
              <button class="btn btn-pill" data-guess="trumpet" data-i18n="timbre.guessTrumpet">🎺 It's a Trumpet!</button>
            </div>

            <div class="alert" id="quizFeedback" style="display: none;"></div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  initCanvas() {
    this.canvas = document.getElementById('adsrCanvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    const sA = this.container.querySelector('#sliderAttack');
    const sD = this.container.querySelector('#sliderDecay');
    const sS = this.container.querySelector('#sliderSustain');
    const sR = this.container.querySelector('#sliderRelease');

    const vA = this.container.querySelector('#valAttack');
    const vD = this.container.querySelector('#valDecay');
    const vS = this.container.querySelector('#valSustain');
    const vR = this.container.querySelector('#valRelease');

    const updateADSR = () => {
      this.attack = parseFloat(sA.value);
      this.decay = parseFloat(sD.value);
      this.sustain = parseFloat(sS.value);
      this.release = parseFloat(sR.value);

      vA.textContent = `${this.attack.toFixed(2)}s`;
      vD.textContent = `${this.decay.toFixed(2)}s`;
      vS.textContent = `${Math.round(this.sustain * 100)}%`;
      vR.textContent = `${this.release.toFixed(2)}s`;

      this.renderEnvelope();
    };

    sA.addEventListener('input', updateADSR);
    sD.addEventListener('input', updateADSR);
    sS.addEventListener('input', updateADSR);
    sR.addEventListener('input', updateADSR);

    const testBtn = this.container.querySelector('#btnTestAdsrSound');
    testBtn.addEventListener('click', () => this.playAdsrTone());

    // Blind experiment
    const chk = this.container.querySelector('#chkStripTransient');
    chk.addEventListener('change', (e) => {
      this.stripTransient = e.target.checked;
    });

    const mysteryBtn = this.container.querySelector('#btnPlayMysteryNote');
    mysteryBtn.addEventListener('click', () => this.playMysteryTone());

    const guessBtns = this.container.querySelectorAll('#quizOptions button');
    guessBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const guess = btn.dataset.guess;
        this.evaluateGuess(guess);
      });
    });
  }

  async playAdsrTone() {
    await audioEngine.init();
    const t = audioEngine.currentTime;
    const osc = audioEngine.ctx.createOscillator();
    const gain = audioEngine.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(329.63, t); // E4

    const filter = audioEngine.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, t);

    const holdTime = 0.6; // note hold duration before release

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.15, t + this.attack);
    gain.gain.linearRampToValueAtTime(0.15 * this.sustain, t + this.attack + this.decay);
    gain.gain.setValueAtTime(0.15 * this.sustain, t + this.attack + this.decay + holdTime);
    gain.gain.linearRampToValueAtTime(0.0001, t + this.attack + this.decay + holdTime + this.release);

    osc.connect(filter);
    filter.connect(gain);
    audioEngine.connect(gain);

    osc.start(t);
    osc.stop(t + this.attack + this.decay + holdTime + this.release + 0.05);
  }

  async playMysteryTone() {
    await audioEngine.init();
    // Randomize instrument if not already picked
    this.mysteryInstrument = Math.random() > 0.5 ? 'violin' : 'trumpet';

    const t = audioEngine.currentTime;
    const freq = 440.0; // A4

    const osc = audioEngine.ctx.createOscillator();
    const filter = audioEngine.ctx.createBiquadFilter();
    const gain = audioEngine.ctx.createGain();

    osc.frequency.setValueAtTime(freq, t);

    if (this.mysteryInstrument === 'violin') {
      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, t);
      filter.Q.setValueAtTime(0.8, t);
    } else {
      // Trumpet
      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, t);
      filter.Q.setValueAtTime(1.0, t);
    }

    if (this.stripTransient) {
      // Remove transient: very soft gradual ramp-in so attack burst is absent
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.15); // soft ramp ignores the 50ms transient
      gain.gain.setValueAtTime(0.14, t + 1.2);
      gain.gain.linearRampToValueAtTime(0.0001, t + 1.6);
    } else {
      // Full natural onset
      if (this.mysteryInstrument === 'violin') {
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.08);
      } else {
        // Trumpet burst
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      }
      gain.gain.setValueAtTime(0.14, t + 1.2);
      gain.gain.linearRampToValueAtTime(0.0001, t + 1.6);
    }

    osc.connect(filter);
    filter.connect(gain);
    audioEngine.connect(gain);

    osc.start(t);
    osc.stop(t + 1.7);
  }

  evaluateGuess(guess) {
    const feedback = this.container.querySelector('#quizFeedback');
    feedback.style.display = 'block';

    const isCorrect = guess === this.mysteryInstrument;
    const instName = this.mysteryInstrument === 'violin' ? i18n.t('timbre.instViolin') : i18n.t('timbre.instTrumpet');

    if (this.stripTransient) {
      feedback.className = isCorrect ? 'alert alert-success' : 'alert alert-warning';
      const title = isCorrect ? i18n.t('timbre.luckyGuess') : i18n.t('timbre.fooled');
      feedback.innerHTML = `
        <strong>${title}</strong> ${i18n.t('timbre.itWasActually')} <strong>${instName}</strong>!<br>
        ${i18n.t('timbre.blindTransientExpl')}
      `;
    } else {
      feedback.className = isCorrect ? 'alert alert-success' : 'alert alert-danger';
      const title = isCorrect ? i18n.t('timbre.correct') : i18n.t('timbre.missed');
      feedback.innerHTML = `
        <strong>${title}</strong> ${i18n.t('timbre.itWasActually')} <strong>${instName}</strong>.<br>
        ${i18n.t('timbre.fullTransientExpl')}
      `;
    }
  }

  updateLanguage() {
    i18n.applyDomTranslations(this.container);
    this.renderEnvelope();
  }

  renderEnvelope() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const padX = 40;
    const padY = 30;
    const w = width - padX * 2;
    const h = height - padY * 2;

    ctx.clearRect(0, 0, width, height);

    // Total normalized width mapped across Attack, Decay, Sustain (hold), Release
    const totalDuration = this.attack + this.decay + 0.8 + this.release;
    const scaleX = w / totalDuration;

    const x0 = padX;
    const y0 = height - padY;

    const xA = x0 + this.attack * scaleX;
    const yA = padY; // peak (1.0)

    const xD = xA + this.decay * scaleX;
    const yD = padY + (1 - this.sustain) * h;

    const xS = xD + 0.8 * scaleX; // Sustain hold segment
    const yS = yD;

    const xR = xS + this.release * scaleX;
    const yR = y0;

    // Draw baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, y0);
    ctx.lineTo(width - padX, y0);
    ctx.stroke();

    // Fill under envelope
    ctx.fillStyle = 'rgba(0, 242, 254, 0.1)';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(xA, yA);
    ctx.lineTo(xD, yD);
    ctx.lineTo(xS, yS);
    ctx.lineTo(xR, yR);
    ctx.closePath();
    ctx.fill();

    // Stroke envelope
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(xA, yA);
    ctx.lineTo(xD, yD);
    ctx.lineTo(xS, yS);
    ctx.lineTo(xR, yR);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw stage labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';

    ctx.fillText(i18n.t('timbre.attack'), (x0 + xA) / 2, y0 + 18);
    ctx.fillText(i18n.t('timbre.decay'), (xA + xD) / 2, y0 + 18);
    ctx.fillText(i18n.t('timbre.sustain'), (xD + xS) / 2, y0 + 18);
    ctx.fillText(i18n.t('timbre.release'), (xS + xR) / 2, y0 + 18);

    // Nodes
    [ [x0, y0], [xA, yA], [xD, yD], [xS, yS], [xR, yR] ].forEach(([nx, ny]) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(nx, ny, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  destroy() {
    if (this.unsubscribeI18n) this.unsubscribeI18n();
  }
}
