/**
 * EarHeroQuest.js
 * Interval & Chord Mystery Game with Acoustic Wave Clues (Lissajous Curves).
 * Connects ear training to physical wave geometry!
 */

import { TuningSystems } from '../audio/TuningSystems.js';
import { instruments } from '../audio/SynthInstruments.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class EarHeroQuest {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.currentQuestion = null;
    this.showVisualHint = true;
    this.hasAnswered = false;

    this.intervals = [
      { id: 'unison', key: 'intervalUnison', descKey: 'intervalUnisonDesc', name: 'Unison', semitones: 0, ratio: '1:1' },
      { id: 'm2', key: 'intervalM2', descKey: 'intervalM2Desc', name: 'Minor 2nd', semitones: 1, ratio: '16:15' },
      { id: 'maj3', key: 'intervalMaj3', descKey: 'intervalMaj3Desc', name: 'Major 3rd', semitones: 4, ratio: '5:4' },
      { id: 'p4', key: 'intervalP4', descKey: 'intervalP4Desc', name: 'Perfect 4th', semitones: 5, ratio: '4:3' },
      { id: 'tritone', key: 'intervalTritone', descKey: 'intervalTritoneDesc', name: 'Tritone (Dim 5th)', semitones: 6, ratio: '45:32' },
      { id: 'p5', key: 'intervalP5', descKey: 'intervalP5Desc', name: 'Perfect 5th', semitones: 7, ratio: '3:2' },
      { id: 'octave', key: 'intervalOctave', descKey: 'intervalOctaveDesc', name: 'Octave', semitones: 12, ratio: '2:1' }
    ];

    this.initDOM();
    this.initCanvas();
    this.generateNewQuestion();
    this.startAnimationLoop();

    if (typeof i18n.onLanguageChange === 'function') {
      this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
    }
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="lab-grid">
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">👂</span> <span data-i18n="games.earHeroTitle">Ear Hero & Acoustic Wave Matcher</span></h3>
            <span class="badge highlight-cyan" id="questScoreBadge">${i18n.t('app.score')}: 0</span>
          </div>
          <p class="panel-desc" data-i18n="games.earHeroDesc">
            Listen to the mystery interval. If your ear gets stuck, inspect the <strong>Lissajous Figure</strong> below! 
            Pure intervals form clean geometric loops; dissonant intervals tangle into chaotic threads.
          </p>

          <div class="canvas-wrapper flex-center">
            <canvas id="lissajousCanvas" width="400" height="260"></canvas>
          </div>

          <div class="controls-row justify-center align-center">
            <button class="btn btn-primary btn-lg" id="btnPlayMysteryInterval" data-i18n="games.playMysteryInterval">🔊 Play Mystery Interval</button>
            <button class="btn btn-pill" id="btnToggleVisualHint"><span data-i18n="games.toggleWaveClue">${i18n.t('games.toggleWaveClue')}</span>: ${this.showVisualHint ? i18n.t('app.on') : i18n.t('app.off')}</button>
          </div>
        </div>

        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🎯</span> <span data-i18n="games.identifyInterval">Identify the Interval</span></h3>
            <span class="badge" id="streakBadge">${i18n.t('app.streak')}: 0 🔥</span>
          </div>

          <div class="answers-grid" id="answersGrid">
            ${this.intervals.map(i => `
              <button class="btn btn-pill btn-answer" data-id="${i.id}" data-name="${i.name}" data-i18n="games.${i.key}">
                ${i18n.t('games.' + i.key)}
              </button>
            `).join('')}
          </div>

          <div class="quest-feedback-card" id="questFeedback" style="display: none;"></div>

          <div class="controls-row justify-center" style="margin-top: 1.5rem;">
            <button class="btn btn-accent" id="btnNextQuestion" style="display: none;" data-i18n="games.nextInterval">Next Interval ▶</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  initCanvas() {
    this.canvas = document.getElementById('lissajousCanvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    const playBtn = this.container.querySelector('#btnPlayMysteryInterval');
    playBtn.addEventListener('click', () => this.playCurrentInterval());

    const hintBtn = this.container.querySelector('#btnToggleVisualHint');
    hintBtn.addEventListener('click', () => {
      this.showVisualHint = !this.showVisualHint;
      hintBtn.textContent = `Toggle Wave Clue: ${this.showVisualHint ? 'ON' : 'OFF'}`;
      this.renderLissajous(0);
    });

    const nextBtn = this.container.querySelector('#btnNextQuestion');
    nextBtn.addEventListener('click', () => {
      this.generateNewQuestion();
      nextBtn.style.display = 'none';
      this.playCurrentInterval();
    });

    const answerBtns = this.container.querySelectorAll('.btn-answer');
    answerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.hasAnswered) return;
        const chosen = btn.dataset.name;
        this.checkAnswer(chosen, btn);
      });
    });
  }

  generateNewQuestion() {
    this.hasAnswered = false;
    const randomIndex = Math.floor(Math.random() * this.intervals.length);
    this.currentQuestion = this.intervals[randomIndex];

    // Pick random base pitch (C4, D4, E4, F4, G4)
    const baseMidis = [60, 62, 64, 65, 67];
    this.baseMidi = baseMidis[Math.floor(Math.random() * baseMidis.length)];

    // Reset button states
    const btns = this.container.querySelectorAll('.btn-answer');
    btns.forEach(b => {
      b.classList.remove('btn-success', 'btn-danger');
      b.disabled = false;
    });

    const feedback = this.container.querySelector('#questFeedback');
    feedback.style.display = 'none';
  }

  async playCurrentInterval() {
    await instruments.ensureAudio();
    const rootFreq = TuningSystems.midiToFreq(this.baseMidi);
    const targetFreq = TuningSystems.midiToFreq(this.baseMidi + this.currentQuestion.semitones);

    // Play root first, then both together
    instruments.playRhodes(rootFreq, 2.2, null, 0.35);
    setTimeout(() => {
      instruments.playRhodes(targetFreq, 1.8, null, 0.35);
    }, 280);
  }

  checkAnswer(chosenName, clickedBtn) {
    this.hasAnswered = true;
    const isCorrect = chosenName === this.currentQuestion.name;
    const feedback = this.container.querySelector('#questFeedback');
    const nextBtn = this.container.querySelector('#btnNextQuestion');

    const q = this.currentQuestion;
    const intervalLocalized = i18n.t('games.' + q.key);
    const descLocalized = i18n.t('games.' + q.descKey);

    if (isCorrect) {
      this.score += 100;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      clickedBtn.classList.add('btn-success');
      feedback.className = 'quest-feedback-card alert alert-success';
      feedback.innerHTML = `
        <strong>${i18n.t('games.brilliantEar')}</strong> ${i18n.t('games.youIdentified')} <strong>${intervalLocalized}</strong> (${q.ratio}).<br>
        <em>${descLocalized}</em>
      `;
    } else {
      this.streak = 0;
      clickedBtn.classList.add('btn-danger');
      const correctBtn = this.container.querySelector(`.btn-answer[data-id="${q.id}"]`);
      if (correctBtn) correctBtn.classList.add('btn-success');

      feedback.className = 'quest-feedback-card alert alert-warning';
      feedback.innerHTML = `
        <strong>${i18n.t('games.notQuite')}</strong> ${i18n.t('games.youIdentified')} <strong>${intervalLocalized}</strong> (${q.ratio}).<br>
        <em>${descLocalized}</em>
      `;
    }

    this.container.querySelector('#questScoreBadge').textContent = `${i18n.t('app.score')}: ${this.score}`;
    this.container.querySelector('#streakBadge').textContent = `${i18n.t('app.streak')}: ${this.streak} 🔥`;
    feedback.style.display = 'block';
    nextBtn.style.display = 'inline-block';
  }

  updateLanguage() {
    this.container.querySelector('#questScoreBadge').textContent = `${i18n.t('app.score')}: ${this.score}`;
    this.container.querySelector('#streakBadge').textContent = `${i18n.t('app.streak')}: ${this.streak} 🔥`;
    const hintBtn = this.container.querySelector('#btnToggleVisualHint');
    if (hintBtn) {
      hintBtn.innerHTML = `<span data-i18n="games.toggleWaveClue">${i18n.t('games.toggleWaveClue')}</span>: ${this.showVisualHint ? i18n.t('app.on') : i18n.t('app.off')}`;
    }
    const answerBtns = this.container.querySelectorAll('.btn-answer');
    answerBtns.forEach(btn => {
      const id = btn.dataset.id;
      const found = this.intervals.find(i => i.id === id);
      if (found) {
        btn.textContent = i18n.t('games.' + found.key);
      }
    });

    if (this.hasAnswered && this.currentQuestion) {
      const q = this.currentQuestion;
      const feedback = this.container.querySelector('#questFeedback');
      if (feedback && feedback.style.display !== 'none') {
        const isSuccess = feedback.classList.contains('alert-success');
        const leadText = isSuccess ? i18n.t('games.brilliantEar') : i18n.t('games.notQuite');
        feedback.innerHTML = `
          <strong>${leadText}</strong> ${i18n.t('games.youIdentified')} <strong>${i18n.t('games.' + q.key)}</strong> (${q.ratio}).<br>
          <em>${i18n.t('games.' + q.descKey)}</em>
        `;
      }
    }

    i18n.applyDomTranslations(this.container);
  }

  startAnimationLoop() {
    let t = 0;
    const loop = () => {
      t += 0.035;
      this.renderLissajous(t);
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  renderLissajous(time) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    if (!this.showVisualHint) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Wave Clue Hidden (Audio Only Mode)', cx, cy);
      return;
    }

    if (!this.currentQuestion) return;

    // Lissajous equations:
    // x(t) = A * sin( a * t + delta )
    // y(t) = B * sin( b * t )
    // Ratio of frequencies = 2^(semitones / 12)
    const ratio = Math.pow(2, this.currentQuestion.semitones / 12);
    const a = 1.0;
    const b = ratio;

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00f2fe';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 8;
    ctx.beginPath();

    const points = 350;
    const radius = 95;

    for (let i = 0; i <= points; i++) {
      const theta = (i / points) * Math.PI * 12;
      const x = cx + radius * Math.sin(a * theta + time);
      const y = cy + radius * Math.sin(b * theta);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
    ctx.shadowBlur = 0;

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Lissajous Wave Interference: X = sin(f₁t), Y = sin(f₂t)', 12, 20);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
