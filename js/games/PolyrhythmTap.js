/**
 * PolyrhythmTap.js
 * Polyrhythm Tap Hero: A progressive rhythm coordination mini-game.
 * - Step 1: Single Hand Isolation (Right Hand first, then Left Hand)
 * - Step 2: Dual Hands Coordination (Composite polyrhythm)
 * - Step 3: Ghost Pulse / Internal Clock (Dots fade out and reappear; silent counting)
 * - Step 4: Variable Speed & Accelerando (Tempo presets and dynamic acceleration)
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

    // Progressive Training Stages
    this.currentStep = 1; // 1: Single Hand, 2: Both Hands, 3: Ghost Pulse, 4: Variable Speed
    this.step1Hand = 'right'; // 'right' | 'left' (Defaults to Right hand first as requested)
    this.accelerando = false;
    this.lastCycleIndex = -1;

    this.track1Beats = [];
    this.track2Beats = [];
    this.cycleStartTime = 0;
    this.cycleDuration = (60 / this.bpm) * 2; // 2 measures

    this.initDOM();
    this.initCanvas();
    this.bindEvents();
    this.setStep(1);
    this.render();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="lab-grid">
        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🎮</span> <span data-i18n="games.tapTitle">${i18n.t('games.tapTitle')}</span></h3>
            <span class="badge" id="tapRatioBadge" data-i18n="${this.r1 === 3 ? 'games.tapRatio32' : 'games.tapRatio43'}">${i18n.t(this.r1 === 3 ? 'games.tapRatio32' : 'games.tapRatio43')}</span>
          </div>
          <p class="panel-desc" data-i18n="games.tapDesc">
            ${i18n.t('games.tapDesc')}
          </p>

          <!-- 4-Step Progressive Training Navigation -->
          <div class="step-selector-row" id="stepSelectorRow">
            <button class="step-pill active" data-step="1" data-i18n="games.step1Title">${i18n.t('games.step1Title')}</button>
            <button class="step-pill" data-step="2" data-i18n="games.step2Title">${i18n.t('games.step2Title')}</button>
            <button class="step-pill" data-step="3" data-i18n="games.step3Title">${i18n.t('games.step3Title')}</button>
            <button class="step-pill" data-step="4" data-i18n="games.step4Title">${i18n.t('games.step4Title')}</button>
          </div>

          <!-- Active Step Context Banner & Extra Controls -->
          <div class="step-banner" id="stepBanner">
            <span id="stepDescText">${i18n.t('games.step1Desc')}</span>
            <div id="stepContextControls"></div>
          </div>

          <div class="canvas-wrapper flex-center">
            <canvas id="tapCanvas" width="560" height="280"></canvas>
          </div>

          <div class="dual-tap-pads">
            <button class="tap-pad pad-left" id="padLeft">
              <span class="pad-key">A</span>
              <span class="pad-label" id="padLeftLabel"><span data-i18n="games.leftTrack">${i18n.t('games.leftTrack')}</span> (${this.r1})</span>
            </button>
            <button class="tap-pad pad-right" id="padRight">
              <span class="pad-key">L</span>
              <span class="pad-label" id="padRightLabel"><span data-i18n="games.rightTrack">${i18n.t('games.rightTrack')}</span> (${this.r2})</span>
            </button>
          </div>

          <div class="controls-row justify-center">
            <button class="btn btn-primary btn-lg" id="btnStartGame" data-i18n="games.startGame">▶ ${i18n.t('games.startGame')}</button>
            <div class="tempo-control inline-flex align-center">
              <label><span data-i18n="games.speed">${i18n.t('games.speed')}</span>: <span id="gameBpmVal" class="mono-value">${this.bpm} BPM</span></label>
              <input type="range" id="gameBpmSlider" min="50" max="130" step="2" value="${this.bpm}">
            </div>
          </div>
        </div>

        <div class="panel glass-panel">
          <div class="panel-header">
            <h3><span class="icon">🏆</span> <span data-i18n="games.performanceTitle">${i18n.t('games.performanceTitle')}</span></h3>
            <span class="badge highlight-amber" id="scoreDisplay">0 ${i18n.t('app.pts')}</span>
          </div>

          <div class="game-stats-box">
            <div class="stat-card">
              <span class="stat-label" data-i18n="games.currentCombo">${i18n.t('games.currentCombo')}</span>
              <span class="stat-value highlight-cyan" id="comboDisplay">0x</span>
            </div>
            <div class="stat-card">
              <span class="stat-label" data-i18n="games.maxCombo">${i18n.t('games.maxCombo')}</span>
              <span class="stat-value highlight-violet" id="maxComboDisplay">0x</span>
            </div>
          </div>

          <div class="judgment-banner" id="judgmentBanner">
            <span id="judgmentLabel" class="judgment-text" data-i18n="games.pressStart">${i18n.t('games.pressStart')}</span>
          </div>

          <div class="rhythm-mode-select" style="margin-top: 1.5rem;">
            <h4 data-i18n="games.difficulty">${i18n.t('games.difficulty')}</h4>
            <div class="controls-row">
              <button class="btn btn-pill active" data-r1="3" data-r2="2" data-i18n="games.normal32">${i18n.t('games.normal32')}</button>
              <button class="btn btn-pill" data-r1="4" data-r2="3" data-i18n="games.hard43">${i18n.t('games.hard43')}</button>
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
    if (this.canvas && typeof this.canvas.getContext === 'function') {
      this.ctx = this.canvas.getContext('2d');
    }
  }

  setStep(stepNum) {
    this.currentStep = stepNum;

    // Update active pill button
    const pills = this.container.querySelectorAll('#stepSelectorRow .step-pill');
    pills.forEach(pill => {
      const s = parseInt(pill.dataset.step, 10);
      if (s === stepNum) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Update description text
    const descEl = this.container.querySelector('#stepDescText');
    if (descEl) {
      const descKey = `games.step${stepNum}Desc`;
      descEl.textContent = i18n.t(descKey);
      descEl.setAttribute('data-i18n', descKey);
    }

    // Render step-specific context controls in banner
    this.updateStepContextUI();
    this.updatePadsState();
    if (!this.isPlaying) this.render();
  }

  setStep1Hand(hand) {
    this.step1Hand = hand;
    this.updateStepContextUI();
    this.updatePadsState();
    if (!this.isPlaying) this.render();
  }

  updateStepContextUI() {
    const controlsContainer = this.container.querySelector('#stepContextControls');
    if (!controlsContainer) return;

    if (this.currentStep === 1) {
      controlsContainer.innerHTML = `
        <div class="step1-hand-selector">
          <button class="step1-hand-btn ${this.step1Hand === 'right' ? 'active' : ''}" id="btnHandRight" data-hand="right" data-i18n="games.step1RightHand">
            ${i18n.t('games.step1RightHand')}
          </button>
          <button class="step1-hand-btn hand-left ${this.step1Hand === 'left' ? 'active' : ''}" id="btnHandLeft" data-hand="left" data-i18n="games.step1LeftHand">
            ${i18n.t('games.step1LeftHand')}
          </button>
        </div>
      `;
      const btnRight = controlsContainer.querySelector('#btnHandRight');
      const btnLeft = controlsContainer.querySelector('#btnHandLeft');
      if (btnRight) btnRight.addEventListener('click', () => this.setStep1Hand('right'));
      if (btnLeft) btnLeft.addEventListener('click', () => this.setStep1Hand('left'));
    } else if (this.currentStep === 3) {
      controlsContainer.innerHTML = `
        <div class="ghost-badge">
          <span>👻</span>
          <span data-i18n="games.step3GhostActive">${i18n.t('games.step3GhostActive')}</span>
        </div>
      `;
    } else if (this.currentStep === 4) {
      controlsContainer.innerHTML = `
        <div class="tempo-presets">
          <button class="btn-preset ${this.bpm === 60 ? 'active' : ''}" data-bpm="60" data-i18n="games.tempoSlow">${i18n.t('games.tempoSlow')}</button>
          <button class="btn-preset ${this.bpm === 75 ? 'active' : ''}" data-bpm="75" data-i18n="games.tempoNormal">${i18n.t('games.tempoNormal')}</button>
          <button class="btn-preset ${this.bpm === 95 ? 'active' : ''}" data-bpm="95" data-i18n="games.tempoFast">${i18n.t('games.tempoFast')}</button>
          <button class="btn-preset ${this.bpm === 120 ? 'active' : ''}" data-bpm="120" data-i18n="games.tempoPresto">${i18n.t('games.tempoPresto')}</button>
          <label class="accelerando-toggle">
            <input type="checkbox" id="chkAccelerando" ${this.accelerando ? 'checked' : ''}>
            <span data-i18n="games.accelerando">${i18n.t('games.accelerando')}</span>
            ${this.accelerando && this.isPlaying ? `<span class="accel-active-tag" data-i18n="games.accelerandoActive">${i18n.t('games.accelerandoActive')}</span>` : ''}
          </label>
        </div>
      `;
      const presetBtns = controlsContainer.querySelectorAll('.btn-preset');
      presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const bpm = parseInt(btn.dataset.bpm, 10);
          this.setBpm(bpm);
        });
      });
      const chk = controlsContainer.querySelector('#chkAccelerando');
      if (chk) {
        chk.addEventListener('change', (e) => {
          this.accelerando = e.target.checked;
          this.updateStepContextUI();
        });
      }
    } else {
      controlsContainer.innerHTML = '';
    }
  }

  updatePadsState() {
    const pLeft = this.container.querySelector('#padLeft');
    const pRight = this.container.querySelector('#padRight');
    const pLeftLabel = this.container.querySelector('#padLeftLabel');
    const pRightLabel = this.container.querySelector('#padRightLabel');

    if (!pLeft || !pRight) return;

    if (this.currentStep === 1) {
      if (this.step1Hand === 'right') {
        pLeft.classList.add('muted');
        pRight.classList.remove('muted');
        if (pLeftLabel) {
          pLeftLabel.innerHTML = `<span data-i18n="games.leftTrack">${i18n.t('games.leftTrack')}</span> [${i18n.t('games.step1Muted')}]`;
        }
        if (pRightLabel) {
          pRightLabel.innerHTML = `<span data-i18n="games.rightTrack">${i18n.t('games.rightTrack')}</span> (${this.r2})`;
        }
      } else {
        pRight.classList.add('muted');
        pLeft.classList.remove('muted');
        if (pRightLabel) {
          pRightLabel.innerHTML = `<span data-i18n="games.rightTrack">${i18n.t('games.rightTrack')}</span> [${i18n.t('games.step1Muted')}]`;
        }
        if (pLeftLabel) {
          pLeftLabel.innerHTML = `<span data-i18n="games.leftTrack">${i18n.t('games.leftTrack')}</span> (${this.r1})`;
        }
      }
    } else {
      pLeft.classList.remove('muted');
      pRight.classList.remove('muted');
      if (pLeftLabel) {
        pLeftLabel.innerHTML = `<span data-i18n="games.leftTrack">${i18n.t('games.leftTrack')}</span> (${this.r1})`;
      }
      if (pRightLabel) {
        pRightLabel.innerHTML = `<span data-i18n="games.rightTrack">${i18n.t('games.rightTrack')}</span> (${this.r2})`;
      }
    }
  }

  setBpm(bpm) {
    this.bpm = Math.max(40, Math.min(140, bpm));
    this.cycleDuration = (60 / this.bpm) * 2;
    const bpmVal = this.container.querySelector('#gameBpmVal');
    const bpmSlider = this.container.querySelector('#gameBpmSlider');
    if (bpmVal) bpmVal.textContent = `${this.bpm} BPM`;
    if (bpmSlider) bpmSlider.value = this.bpm;
    if (this.currentStep === 4) this.updateStepContextUI();
  }

  bindEvents() {
    // Step Selection clicks
    const stepPills = this.container.querySelectorAll('#stepSelectorRow .step-pill');
    stepPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const step = parseInt(pill.dataset.step, 10);
        this.setStep(step);
      });
    });

    const startBtn = this.container.querySelector('#btnStartGame');
    if (startBtn) {
      startBtn.addEventListener('click', async () => {
        await audioEngine.init();
        if (this.isPlaying) {
          this.stop();
          startBtn.textContent = `▶ ${i18n.t('games.startGame')}`;
          startBtn.setAttribute('data-i18n', 'games.startGame');
          startBtn.classList.remove('btn-danger');
          startBtn.classList.add('btn-primary');
        } else {
          this.start();
          startBtn.textContent = `⏹ ${i18n.t('games.stopGame')}`;
          startBtn.setAttribute('data-i18n', 'games.stopGame');
          startBtn.classList.remove('btn-primary');
          startBtn.classList.add('btn-danger');
        }
      });
    }

    const bpmSlider = this.container.querySelector('#gameBpmSlider');
    if (bpmSlider) {
      bpmSlider.addEventListener('input', (e) => {
        this.setBpm(parseInt(e.target.value, 10));
      });
    }

    const diffBtns = this.container.querySelectorAll('.rhythm-mode-select button');
    diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
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
        if (this.currentStep === 1 && this.step1Hand === 'right') return; // Muted in Step 1 Right hand mode
        this.handleTap(1);
        this.flashPad('#padLeft');
      } else if (e.key === 'l' || e.key === 'L') {
        if (this.currentStep === 1 && this.step1Hand === 'left') return; // Muted in Step 1 Left hand mode
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
          if (this.currentStep === 1 && this.step1Hand === 'right') return;
          this.handleTap(1);
        }
        this.flashPad('#padLeft');
      });
    }
    if (pRight) {
      pRight.addEventListener('mousedown', () => {
        if (this.isPlaying) {
          if (this.currentStep === 1 && this.step1Hand === 'left') return;
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
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.cycleStartTime = performance.now() / 1000;
    this.lastCycleIndex = -1;
    this.updateStatsUI();
    if (this.currentStep === 4) this.updateStepContextUI();
    this.gameLoop();
  }

  stop() {
    this.isPlaying = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.currentStep === 4) this.updateStepContextUI();
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

    // Play feedback acoustic percussion
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
    if (!banner) return;
    banner.textContent = text;
    banner.className = `judgment-text ${className}`;
  }

  updateStatsUI() {
    const sDisplay = this.container.querySelector('#scoreDisplay');
    const cDisplay = this.container.querySelector('#comboDisplay');
    const mDisplay = this.container.querySelector('#maxComboDisplay');
    if (sDisplay) sDisplay.textContent = `${this.score} ${i18n.t('app.pts')}`;
    if (cDisplay) cDisplay.textContent = `${this.combo}x`;
    if (mDisplay) mDisplay.textContent = `${this.maxCombo}x`;
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
      const key = this.isPlaying ? 'games.stopGame' : 'games.startGame';
      startBtn.textContent = `${this.isPlaying ? '⏹' : '▶'} ${i18n.t(key)}`;
      startBtn.setAttribute('data-i18n', key);
    }

    const judgment = this.container.querySelector('#judgmentLabel');
    if (judgment && !this.isPlaying) {
      judgment.textContent = i18n.t('games.pressStart');
    }

    // Update step pills
    const pills = this.container.querySelectorAll('#stepSelectorRow .step-pill');
    pills.forEach(pill => {
      const s = pill.dataset.step;
      pill.textContent = i18n.t(`games.step${s}Title`);
    });

    // Update active step description
    const descEl = this.container.querySelector('#stepDescText');
    if (descEl) {
      descEl.textContent = i18n.t(`games.step${this.currentStep}Desc`);
    }

    this.updateStepContextUI();
    this.updatePadsState();
    this.updateStatsUI();
    i18n.applyDomTranslations(this.container);
  }

  gameLoop() {
    if (!this.isPlaying) return;
    this.render();
    this.animId = requestAnimationFrame(() => this.gameLoop());
  }

  render() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    const laneWidth = 140;
    const lane1X = width / 2 - laneWidth;
    const lane2X = width / 2 + 10;
    const judgmentY = height - 42;

    // Draw Lanes
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
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

    // Step-specific alpha logic
    let r1Alpha = 1.0;
    let r2Alpha = 1.0;

    if (this.currentStep === 1) {
      // Step 1: Single Hand Isolation
      if (this.step1Hand === 'right') {
        r1Alpha = 0.1; // Muted track
        r2Alpha = 1.0;
      } else {
        r1Alpha = 1.0;
        r2Alpha = 0.1; // Muted track
      }
    } else if (this.currentStep === 3) {
      // Step 3: Ghost Pulse (Fade out and reappear; silent counting)
      if (this.isPlaying) {
        const t = (now - this.cycleStartTime) / this.cycleDuration;
        const phase = (t % 6.0 + 6.0) % 6.0; // 6-cycle loop
        let alpha = 1.0;
        if (phase < 2.0) {
          alpha = 1.0; // Visible for 2 cycles
        } else if (phase < 2.8) {
          alpha = 1.0 - (phase - 2.0) / 0.8; // Smoothly fade out
        } else if (phase < 4.8) {
          alpha = 0.0; // Completely invisible ghost mode for 2 cycles!
        } else if (phase < 5.8) {
          alpha = (phase - 4.8) / 1.0; // Smoothly fade back in
        } else {
          alpha = 1.0;
        }
        r1Alpha = alpha;
        r2Alpha = alpha;

        // Render floating ghost alert text in canvas when fading / hidden
        if (alpha < 0.6) {
          ctx.save();
          ctx.fillStyle = `rgba(192, 132, 252, ${Math.min(1.0, (1 - alpha) * 1.6)})`;
          ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('👻 ' + i18n.t('games.step3GhostActive'), width / 2, 70);
          ctx.restore();
        }
      }
    } else if (this.currentStep === 4) {
      // Step 4: Variable Speed & Dynamic Accelerando
      if (this.accelerando && this.isPlaying) {
        const currentCycle = Math.floor((now - this.cycleStartTime) / this.cycleDuration);
        if (currentCycle > this.lastCycleIndex) {
          this.lastCycleIndex = currentCycle;
          // If player maintained combo > 3, increase tempo by +2 BPM up to 140 BPM!
          if (this.combo >= 3 && this.bpm < 140) {
            this.setBpm(this.bpm + 2);
          }
        }
      }
    }

    // Helper: Draw falling beat orbs
    const drawTrackBeats = (r, laneX, color, alpha) => {
      if (alpha <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      for (let i = 0; i < r; i++) {
        const beatProg = i / r;
        let delta = beatProg - progress;
        if (delta < -0.1) delta += 1.0; // Wrap around for approaching beats

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
