/**
 * app.js
 * Harmonix Lab Main Application Controller & Router.
 * Coordinates audio initialization, live oscilloscope HUD, module lifecycle, and responsive tab routing.
 */

import { audioEngine } from './audio/AudioEngine.js';
import { i18n } from './i18n/i18n.js';

// Physics Modules
import { WaveformLab } from './physics/WaveformLab.js';
import { HarmonicSeries } from './physics/HarmonicSeries.js';
import { ConsonanceGraph } from './physics/ConsonanceGraph.js';

// Theory Modules
import { ModeExplorer } from './theory/ModeExplorer.js';
import { CircleOfFifths } from './theory/CircleOfFifths.js';
import { GlobalTraditions } from './theory/GlobalTraditions.js';
import { TonnetzMatrix } from './theory/TonnetzMatrix.js';

// Rhythm Modules
import { EuclideanSequencer } from './rhythm/EuclideanSequencer.js';
import { PolyrhythmOrbital } from './rhythm/PolyrhythmOrbital.js';
import { WorldGrooves } from './rhythm/WorldGrooves.js';

// Timbre Modules
import { FourierLab } from './timbre/FourierLab.js';
import { AdsrLab } from './timbre/AdsrLab.js';

// Mini-Games
import { StyleChameleon } from './games/StyleChameleon.js';
import { PolyrhythmTap } from './games/PolyrhythmTap.js';
import { EarHeroQuest } from './games/EarHeroQuest.js';
import { MelodyMatrix } from './games/MelodyMatrix.js';

class HarmonixApp {
  constructor() {
    this.instances = {};
    this.activeTab = 'games'; // Start on the thrilling mini-games section first!
    this.initLanguageSelector();
    this.initAudioBanner();
    this.initNavigation();
    this.initGlobalControls();
    this.initLiveHud();
    this.switchTab('games');
  }

  initLanguageSelector() {
    const select = document.getElementById('languageSelect');
    if (!select) return;

    select.value = i18n.getLanguage();

    select.addEventListener('change', (e) => {
      i18n.setLanguage(e.target.value);
    });

    // Initial translation pass
    i18n.applyDomTranslations();
  }

  initAudioBanner() {
    const banner = document.getElementById('audioUnlockBanner');
    const unlockBtn = document.getElementById('btnUnlockAudio');

    const handleUnlock = async () => {
      await audioEngine.init();
      if (audioEngine.isUnlocked) {
        banner.classList.add('hidden');
        document.getElementById('audioStatusLed').classList.add('active');
        const statusText = document.getElementById('audioStatusText');
        if (statusText) {
          statusText.setAttribute('data-i18n', 'app.audioOnline');
          statusText.textContent = i18n.t('app.audioOnline');
        }
      }
    };

    if (unlockBtn) unlockBtn.addEventListener('click', handleUnlock);
    window.addEventListener('click', () => {
      if (!audioEngine.isUnlocked) handleUnlock();
    }, { once: true });
  }

  initNavigation() {
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        this.switchTab(tabId);
      });
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;

    // Update Tab Buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update Sections
    document.querySelectorAll('.tab-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `tab-${tabId}`);
    });

    // Lazy load/mount components for this tab
    this.mountTabComponents(tabId);
  }

  mountTabComponents(tabId) {
    const safeMount = (key, factory) => {
      if (!this.instances[key]) {
        try {
          this.instances[key] = factory();
        } catch (err) {
          console.error(`Error mounting component [${key}]:`, err);
        }
      }
    };

    if (tabId === 'physics') {
      safeMount('waveformLab', () => new WaveformLab('waveformLabContainer'));
      safeMount('harmonicSeries', () => new HarmonicSeries('harmonicSeriesContainer'));
      safeMount('consonanceGraph', () => new ConsonanceGraph('consonanceGraphContainer'));
    } else if (tabId === 'theory') {
      safeMount('modeExplorer', () => new ModeExplorer('modeExplorerContainer'));
      safeMount('circleOfFifths', () => new CircleOfFifths('circleOfFifthsContainer'));
      safeMount('globalTraditions', () => new GlobalTraditions('globalTraditionsContainer'));
      safeMount('tonnetzMatrix', () => new TonnetzMatrix('tonnetzMatrixContainer'));
    } else if (tabId === 'rhythm') {
      safeMount('euclideanSequencer', () => new EuclideanSequencer('euclideanContainer'));
      safeMount('polyrhythmOrbital', () => new PolyrhythmOrbital('polyrhythmContainer'));
      safeMount('worldGrooves', () => new WorldGrooves('worldGroovesContainer'));
    } else if (tabId === 'timbre') {
      safeMount('fourierLab', () => new FourierLab('fourierLabContainer'));
      safeMount('adsrLab', () => new AdsrLab('adsrLabContainer'));
    } else if (tabId === 'games') {
      safeMount('styleChameleon', () => new StyleChameleon('styleChameleonContainer'));
      safeMount('polyrhythmTap', () => new PolyrhythmTap('polyrhythmTapContainer'));
      safeMount('earHeroQuest', () => new EarHeroQuest('earHeroQuestContainer'));
      safeMount('melodyMatrix', () => new MelodyMatrix('melodyMatrixContainer'));
    }

    // Apply translations to freshly mounted components
    i18n.applyDomTranslations();
  }

  initGlobalControls() {
    const volSlider = document.getElementById('globalVolumeSlider');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        audioEngine.setVolume(parseFloat(e.target.value));
      });
    }

    // Modal guide dialog toggle
    const helpBtn = document.getElementById('btnOpenHelp');
    const helpModal = document.getElementById('helpModal');
    const closeHelpBtn = document.getElementById('btnCloseHelp');

    if (helpBtn && helpModal) {
      helpBtn.addEventListener('click', () => helpModal.classList.add('open'));
    }
    if (closeHelpBtn && helpModal) {
      closeHelpBtn.addEventListener('click', () => helpModal.classList.remove('open'));
    }
    if (helpModal) {
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) helpModal.classList.remove('open');
      });
    }
  }

  /**
   * Live Oscilloscope in the Top Nav Bar HUD
   */
  initLiveHud() {
    const canvas = document.getElementById('hudOscilloscopeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dataArray = new Uint8Array(256);

    const renderHud = () => {
      audioEngine.getWaveformData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#00f2fe';
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 4;
      ctx.beginPath();

      const sliceWidth = canvas.width / 256;
      let x = 0;

      for (let i = 0; i < 256; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;

      requestAnimationFrame(renderHud);
    };

    renderHud();
  }
}

// Bootstrap once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new HarmonixApp();
});
