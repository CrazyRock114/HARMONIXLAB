/**
 * MobileLayoutManager.js
 * Specialized Mobile-Native Focused Cockpit Architecture for Harmonix Lab.
 *
 * Responsibilities:
 * 1. Sub-Lab Navigator (.mobile-subnav):
 *    On mobile, displays only the active sub-lab per tab, eliminating 4,000px vertical scrolling.
 * 2. Multi-Panel Segmented Switcher (.mobile-panel-switcher):
 *    For dual-panel labs (WaveformLab, AdsrLab), provides a clean segmented toggle between sub-experiments.
 * 3. Theory Accordion (.mobile-theory-card):
 *    Collapses long physical explanations into a 1-tap expandable card, keeping canvas and controls in 1 viewport.
 * 4. Automatic Desktop Restoration:
 *    When switched to Desktop mode or wide screens, immediately restores the full multi-column layout.
 */

import { i18n } from '../i18n/i18n.js';

export class MobileLayoutManager {
  constructor() {
    this.tabsConfig = {
      games: {
        containerIds: ['styleChameleonContainer', 'polyrhythmTapContainer', 'earHeroQuestContainer', 'melodyMatrixContainer'],
        i18nKeys: ['mobile.subLabStyle', 'mobile.subLabTap', 'mobile.subLabEar', 'mobile.subLabMatrix'],
        activeIndex: 0
      },
      physics: {
        containerIds: ['waveformLabContainer', 'harmonicSeriesContainer', 'consonanceGraphContainer'],
        i18nKeys: ['mobile.subLabWaveform', 'mobile.subLabHarmonics', 'mobile.subLabConsonance'],
        activeIndex: 0
      },
      theory: {
        containerIds: ['modeExplorerContainer', 'circleOfFifthsContainer', 'globalTraditionsContainer', 'tonnetzMatrixContainer'],
        i18nKeys: ['mobile.subLabModes', 'mobile.subLabCircle', 'mobile.subLabTraditions', 'mobile.subLabTonnetz'],
        activeIndex: 0
      },
      rhythm: {
        containerIds: ['euclideanContainer', 'polyrhythmContainer', 'worldGroovesContainer'],
        i18nKeys: ['mobile.subLabEuclidean', 'mobile.subLabOrbital', 'mobile.subLabGrooves'],
        activeIndex: 0
      },
      timbre: {
        containerIds: ['fourierLabContainer', 'adsrLabContainer'],
        i18nKeys: ['mobile.subLabFourier', 'mobile.subLabAdsr'],
        activeIndex: 0
      }
    };

    this.dualPanelConfig = [
      {
        containerId: 'waveformLabContainer',
        panelKeys: ['mobile.panelStanding', 'mobile.panelBeats'],
        activePanel: 0
      },
      {
        containerId: 'adsrLabContainer',
        panelKeys: ['mobile.panelAdsr', 'mobile.panelBlind'],
        activePanel: 0
      }
    ];

    this.currentTab = 'games';
    this.isMobile = false;

    this.init();
    if (typeof i18n.onLanguageChange === 'function') {
      this.unsubscribeI18n = i18n.onLanguageChange(() => this.updateLanguage());
    }
  }

  init() {
    this.createSubNavbars();
    this.setupDualPanelSwitchers();
    this.setupTheoryAccordions();
  }

  /**
   * Builds sticky horizontal subnav pills in each tab section
   */
  createSubNavbars() {
    for (const [tabId, conf] of Object.entries(this.tabsConfig)) {
      const section = document.getElementById(`tab-${tabId}`);
      if (!section) continue;

      let subnav = section.querySelector('.mobile-subnav');
      if (!subnav) {
        subnav = document.createElement('div');
        subnav.className = 'mobile-subnav';
        subnav.setAttribute('data-tab', tabId);

        const hero = section.querySelector('.tab-hero');
        if (hero && hero.nextSibling) {
          section.insertBefore(subnav, hero.nextSibling);
        } else {
          section.prepend(subnav);
        }
      }

      this.renderSubNavButtons(subnav, tabId, conf);
    }
  }

  renderSubNavButtons(subnav, tabId, conf) {
    subnav.innerHTML = conf.containerIds.map((cId, idx) => {
      const label = i18n.t(conf.i18nKeys[idx]);
      const isActive = conf.activeIndex === idx;
      return `
        <button class="mobile-subnav-btn ${isActive ? 'active' : ''}" 
                data-tab="${tabId}" 
                data-index="${idx}" 
                data-i18n="${conf.i18nKeys[idx]}">
          ${label}
        </button>
      `;
    }).join('');

    const btns = subnav.querySelectorAll('.mobile-subnav-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.index, 10);
        this.selectSubLab(tabId, idx);
      });
    });
  }

  /**
   * Switches active sub-lab in a tab on mobile
   */
  selectSubLab(tabId, index) {
    const conf = this.tabsConfig[tabId];
    if (!conf) return;
    conf.activeIndex = index;

    const section = document.getElementById(`tab-${tabId}`);
    if (!section) return;

    // Update subnav pill active classes
    const subnav = section.querySelector('.mobile-subnav');
    if (subnav) {
      const btns = subnav.querySelectorAll('.mobile-subnav-btn');
      btns.forEach((b, i) => b.classList.toggle('active', i === index));
      // Smooth scroll active button into view within the horizontal strip
      const activeBtn = btns[index];
      if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }

    if (this.isMobile) {
      // Hide all other sub-labs in this tab, show only selected
      conf.containerIds.forEach((cId, i) => {
        const el = document.getElementById(cId);
        if (el) {
          if (i === index) {
            el.style.display = 'block';
            el.classList.add('mobile-active-sublab');
          } else {
            el.style.display = 'none';
            el.classList.remove('mobile-active-sublab');
          }
        }
      });

      // Dispatch resize so canvases redraw with fresh bounding rects
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
      }
    }
  }

  /**
   * Sets up segmented tabs for dual-panel labs (WaveformLab, AdsrLab)
   */
  setupDualPanelSwitchers() {
    this.dualPanelConfig.forEach(cfg => {
      const container = document.getElementById(cfg.containerId);
      if (!container) return;

      const grid = container.querySelector('.lab-grid');
      if (!grid) return;

      const panels = grid.querySelectorAll('.panel');
      if (panels.length < 2) return;

      let switcher = container.querySelector('.mobile-panel-switcher');
      if (!switcher) {
        switcher = document.createElement('div');
        switcher.className = 'mobile-panel-switcher';
        grid.parentNode.insertBefore(switcher, grid);
      }

      this.renderDualPanelSwitcher(switcher, cfg, panels);
    });
  }

  renderDualPanelSwitcher(switcher, cfg, panels) {
    switcher.innerHTML = cfg.panelKeys.map((key, i) => {
      const label = i18n.t(key);
      const isActive = cfg.activePanel === i;
      return `
        <button class="mobile-switcher-btn ${isActive ? 'active' : ''}" 
                data-index="${i}" 
                data-i18n="${key}">
          ${label}
        </button>
      `;
    }).join('');

    const btns = switcher.querySelectorAll('.mobile-switcher-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        this.selectDualPanel(cfg, idx, panels, switcher);
      });
    });

    this.applyDualPanelVisibility(cfg, panels);
  }

  selectDualPanel(cfg, index, panels, switcher) {
    cfg.activePanel = index;
    const btns = switcher.querySelectorAll('.mobile-switcher-btn');
    btns.forEach((b, i) => b.classList.toggle('active', i === index));
    this.applyDualPanelVisibility(cfg, panels);

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
  }

  applyDualPanelVisibility(cfg, panels) {
    if (!this.isMobile) {
      // In desktop mode, show both panels
      panels.forEach(p => {
        p.style.display = '';
        p.classList.remove('mobile-panel-hidden');
      });
      return;
    }

    panels.forEach((p, idx) => {
      if (idx === cfg.activePanel) {
        p.style.display = 'block';
        p.classList.remove('mobile-panel-hidden');
      } else {
        p.style.display = 'none';
        p.classList.add('mobile-panel-hidden');
      }
    });
  }

  /**
   * Wraps theory callout cards in a collapsible accordion on mobile
   */
  setupTheoryAccordions() {
    const callouts = document.querySelectorAll('.theory-callout');
    callouts.forEach(callout => {
      if (callout.dataset.hasAccordion === 'true') return;
      callout.dataset.hasAccordion = 'true';
      callout.classList.add('mobile-collapsible');

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'mobile-theory-toggle btn btn-pill btn-sm';
      toggleBtn.innerHTML = `
        <span class="theory-toggle-icon">📖</span>
        <span class="theory-toggle-text" data-i18n="mobile.theoryTitle">${i18n.t('mobile.theoryTitle')}</span>
        <span class="theory-chevron">▾</span>
      `;

      toggleBtn.addEventListener('click', () => {
        const isOpen = callout.classList.toggle('mobile-open');
        toggleBtn.classList.toggle('active', isOpen);
        const textSpan = toggleBtn.querySelector('.theory-toggle-text');
        const chevron = toggleBtn.querySelector('.theory-chevron');
        if (isOpen) {
          textSpan.textContent = i18n.t('mobile.hideTheory');
          chevron.textContent = '▴';
        } else {
          textSpan.textContent = i18n.t('mobile.theoryTitle');
          chevron.textContent = '▾';
        }
      });

      callout.parentNode.insertBefore(toggleBtn, callout);
    });
  }

  /**
   * Called when active main tab changes
   */
  onTabChange(tabId) {
    this.currentTab = tabId;
    const conf = this.tabsConfig[tabId];
    if (conf) {
      this.selectSubLab(tabId, conf.activeIndex);
    }
  }

  /**
   * Called when screen mode changes between mobile and desktop
   */
  updateMobileState(isMobile) {
    this.isMobile = !!isMobile;

    // Apply or remove sub-lab visibility filtering
    for (const [tabId, conf] of Object.entries(this.tabsConfig)) {
      conf.containerIds.forEach((cId, i) => {
        const el = document.getElementById(cId);
        if (!el) return;
        if (this.isMobile) {
          el.style.display = (i === conf.activeIndex) ? 'block' : 'none';
        } else {
          el.style.display = '';
        }
      });
    }

    // Apply or remove dual-panel visibility filtering
    this.dualPanelConfig.forEach(cfg => {
      const container = document.getElementById(cfg.containerId);
      if (!container) return;
      const grid = container.querySelector('.lab-grid');
      const panels = grid ? grid.querySelectorAll('.panel') : container.querySelectorAll('.panel');
      this.applyDualPanelVisibility(cfg, panels);
    });

    // Reset theory accordion styles
    const callouts = document.querySelectorAll('.theory-callout');
    callouts.forEach(c => {
      if (!this.isMobile) {
        c.style.display = '';
      }
    });

    if (this.isMobile && this.tabsConfig[this.currentTab]) {
      this.selectSubLab(this.currentTab, this.tabsConfig[this.currentTab].activeIndex);
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
  }

  /**
   * Updates all dynamic text when user changes language
   */
  updateLanguage() {
    // Update subnav buttons
    for (const [tabId, conf] of Object.entries(this.tabsConfig)) {
      const section = document.getElementById(`tab-${tabId}`);
      if (!section) continue;
      const subnav = section.querySelector('.mobile-subnav');
      if (subnav) {
        this.renderSubNavButtons(subnav, tabId, conf);
      }
    }

    // Update dual panel switcher buttons
    this.dualPanelConfig.forEach(cfg => {
      const container = document.getElementById(cfg.containerId);
      if (!container) return;
      const switcher = container.querySelector('.mobile-panel-switcher');
      const panels = container.querySelectorAll('.lab-grid .panel');
      if (switcher && panels.length >= 2) {
        this.renderDualPanelSwitcher(switcher, cfg, panels);
      }
    });

    // Update theory toggle buttons
    const toggles = document.querySelectorAll('.mobile-theory-toggle');
    toggles.forEach(btn => {
      const callout = btn.nextElementSibling;
      const isOpen = callout && callout.classList.contains('mobile-open');
      const textSpan = btn.querySelector('.theory-toggle-text');
      if (textSpan) {
        textSpan.textContent = isOpen ? i18n.t('mobile.hideTheory') : i18n.t('mobile.theoryTitle');
      }
    });
  }

  destroy() {
    if (this.unsubscribeI18n) {
      this.unsubscribeI18n();
    }
  }
}
