/**
 * PolyrhythmTap.js
 * Polyrhythm Tap Hero: An arcade-style rhythm coordination game.
 * Features:
 * - Unified single-panel arcade cabinet console with integrated HUD
 * - Automatic sequential stage progression:
 *   1A: Right Hand Solo (8 hits) -> 1B: Left Hand Solo (8 hits) ->
 *   2: Dual Hands Coordination (16 hits) -> 3: Ghost Pulse (16 hits) ->
 *   4: Speed Hyperdrive (Dynamic accelerando survival) -> Victory
 * - Particle explosion FX on PERFECT, screen shake & red flash on MISS
 * - Floating judgment popups & celebratory stage transition splashes
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
    this.baseBpm = 72;
    this.bpm = 72;
    this.isPlaying = false;
    this.isVictory = false;

    // Performance Stats
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalHits = 0;
    this.totalPerfects = 0;
    this.totalGoods = 0;
    this.totalMisses = 0;

    // Sequential Progression State
    // 1: Stage 1A (Right hand), 2: Stage 1B (Left hand), 3: Stage 2 (Both hands), 4: Stage 3 (Ghost), 5: Stage 4 (Speed)
    this.stageIndex = 1;
    this.stageHitsCurrent = 0;
    this.stageHitsNeeded = 8;
    this.lastCycleIndex = -1;

    // FX & Animation Engines
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.redFlashAlpha = 0;

    // Banner Announcement
    this.stageBannerText = '';
    this.stageBannerSub = '';
    this.stageBannerTimer = 0;

    this.cycleStartTime = 0;
    this.cycleDuration = (60 / this.bpm) * 2;

    this.initDOM();
    this.initCanvas();
    this.bindEvents();
    this.updateStatsUI();
    this.updatePadsState();
    this.render();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="arcade-cabinet panel glass-panel">
        <!-- Arcade Header & Ratio Selector -->
        <div class="panel-header" style="padding-bottom: 0.5rem;">
          <div>
            <h3 style="margin-bottom: 0.2rem;"><span class="icon">🎮</span> <span data-i18n="games.tapTitle">${i18n.t('games.tapTitle')}</span></h3>
            <span class="panel-desc" style="font-size: 0.8rem; margin: 0;" data-i18n="games.tapDesc">${i18n.t('games.tapDesc')}</span>
          </div>
          <div class="inline-flex gap-sm align-center">
            <span class="badge" id="tapRatioBadge" data-i18n="${this.r1 === 3 ? 'games.tapRatio32' : 'games.tapRatio43'}">${i18n.t(this.r1 === 3 ? 'games.tapRatio32' : 'games.tapRatio43')}</span>
            <span class="badge highlight-cyan" id="stageBadge">STAGE 1/4</span>
          </div>
        </div>

        <!-- Consolidated HUD Telemetry Row -->
        <div class="arcade-hud">
          <div class="hud-stat-item">
            <span class="hud-stat-label">SCORE</span>
            <span class="hud-stat-value highlight-amber" id="scoreDisplay">0 PTS</span>
          </div>
          <div class="arcade-hud-stats">
            <div class="hud-stat-item">
              <span class="hud-stat-label" data-i18n="games.currentCombo">COMBO</span>
              <span class="hud-stat-value highlight-cyan" id="comboDisplay">0x</span>
            </div>
            <div class="hud-stat-item">
              <span class="hud-stat-label" data-i18n="games.maxCombo">MAX COMBO</span>
              <span class="hud-stat-value highlight-violet" id="maxComboDisplay">0x</span>
            </div>
            <div class="hud-stat-item">
              <span class="hud-stat-label" data-i18n="games.speed">TEMPO</span>
              <span class="hud-stat-value" id="gameBpmVal">${this.bpm} BPM</span>
            </div>
          </div>
          <div class="hud-stat-item">
            <span class="hud-stat-label">JUDGMENT</span>
            <span class="judgment-text" id="judgmentLabel" data-i18n="games.pressStart">${i18n.t('games.pressStart')}</span>
          </div>
        </div>

        <!-- Stage Stepper Progress Bar -->
        <div class="stage-stepper-container">
          <div class="stage-stepper-track" id="stageStepperTrack">
            <div class="stage-step-card active" id="cardStep1">
              <div class="step-card-num">STAGE 1</div>
              <div class="step-card-title" data-i18n="games.step1Title">${i18n.t('games.step1Title')}</div>
              <div class="stage-progress-fill" id="fillStep1" style="width: 0%;"></div>
            </div>
            <div class="stage-step-card" id="cardStep2">
              <div class="step-card-num">STAGE 2</div>
              <div class="step-card-title" data-i18n="games.step2Title">${i18n.t('games.step2Title')}</div>
              <div class="stage-progress-fill" id="fillStep2" style="width: 0%;"></div>
            </div>
            <div class="stage-step-card" id="cardStep3">
              <div class="step-card-num">STAGE 3</div>
              <div class="step-card-title" data-i18n="games.step3Title">${i18n.t('games.step3Title')}</div>
              <div class="stage-progress-fill" id="fillStep3" style="width: 0%;"></div>
            </div>
            <div class="stage-step-card" id="cardStep4">
              <div class="step-card-num">STAGE 4</div>
              <div class="step-card-title" data-i18n="games.step4Title">${i18n.t('games.step4Title')}</div>
              <div class="stage-progress-fill" id="fillStep4" style="width: 0%;"></div>
            </div>
          </div>
          <div class="stage-objective-hint">
            <span id="stageObjectiveDesc">${i18n.t('games.stage1Right')}</span>
            <span class="stage-objective-counter" id="stageObjectiveCount">0 / 8 Hits</span>
          </div>
        </div>

        <!-- Central Falling Lanes Canvas with Particles & Screen Shake -->
        <div class="canvas-wrapper flex-center" style="position: relative; margin: 1rem 0 0.5rem 0;">
          <canvas id="tapCanvas" width="600" height="290"></canvas>
        </div>

        <!-- Integrated Dual Tap Pads -->
        <div class="dual-tap-pads" style="margin: 0.5rem 1.25rem 1rem 1.25rem;">
          <button class="tap-pad pad-left" id="padLeft">
            <span class="pad-key">A</span>
            <span class="pad-label" id="padLeftLabel"><span data-i18n="games.leftTrack">${i18n.t('games.leftTrack')}</span> (${this.r1})</span>
          </button>
          <button class="tap-pad pad-right" id="padRight">
            <span class="pad-key">L</span>
            <span class="pad-label" id="padRightLabel"><span data-i18n="games.rightTrack">${i18n.t('games.rightTrack')}</span> (${this.r2})</span>
          </button>
        </div>

        <!-- Transport & Difficulty Switcher Controls -->
        <div class="controls-row justify-center align-center" style="padding: 0 1.25rem 1.25rem 1.25rem; gap: 1.25rem; flex-wrap: wrap;">
          <button class="btn btn-primary btn-lg" id="btnStartGame" data-i18n="games.startGame">▶ ${i18n.t('games.startGame')}</button>
          <div class="rhythm-mode-select inline-flex align-center gap-sm">
            <span style="font-size: 0.78rem; color: var(--text-muted);" data-i18n="games.difficulty">${i18n.t('games.difficulty')}</span>
            <button class="btn btn-pill active" data-r1="3" data-r2="2" data-i18n="games.normal32">${i18n.t('games.normal32')}</button>
            <button class="btn btn-pill" data-r1="4" data-r2="3" data-i18n="games.hard43">${i18n.t('games.hard43')}</button>
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
    if (this.canvas && typeof this.canvas.getContext === 'function') {
      this.ctx = this.canvas.getContext('2d');
    }
  }

  bindEvents() {
    const startBtn = this.container.querySelector('#btnStartGame');
    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        await audioEngine.init();
        if (this.isPlaying) {
          this.stop();
        } else {
          this.start();
        }
      });
    }

    const diffBtns = this.container.querySelectorAll('.rhythm-mode-select button');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isPlaying) this.stop();
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.r1 = parseInt(btn.dataset.r1, 10);
        this.r2 = parseInt(btn.dataset.r2, 10);
        const ratioKey = this.r1 === 3 ? 'games.tapRatio32' : 'games.tapRatio43';
        const badge = this.container.querySelector('#tapRatioBadge');
        if (badge) {
          badge.textContent = i18n.t(ratioKey);
          badge.setAttribute('data-i18n', ratioKey);
        }
        this.updatePadsState();
        this.render();
      });
    });

    // Keyboard controls
    this.keyHandler = (e) => {
      if (!this.isPlaying) return;
      if (e.key === 'a' || e.key === 'A') {
        // In Stage 1A (Right hand solo), Left hand is muted
        if (this.stageIndex === 1) return;
        this.handleTap(1);
        this.flashPad('#padLeft');
      } else if (e.key === 'l' || e.key === 'L') {
        // In Stage 1B (Left hand solo), Right hand is muted
        if (this.stageIndex === 2) return;
        this.handleTap(2);
        this.flashPad('#padRight');
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    // On-screen touch pads
    const pLeft = this.container.querySelector('#padLeft');
    const pRight = this.container.querySelector('#padRight');
    if (pLeft) {
      pLeft.addEventListener('mousedown', () => {
        if (this.isPlaying) {
          if (this.stageIndex === 1) return;
          this.handleTap(1);
        }
        this.flashPad('#padLeft');
      });
    }
    if (pRight) {
      pRight.addEventListener('mousedown', () => {
        if (this.isPlaying) {
          if (this.stageIndex === 2) return;
          this.handleTap(2);
        }
        this.flashPad('#padRight');
      });
    }
  }

  flashPad(selector) {
    const pad = this.container.querySelector(selector);
    if (!pad) return;
    pad.classList.add('hit');
    setTimeout(() => pad.classList.remove('hit'), 120);
  }

  start() {
    this.isPlaying = true;
    this.isVictory = false;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalHits = 0;
    this.totalPerfects = 0;
    this.totalGoods = 0;
    this.totalMisses = 0;

    // Reset progression
    this.stageIndex = 1;
    this.stageHitsCurrent = 0;
    this.stageHitsNeeded = 8;
    this.bpm = this.baseBpm;
    this.cycleDuration = (60 / this.bpm) * 2;
    this.lastCycleIndex = -1;

    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.shakeDuration = 0;
    this.redFlashAlpha = 0;

    this.cycleStartTime = performance.now() / 1000;
    this.triggerBanner(i18n.t('games.stage1Right'), 'Master Right Hand (Key L) steady pulse');

    const startBtn = this.container.querySelector('#btnStartGame');
    if (startBtn) {
      startBtn.textContent = `⏹ ${i18n.t('games.stopGame')}`;
      startBtn.setAttribute('data-i18n', 'games.stopGame');
      startBtn.classList.remove('btn-primary');
      startBtn.classList.add('btn-danger');
    }

    this.updateStatsUI();
    this.updatePadsState();
    this.gameLoop();
  }

  stop() {
    this.isPlaying = false;
    if (this.animId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.animId);

    const startBtn = this.container.querySelector('#btnStartGame');
    if (startBtn) {
      startBtn.textContent = `▶ ${i18n.t('games.startGame')}`;
      startBtn.setAttribute('data-i18n', 'games.startGame');
      startBtn.classList.remove('btn-danger');
      startBtn.classList.add('btn-primary');
    }

    const judgment = this.container.querySelector('#judgmentLabel');
    if (judgment) {
      judgment.textContent = i18n.t('games.pressStart');
      judgment.className = 'judgment-text';
    }

    this.updatePadsState();
    this.render();
  }

  advanceStage() {
    this.stageHitsCurrent = 0;

    if (this.stageIndex === 1) {
      // 1A (Right) -> 1B (Left)
      this.stageIndex = 2;
      this.stageHitsNeeded = 8;
      this.triggerBanner(i18n.t('games.stageClear'), i18n.t('games.stage1Left'));
    } else if (this.stageIndex === 2) {
      // 1B (Left) -> Stage 2 (Both Hands)
      this.stageIndex = 3;
      this.stageHitsNeeded = 16;
      this.triggerBanner(i18n.t('games.stageClear'), i18n.t('games.stage2'));
    } else if (this.stageIndex === 3) {
      // Stage 2 (Both) -> Stage 3 (Ghost Pulse)
      this.stageIndex = 4;
      this.stageHitsNeeded = 16;
      this.triggerBanner(i18n.t('games.stageClear'), i18n.t('games.stage3'));
    } else if (this.stageIndex === 4) {
      // Stage 3 (Ghost) -> Stage 4 (Speed Hyperdrive)
      this.stageIndex = 5;
      this.stageHitsNeeded = 20;
      this.triggerBanner(i18n.t('games.stageClear'), i18n.t('games.stage4'));
    } else if (this.stageIndex === 5) {
      // Completed Stage 4 -> VICTORY!
      this.isVictory = true;
      this.isPlaying = false;
      if (this.animId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.animId);
      this.triggerBanner(i18n.t('games.victory'), i18n.t('games.finalRank'));

      const startBtn = this.container.querySelector('#btnStartGame');
      if (startBtn) {
        startBtn.textContent = `▶ ${i18n.t('games.playAgain')}`;
        startBtn.setAttribute('data-i18n', 'games.playAgain');
        startBtn.classList.remove('btn-danger');
        startBtn.classList.add('btn-primary');
      }
    }

    this.updatePadsState();
    this.updateStatsUI();
  }

  triggerBanner(title, sub) {
    this.stageBannerText = title;
    this.stageBannerSub = sub;
    this.stageBannerTimer = 90; // ~1.5 seconds at 60fps
  }

  handleTap(trackNum) {
    const now = performance.now() / 1000;
    const elapsed = (now - this.cycleStartTime) % this.cycleDuration;
    const progress = elapsed / this.cycleDuration;

    const r = trackNum === 1 ? this.r1 : this.r2;

    // Closest beat time calculation
    let minDiff = 999;
    for (let i = 0; i < r; i++) {
      const targetProg = i / r;
      let diff = Math.abs(progress - targetProg);
      if (diff > 0.5) diff = 1 - diff;
      const diffSec = diff * this.cycleDuration;
      if (diffSec < minDiff) minDiff = diffSec;
    }

    const width = this.canvas ? this.canvas.width : 600;
    const height = this.canvas ? this.canvas.height : 290;
    const laneWidth = 140;
    const hitX = trackNum === 1 ? (width / 2 - laneWidth + 65) : (width / 2 + 10 + 65);
    const hitY = height - 42;

    // Percussion sound
    if (trackNum === 1) instruments.playDrum('woodblock', null, 0.9);
    else instruments.playDrum('clave', null, 0.9);

    this.totalHits++;

    // Judgment timing window evaluation
    if (minDiff <= 0.055) {
      // PERFECT
      this.score += 100 + this.combo * 15;
      this.combo++;
      this.totalPerfects++;
      this.stageHitsCurrent++;
      this.setJudgment(i18n.t('games.perfect'), 'text-success');

      // Visual Special FX: Particle Fireworks + Shockwave
      this.spawnParticles(hitX, hitY, trackNum === 1 ? '#00f2fe' : '#f59e0b', 22);
      this.spawnShockwave(hitX, hitY, trackNum === 1 ? '#00f2fe' : '#f59e0b');
      this.addFloatingText(`PERFECT! +${100 + this.combo * 15}`, hitX, hitY - 15, '#10b981');
    } else if (minDiff <= 0.12) {
      // GOOD
      this.score += 50;
      this.combo++;
      this.totalGoods++;
      this.stageHitsCurrent++;
      this.setJudgment(i18n.t('games.good'), 'text-warning');

      // Smaller particle burst
      this.spawnParticles(hitX, hitY, '#f59e0b', 10);
      this.addFloatingText('GOOD! +50', hitX, hitY - 15, '#f59e0b');
    } else {
      // MISS / OFF BEAT
      this.combo = 0;
      this.totalMisses++;
      this.setJudgment(i18n.t('games.offBeat'), 'text-danger');

      // Visual Special FX: Screen Shake + Red Flash Vignette
      this.shakeDuration = 12;
      this.shakeIntensity = 7;
      this.redFlashAlpha = 0.35;
      this.spawnParticles(hitX, hitY, '#ef4444', 12);
      this.addFloatingText(i18n.t('games.offBeat'), hitX, hitY - 15, '#ef4444');
    }

    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    // Check Stage Progress Completion
    if (this.stageHitsCurrent >= this.stageHitsNeeded) {
      this.advanceStage();
    } else {
      this.updateStatsUI();
    }
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: Math.random() > 0.3 ? color : '#ffffff',
        size: 3 + Math.random() * 3.5,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.025
      });
    }
  }

  spawnShockwave(x, y, color) {
    this.shockwaves.push({
      x,
      y,
      radius: 8,
      maxRadius: 42,
      alpha: 1.0,
      color
    });
  }

  addFloatingText(text, x, y, color) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      alpha: 1.0,
      vy: -1.2
    });
  }

  setJudgment(text, className) {
    const banner = this.container.querySelector('#judgmentLabel');
    if (!banner) return;
    banner.textContent = text;
    banner.className = `judgment-text ${className}`;
  }

  updatePadsState() {
    const pLeft = this.container.querySelector('#padLeft');
    const pRight = this.container.querySelector('#padRight');
    const pLeftLabel = this.container.querySelector('#padLeftLabel');
    const pRightLabel = this.container.querySelector('#padRightLabel');
    if (!pLeft || !pRight) return;

    if (this.stageIndex === 1) {
      // Stage 1A: Right Hand Solo (Left is Muted)
      pLeft.classList.add('muted');
      pRight.classList.remove('muted');
      if (pLeftLabel) pLeftLabel.innerHTML = `<span data-i18n="games.leftTrack">${i18n.t('games.leftTrack')}</span> [${i18n.t('games.step1Muted')}]`;
      if (pRightLabel) pRightLabel.innerHTML = `<span data-i18n="games.rightTrack">${i18n.t('games.rightTrack')}</span> (${this.r2})`;
    } else if (this.stageIndex === 2) {
      // Stage 1B: Left Hand Solo (Right is Muted)
      pRight.classList.add('muted');
      pLeft.classList.remove('muted');
      if (pRightLabel) pRightLabel.innerHTML = `<span data-i18n="games.rightTrack">${i18n.t('games.rightTrack')}</span> [${i18n.t('games.step1Muted')}]`;
      if (pLeftLabel) pLeftLabel.innerHTML = `<span data-i18n="games.leftTrack">${i18n.t('games.leftTrack')}</span> (${this.r1})`;
    } else {
      // Stages 2, 3, 4: Both Hands Active
      pLeft.classList.remove('muted');
      pRight.classList.remove('muted');
      if (pLeftLabel) pLeftLabel.innerHTML = `<span data-i18n="games.leftTrack">${i18n.t('games.leftTrack')}</span> (${this.r1})`;
      if (pRightLabel) pRightLabel.innerHTML = `<span data-i18n="games.rightTrack">${i18n.t('games.rightTrack')}</span> (${this.r2})`;
    }
  }

  updateStatsUI() {
    const sDisplay = this.container.querySelector('#scoreDisplay');
    const cDisplay = this.container.querySelector('#comboDisplay');
    const mDisplay = this.container.querySelector('#maxComboDisplay');
    const bpmDisplay = this.container.querySelector('#gameBpmVal');
    const sBadge = this.container.querySelector('#stageBadge');

    if (sDisplay) sDisplay.textContent = `${this.score.toLocaleString()} PTS`;
    if (cDisplay) {
      cDisplay.textContent = `${this.combo}x`;
      if (this.combo >= 10) cDisplay.classList.add('combo-fire');
      else cDisplay.classList.remove('combo-fire');
    }
    if (mDisplay) mDisplay.textContent = `${this.maxCombo}x`;
    if (bpmDisplay) bpmDisplay.textContent = `${this.bpm} BPM`;

    // Stage Badge & Step Cards Update
    const currentStepNum = this.stageIndex === 1 || this.stageIndex === 2 ? 1 : (this.stageIndex - 1);
    if (sBadge) sBadge.textContent = `STAGE ${currentStepNum}/4`;

    // Update 4 Stage Step Cards
    for (let i = 1; i <= 4; i++) {
      const card = this.container.querySelector(`#cardStep${i}`);
      const fill = this.container.querySelector(`#fillStep${i}`);
      if (!card || !fill) continue;

      if (i < currentStepNum) {
        card.className = 'stage-step-card cleared';
        fill.style.width = '100%';
      } else if (i === currentStepNum) {
        card.className = 'stage-step-card active';
        const pct = Math.min(100, Math.round((this.stageHitsCurrent / this.stageHitsNeeded) * 100));
        fill.style.width = `${pct}%`;
      } else {
        card.className = 'stage-step-card';
        fill.style.width = '0%';
      }
    }

    // Objective description text & hit counter
    const objDesc = this.container.querySelector('#stageObjectiveDesc');
    const objCount = this.container.querySelector('#stageObjectiveCount');

    if (objDesc) {
      if (this.stageIndex === 1) objDesc.textContent = i18n.t('games.stage1Right');
      else if (this.stageIndex === 2) objDesc.textContent = i18n.t('games.stage1Left');
      else if (this.stageIndex === 3) objDesc.textContent = i18n.t('games.stage2');
      else if (this.stageIndex === 4) objDesc.textContent = i18n.t('games.stage3');
      else if (this.stageIndex === 5) objDesc.textContent = i18n.t('games.stage4');
    }

    if (objCount) {
      objCount.textContent = `${this.stageHitsCurrent} / ${this.stageHitsNeeded} Hits`;
    }
  }

  updateLanguage() {
    const ratioKey = this.r1 === 3 ? 'games.tapRatio32' : 'games.tapRatio43';
    const badge = this.container.querySelector('#tapRatioBadge');
    if (badge) {
      badge.textContent = i18n.t(ratioKey);
      badge.setAttribute('data-i18n', ratioKey);
    }

    const startBtn = this.container.querySelector('#btnStartGame');
    if (startBtn) {
      const key = this.isPlaying ? 'games.stopGame' : (this.isVictory ? 'games.playAgain' : 'games.startGame');
      startBtn.textContent = `${this.isPlaying ? '⏹' : '▶'} ${i18n.t(key)}`;
      startBtn.setAttribute('data-i18n', key);
    }

    const judgment = this.container.querySelector('#judgmentLabel');
    if (judgment && !this.isPlaying && !this.isVictory) {
      judgment.textContent = i18n.t('games.pressStart');
    }

    this.updateStatsUI();
    this.updatePadsState();
    i18n.applyDomTranslations(this.container);
  }

  gameLoop() {
    if (!this.isPlaying) return;
    this.render();
    if (typeof requestAnimationFrame === 'function') {
      this.animId = requestAnimationFrame(() => this.gameLoop());
    }
  }

  render() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Screen Shake Offset on Miss/Bad Tap
    if (this.shakeDuration > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(sx, sy);
      this.shakeDuration--;
    }

    const laneWidth = 140;
    const lane1X = width / 2 - laneWidth;
    const lane2X = width / 2 + 10;
    const judgmentY = height - 42;

    // Draw Lanes
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(lane1X, 15, laneWidth - 10, height - 30);
    ctx.fillRect(lane2X, 15, laneWidth - 10, height - 30);

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

    // Dynamic Accelerando in Stage 4 (Speed Hyperdrive)
    if (this.stageIndex === 5 && this.isPlaying) {
      const currentCycle = Math.floor((now - this.cycleStartTime) / this.cycleDuration);
      if (currentCycle > this.lastCycleIndex) {
        this.lastCycleIndex = currentCycle;
        if (this.bpm < 135) {
          this.bpm += 2;
          this.cycleDuration = (60 / this.bpm) * 2;
          const bpmDisplay = this.container.querySelector('#gameBpmVal');
          if (bpmDisplay) bpmDisplay.textContent = `${this.bpm} BPM`;
        }
      }
    }

    // Alpha modulation for lanes
    let r1Alpha = 1.0;
    let r2Alpha = 1.0;

    if (this.stageIndex === 1) {
      // Stage 1A: Right Hand Solo (Left is Muted)
      r1Alpha = 0.08;
      r2Alpha = 1.0;
    } else if (this.stageIndex === 2) {
      // Stage 1B: Left Hand Solo (Right is Muted)
      r1Alpha = 1.0;
      r2Alpha = 0.08;
    } else if (this.stageIndex === 4) {
      // Stage 3: Ghost Pulse (Fade out and reappear)
      if (this.isPlaying) {
        const t = (now - this.cycleStartTime) / this.cycleDuration;
        const phase = (t % 6.0 + 6.0) % 6.0;
        let alpha = 1.0;
        if (phase < 2.0) alpha = 1.0;
        else if (phase < 2.8) alpha = 1.0 - (phase - 2.0) / 0.8;
        else if (phase < 4.8) alpha = 0.0; // Completely invisible ghost pulse!
        else if (phase < 5.8) alpha = (phase - 4.8) / 1.0;
        else alpha = 1.0;

        r1Alpha = alpha;
        r2Alpha = alpha;

        if (alpha < 0.5) {
          ctx.save();
          ctx.fillStyle = `rgba(192, 132, 252, ${Math.min(1.0, (1 - alpha) * 1.6)})`;
          ctx.font = 'bold 12px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('👻 ' + i18n.t('games.step3GhostActive'), width / 2, 70);
          ctx.restore();
        }
      }
    }

    // Helper: Draw Falling Beat Orbs
    const drawTrackBeats = (r, laneX, color, alpha) => {
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      for (let i = 0; i < r; i++) {
        const beatProg = i / r;
        let delta = beatProg - progress;
        if (delta < -0.1) delta += 1.0;

        const y = 25 + (1 - delta) * (judgmentY - 25);
        if (y >= 15 && y <= height - 5) {
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 10 * alpha;
          ctx.beginPath();
          ctx.arc(laneX + (laneWidth - 10) / 2, y, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    };

    drawTrackBeats(this.r1, lane1X, '#00f2fe', r1Alpha);
    drawTrackBeats(this.r2, lane2X, '#f59e0b', r2Alpha);

    // Render Expanding Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += 2.2;
      sw.alpha -= 0.045;
      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Render Particle Explosions
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // Gravity
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Floating Judgment Popups
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.022;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = '800 13px var(--font-mono, monospace)';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // Render Red Flash Vignette on Miss
    if (this.redFlashAlpha > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(239, 68, 68, ${this.redFlashAlpha})`;
      ctx.fillRect(0, 0, width, height);
      this.redFlashAlpha *= 0.86;
      ctx.restore();
    }

    // Render Stage Transition Splash Banner
    if (this.stageBannerTimer > 0) {
      this.stageBannerTimer--;
      const bannerAlpha = Math.min(1.0, this.stageBannerTimer / 25);
      ctx.save();
      ctx.fillStyle = `rgba(15, 23, 42, ${bannerAlpha * 0.85})`;
      ctx.fillRect(0, height / 2 - 38, width, 76);
      ctx.strokeStyle = `rgba(0, 242, 254, ${bannerAlpha * 0.7})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(0, height / 2 - 38, width, 76);

      ctx.fillStyle = `rgba(255, 255, 255, ${bannerAlpha})`;
      ctx.font = '800 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.stageBannerText, width / 2, height / 2 - 8);

      ctx.fillStyle = `rgba(0, 242, 254, ${bannerAlpha})`;
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText(this.stageBannerSub, width / 2, height / 2 + 16);
      ctx.restore();
    }

    // Render Victory Summary Overlay
    if (this.isVictory) {
      ctx.save();
      ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
      ctx.fillRect(0, 0, width, height);

      const acc = this.totalHits > 0 ? Math.round(((this.totalPerfects + this.totalGoods * 0.5) / this.totalHits) * 100) : 0;
      let rank = 'S';
      let rankColor = '#f59e0b';
      if (acc < 65) { rank = 'C'; rankColor = '#94a3b8'; }
      else if (acc < 80) { rank = 'B'; rankColor = '#00f2fe'; }
      else if (acc < 92) { rank = 'A'; rankColor = '#10b981'; }

      ctx.fillStyle = '#f59e0b';
      ctx.font = '800 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 ' + i18n.t('games.victory'), width / 2, 60);

      ctx.fillStyle = rankColor;
      ctx.font = '900 48px monospace';
      ctx.fillText(`RANK ${rank}`, width / 2, 120);

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 14px system-ui, sans-serif';
      ctx.fillText(`Accuracy: ${acc}%  |  Score: ${this.score.toLocaleString()} PTS  |  Max Combo: ${this.maxCombo}x`, width / 2, 160);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(`Perfects: ${this.totalPerfects}  |  Goods: ${this.totalGoods}  |  Misses: ${this.totalMisses}`, width / 2, 195);
      ctx.restore();
    }

    ctx.restore();
  }

  destroy() {
    this.stop();
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
    }
    if (this.unsubscribeI18n) {
      this.unsubscribeI18n();
    }
  }
}
