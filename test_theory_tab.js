/**
 * test_theory_tab.js
 * Simulates mounting ModeExplorer, CircleOfFifths, GlobalTraditions, and TonnetzMatrix.
 */

// Mock browser DOM environment
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
    // Return a dummy mock element so calls like .textContent don't fail
    return new MockElement('mock');
  }

  querySelectorAll(selector) {
    return [new MockElement('mock'), new MockElement('mock')];
  }

  getContext(type) {
    return {
      clearRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      fillText: () => {},
      strokeText: () => {},
      save: () => {},
      restore: () => {},
      setLineDash: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
      createLinearGradient: () => ({ addColorStop: () => {} })
    };
  }

  getBoundingClientRect() {
    return { left: 0, top: 0, width: 400, height: 400 };
  }
}

globalThis.document = {
  getElementById: (id) => new MockElement(id),
  createElement: (tag) => new MockElement(tag),
  querySelectorAll: () => []
};

globalThis.window = {
  addEventListener: () => {},
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => {}
};

console.log('--- Testing Theory Tab Components Mounting ---');

try {
  const { ModeExplorer } = await import('./js/theory/ModeExplorer.js');
  const me = new ModeExplorer('modeExplorerContainer');
  console.log('✅ ModeExplorer instantiated successfully! Modes count:', me.modes.length);
} catch (e) {
  console.error('❌ ModeExplorer failed:', e);
  process.exit(1);
}

try {
  const { CircleOfFifths } = await import('./js/theory/CircleOfFifths.js');
  const cof = new CircleOfFifths('circleOfFifthsContainer');
  console.log('✅ CircleOfFifths instantiated successfully! Keys count:', cof.keys.length);
} catch (e) {
  console.error('❌ CircleOfFifths failed:', e);
  process.exit(1);
}

try {
  const { GlobalTraditions } = await import('./js/theory/GlobalTraditions.js');
  const gt = new GlobalTraditions('globalTraditionsContainer');
  console.log('✅ GlobalTraditions instantiated successfully! Traditions count:', gt.traditions.length);
} catch (e) {
  console.error('❌ GlobalTraditions failed:', e);
  process.exit(1);
}

try {
  const { TonnetzMatrix } = await import('./js/theory/TonnetzMatrix.js');
  const tm = new TonnetzMatrix('tonnetzMatrixContainer');
  console.log('✅ TonnetzMatrix instantiated successfully! Chord:', tm.activeChord.name);
} catch (e) {
  console.error('❌ TonnetzMatrix failed:', e);
  process.exit(1);
}

console.log('\n🎉 ALL 4 THEORY COMPONENTS MOUNTED WITH ZERO ERRORS!');
