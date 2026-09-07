/**
 * PolyrhythmTap.js
 * Polyrhythm Tap Hero: A two-handed rhythm coordination mini-game.
 * Left hand (Key 'A') vs Right hand (Key 'L') with real-time accuracy scoring.
 */

import { instruments } from '../audio/SynthInstruments.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { i18n } from '../i18n/i18n.js';

export class PolyrhythmTap {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.r1 = 3; // Left Hand (Track 1)
    this.r2 = 2; // Right Hand (Track 2)
    this.bpm = 72;
    this.isPlaying = false;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.judgmentText = '';
    this.judgmentClass = '';

    this.track1Beats = [];
    this.track2Beats = [];
    this.cycleStartTime = 0;
    this.cycleDuration = (60 / this.bpm) * 2; // 2 measures

    this.initDOM();
    this.initCanvas();
    this.bindEvents();
    this.render();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="lab-grid">
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🎮</span> <span data-i18n="games.tapTitle">Polyrhythm Tap Hero</span></h3>
            <span class="badge" id="tapRatioBadge" data-i18n="${this.r1 === 3 ? 'games.tapRatio32' : 'games.tapRatio43'}">${i18n.t(this.r1 === 3 ? 'games.tapRatio32' : 'games.tapRatio43')}</span>
          </div>
          <p class="panel-desc" data-i18n="games.tapDesc">
            Test your brain's rhythmic independence! Tap <strong>Left Hand (Key 'A')</strong> and 
            <strong>Right Hand (Key 'L')</strong> precisely when the descending beat orbs cross the judgment line.
          </p>

          <div class="canvas-wrapper flex-center">
            <canvas id="tapCanvas" width="560" height="300"></canvas>
          </div>

          <div class="dual-tap-pads">
            <button class="tap-pad pad-left" id="padLeft">
              <span class="pad-key">A</span>
              <span class="pad-label"><span data-i18n="games.leftTrack">Left Track</span> (${this.r1})</span>
            </button>
            <button class="tap-pad pad-right" id="padRight">
              <span class="pad-key">L</span>
              <span class="pad-label"><span data-i18n="games.rightTrack">Right Track</span> (${this.r2})</span>
            </button>
          </div>

          <div class="controls-row justify-center">
            <button class="btn btn-primary btn-lg" id="btnStartGame" data-i18n="games.startGame">▶ Start Game</button>
            <div class="tempo-control inline-flex align-center">
              <label><span data-i18n="games.speed">Speed</span>: <span id="gameBpmVal" class="mono-value">72 BPM</span></label>
              <input type="range" id="gameBpmSlider" min="50" max="110" step="2" value="72">
            </div>
          </div>
        </div>

        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🏆</span> <span data-i18n="games.performanceTitle">Performance & Combo</span></h3>
            <span class="badge highlight-amber" id="scoreDisplay">0 ${i18n.t('app.pts')}</span>
          </div>

          <div class="game-stats-box">
            <div class="stat-card">
              <span class="stat-label" data-i18n="games.currentCombo">Current Combo</span>
              <span class="stat-value highlight-cyan" id="comboDisplay">0x</span>
            </div>
            <div class="stat-card">
              <span class="stat-label" data-i18n="games.maxCombo">Max Combo</span>
              <span class="stat-value highlight-violet" id="maxComboDisplay">0x</span>
            </div>
          </div>

          <div class="judgment-banner" id="judgmentBanner">
            <span id="judgmentLabel" class="judgment-text" data-i18n="games.pressStart">PRESS START</span>
          </div>

          <div class="rhythm-mode-select" style="margin-top: 1.5rem;">
            <h4 data-i18n="games.difficulty">Difficulty Level:</h4>
            <div class="controls-row">
              <button class="btn btn-pill active" data-r1="3" data-r2="2" data-i18n="games.normal32">Normal: 3 against 2</button>
              <button class="btn btn-pill" data-r1="4" data-r2="3" data-i18n="games.hard43">Hard: 4 against 3</button>
            </div>
          </div>
        </div>
      </div>
    `;

    if (typeof i18n.onLanguageChange === 'function') {
      this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
    }
  }

  initCanvas() {
    this.canvas = document.getElementById('tapCanvas');
    this.ctx = this.canvas.getContext('2d');
  }

  bindEvents() {
    const startBtn = this.container.querySelector('#btnStartGame');
    startBtn.addEventListener('click', async () => {
      await audioEngine.init();
      if (this.isPlaying) {
        this.stop();
        startBtn.textContent = i18n.t('games.startGame');
        startBtn.setAttribute('data-i18n', 'games.startGame');
        startBtn.classList.remove('btn-danger');
        startBtn.classList.add('btn-primary');
      } else {
        this.start();
        startBtn.textContent = i18n.t('games.stopGame');
        startBtn.setAttribute('data-i18n', 'games.stopGame');
        startBtn.classList.remove('btn-primary');
        startBtn.classList.add('btn-danger');
      }
    });

    const bpmSlider = this.container.querySelector('#gameBpmSlider');
    const bpmVal = this.container.querySelector('#gameBpmVal');
    bpmSlider.addEventListener('input', (e) => {
      this.bpm = parseInt(e.target.value, 10);
      bpmVal.textContent = `${this.bpm} BPM`;
      this.cycleDuration = (60 / this.bpm) * 2;
    });

    const diffBtns = this.container.querySelectorAll('.rhythm-mode-select button');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.r1 = parseInt(btn.dataset.r1, 10);
        this.r2 = parseInt(btn.dataset.r2, 10);
        const ratioKey = this.r1 === 3 ? 'games.tapRatio32' : 'games.tapRatio43';
        const badge = this.container.querySelector('#tapRatioBadge');
        badge.textContent = i18n.t(ratioKey);
        badge.setAttribute('data-i18n', ratioKey);
        this.container.querySelector('#padLeft .pad-label').innerHTML = `<span data-i18n="games.leftTrack">${i18n.t('games.leftTrack')}</span> (${this.r1})`;
        this.container.querySelector('#padRight .pad-label').innerHTML = `<span data-i18n="games.rightTrack">${i18n.t('games.rightTrack')}</span> (${this.r2})`;
        this.render();
      });
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (!this.isPlaying) return;
      if (e.key === 'a' || e.key === 'A') {
        this.handleTap(1);
        this.flashPad('#padLeft');
      } else if (e.key === 'l' || e.key === 'L') {
        this.handleTap(2);
        this.flashPad('#padRight');
      }
    });

    // On-screen touch pads
    const pLeft = this.container.querySelector('#padLeft');
    const pRight = this.container.querySelector('#padRight');
    pLeft.addEventListener('mousedown', () => {
      if (this.isPlaying) this.handleTap(1);
      this.flashPad('#padLeft');
    });
    pRight.addEventListener('mousedown', () => {
      if (this.isPlaying) this.handleTap(2);
      this.flashPad('#padRight');
    });
  }

  flashPad(selector) {
    const pad = this.container.querySelector(selector);
    if (!pad) return;
    pad.classList.add('hit');
    setTimeout(() => pad.classList.remove('hit'), 120);
  }

  start() {
    this.isPlaying = true;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.cycleStartTime = performance.now() / 1000;
    this.track1Beats = [];
    this.track2Beats = [];
    this.updateStatsUI();
    this.gameLoop();
  }

  stop() {
    this.isPlaying = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.render();
  }

  handleTap(trackNum) {
    const now = performance.now() / 1000;
    const elapsed = (now - this.cycleStartTime) % this.cycleDuration;
    const progress = elapsed / this.cycleDuration; // 0..1

    const r = trackNum === 1 ? this.r1 : this.r2;

    // Find closest target beat time
    let minDiff = 999;
    for (let i = 0; i < r; i++) {
      const targetProg = i / r;
      let diff = Math.abs(progress - targetProg);
      // Handle wrap around
      if (diff > 0.5) diff = 1 - diff;
      const diffSec = diff * this.cycleDuration;
      if (diffSec < minDiff) minDiff = diffSec;
    }

    // Play feedback tone
    if (trackNum === 1) instruments.playDrum('woodblock', null, 0.9);
    else instruments.playDrum('clave', null, 0.9);

    // Judgment timing window
    if (minDiff <= 0.055) {
      // Perfect (within 55ms)
      this.score += 100 + this.combo * 10;
      this.combo++;
      this.setJudgment(i18n.t('games.perfect'), 'text-success');
    } else if (minDiff <= 0.12) {
      // Good (within 120ms)
      this.score += 50;
      this.combo++;
      this.setJudgment(i18n.t('games.good'), 'text-warning');
    } else {
      // Miss
      this.combo = 0;
      this.setJudgment(i18n.t('games.offBeat'), 'text-danger');
    }

    if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.updateStatsUI();
  }

  setJudgment(text, className) {
    const banner = this.container.querySelector('#judgmentLabel');
    banner.textContent = text;
    banner.className = `judgment-text ${className}`;
  }

  updateStatsUI() {
    this.container.querySelector('#scoreDisplay').textContent = `${this.score} ${i18n.t('app.pts')}`;
    this.container.querySelector('#comboDisplay').textContent = `${this.combo}x`;
    this.container.querySelector('#maxComboDisplay').textContent = `${this.maxCombo}x`;
  }

  updateLanguage() {
    const ratioKey = this.r1 === 3 ? 'games.tapRatio32' : 'games.tapRatio43';
    const badge = this.container.querySelector('#tapRatioBadge');
    if (badge) {
      badge.textContent = i18n.t(ratioKey);
      badge.setAttribute('data-i18n', ratioKey);
    }
    const pLeft = this.container.querySelector('#padLeft .pad-label');
    if (pLeft) pLeft.innerHTML = `<span data-i18n="games.leftTrack">${i18n.t('games.leftTrack')}</span> (${this.r1})`;
    const pRight = this.container.querySelector('#padRight .pad-label');
    if (pRight) pRight.innerHTML = `<span data-i18n="games.rightTrack">${i18n.t('games.rightTrack')}</span> (${this.r2})`;

    const startBtn = this.container.querySelector('#btnStartGame');
    if (startBtn) {
      const key = this.isPlaying ? 'games.stopGame' : 'games.startGame';
      startBtn.textContent = i18n.t(key);
      startBtn.setAttribute('data-i18n', key);
    }

    const judgment = this.container.querySelector('#judgmentLabel');
    if (judgment && !this.isPlaying) {
      judgment.textContent = i18n.t('games.pressStart');
    }

    this.updateStatsUI();
    i18n.applyDomTranslations(this.container);
  }

  gameLoop() {
    if (!this.isPlaying) return;
    this.render();
    this.animId = requestAnimationFrame(() => this.gameLoop());
  }

  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    const laneWidth = 140;
    const lane1X = width / 2 - laneWidth;
    const lane2X = width / 2 + 10;
    const judgmentY = height - 45;

    // Draw Lanes
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(lane1X, 20, laneWidth - 10, height - 40);
    ctx.fillRect(lane2X, 20, laneWidth - 10, height - 40);

    // Judgment Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lane1X - 10, judgmentY);
    ctx.lineTo(lane2X + laneWidth, judgmentY);
    ctx.stroke();

    // Judgment line label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('TARGET LINE', lane1X - 8, judgmentY - 6);

    const now = performance.now() / 1000;
    const elapsed = this.isPlaying ? ((now - this.cycleStartTime) % this.cycleDuration) : 0;
    const progress = elapsed / this.cycleDuration;

    // Draw descending beats for Track 1 (Left, r1)
    const drawTrackBeats = (r, laneX, color) => {
      for (let i = 0; i < r; i++) {
        const beatProg = i / r;
        let delta = beatProg - progress;
        if (delta < -0.1) delta += 1.0; // Wrap around for approaching beats

        const y = 30 + (1 - delta) * (judgmentY - 30);
        if (y >= 20 && y <= height - 10) {
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(laneX + (laneWidth - 10) / 2, y, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    };

    drawTrackBeats(this.r1, lane1X, '#00f2fe');
    drawTrackBeats(this.r2, lane2X, '#f59e0b');
  }

  destroy() {
    this.stop();
  }
}
