/**
 * test_components.js
 * Comprehensive mounting test for all 16 interactive components across all 5 tabs.
 */

// Complete Mock browser DOM environment
class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.classList = {
      classes: new Set(),
      add: (c) => this.classList.classes.add(c),
      remove: (c) => this.classList.classes.delete(c),
      contains: (c) => this.classList.classes.has(c),
      toggle: (c, v) => v ? this.classList.classes.add(c) : this.classList.classes.delete(c)
    };
    this.style = {};
    this._innerHTML = '';
    this.textContent = '';
    this.width = 600;
    this.height = 400;
  }

  getAttribute(name) {
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      return this.dataset[key] || null;
    }
    return this[name] || null;
  }

  setAttribute(name, val) {
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      this.dataset[key] = val;
    }
    this[name] = val;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(html) {
    this._innerHTML = html;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(ev, fn) {}

  querySelector(selector) {
    const el = new MockElement('mock');
    el.id = selector.replace('#', '');
    return el;
  }

  querySelectorAll(selector) {
    return [new MockElement('mock'), new MockElement('mock'), new MockElement('mock')];
  }

  getContext(type) {
    return {
      clearRect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      rect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      fillText: () => {},
      strokeText: () => {},
      measureText: () => ({ width: 50 }),
      save: () => {},
      restore: () => {},
      setLineDash: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
      createLinearGradient: () => ({ addColorStop: () => {} })
    };
  }

  getBoundingClientRect() {
    return { left: 0, top: 0, width: 600, height: 400 };
  }
}

globalThis.document = {
  getElementById: (id) => {
    const el = new MockElement(id);
    el.id = id;
    return el;
  },
  createElement: (tag) => new MockElement(tag),
  querySelectorAll: () => []
};

globalThis.window = {
  addEventListener: () => {},
  requestAnimationFrame: (cb) => 1,
  cancelAnimationFrame: () => {}
};

globalThis.requestAnimationFrame = (cb) => 1;
globalThis.cancelAnimationFrame = () => {};

console.log('=== VERIFYING ALL 16 COMPONENTS ACROSS ALL 5 TABS ===\n');

const componentsToTest = [
  // Physics Tab
  { tab: 'physics', name: 'WaveformLab', path: './js/physics/WaveformLab.js', container: 'waveformLabContainer' },
  { tab: 'physics', name: 'HarmonicSeries', path: './js/physics/HarmonicSeries.js', container: 'harmonicSeriesContainer' },
  { tab: 'physics', name: 'ConsonanceGraph', path: './js/physics/ConsonanceGraph.js', container: 'consonanceGraphContainer' },
  
  // Theory Tab
  { tab: 'theory', name: 'ModeExplorer', path: './js/theory/ModeExplorer.js', container: 'modeExplorerContainer' },
  { tab: 'theory', name: 'CircleOfFifths', path: './js/theory/CircleOfFifths.js', container: 'circleOfFifthsContainer' },
  { tab: 'theory', name: 'GlobalTraditions', path: './js/theory/GlobalTraditions.js', container: 'globalTraditionsContainer' },
  { tab: 'theory', name: 'TonnetzMatrix', path: './js/theory/TonnetzMatrix.js', container: 'tonnetzMatrixContainer' },

  // Rhythm Tab
  { tab: 'rhythm', name: 'EuclideanSequencer', path: './js/rhythm/EuclideanSequencer.js', container: 'euclideanContainer' },
  { tab: 'rhythm', name: 'PolyrhythmOrbital', path: './js/rhythm/PolyrhythmOrbital.js', container: 'polyrhythmContainer' },
  { tab: 'rhythm', name: 'WorldGrooves', path: './js/rhythm/WorldGrooves.js', container: 'worldGroovesContainer' },

  // Timbre Tab
  { tab: 'timbre', name: 'FourierLab', path: './js/timbre/FourierLab.js', container: 'fourierLabContainer' },
  { tab: 'timbre', name: 'AdsrLab', path: './js/timbre/AdsrLab.js', container: 'adsrLabContainer' },

  // Games Tab
  { tab: 'games', name: 'StyleChameleon', path: './js/games/StyleChameleon.js', container: 'styleChameleonContainer' },
  { tab: 'games', name: 'PolyrhythmTap', path: './js/games/PolyrhythmTap.js', container: 'polyrhythmTapContainer' },
  { tab: 'games', name: 'EarHeroQuest', path: './js/games/EarHeroQuest.js', container: 'earHeroQuestContainer' },
  { tab: 'games', name: 'MelodyMatrix', path: './js/games/MelodyMatrix.js', container: 'melodyMatrixContainer' }
];

const instances = [];
let failed = 0;
for (const comp of componentsToTest) {
  try {
    const mod = await import(comp.path);
    const Cls = mod[comp.name];
    if (!Cls) throw new Error(`Export ${comp.name} not found in ${comp.path}`);
    const instance = new Cls(comp.container);
    instances.push({ name: comp.name, instance });
    console.log(`✅ [${comp.tab.toUpperCase()}] ${comp.name} mounted cleanly`);
  } catch (err) {
    console.error(`❌ [${comp.tab.toUpperCase()}] ${comp.name} FAILED:`, err);
    failed++;
  }
}

console.log(`\n========================================`);
console.log(`Total components tested: ${componentsToTest.length} | Failed: ${failed}`);
console.log(`========================================`);

console.log(`\n=== TESTING DYNAMIC LANGUAGE SWITCHING ACROSS ALL 8 LOCALES ===`);
const { i18n } = await import('./js/i18n/i18n.js');
const testLocales = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'it'];

for (const lang of testLocales) {
  try {
    i18n.setLanguage(lang);
    console.log(`✅ Successfully switched to [${lang}] - all ${instances.length} components updated without error.`);
  } catch (err) {
    console.error(`❌ Error switching to [${lang}]:`, err);
    failed++;
  }
}

if (failed > 0) process.exit(1);

