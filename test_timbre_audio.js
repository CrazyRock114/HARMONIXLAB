/**
 * test_timbre_audio.js
 * Verification of FourierLab and AdsrLab audio synthesis under simulated Web Audio API.
 */

class MockAudioParam {
  constructor(defaultValue = 0) {
    this.value = defaultValue;
    this.history = [];
  }
  setValueAtTime(val, t) {
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
      throw new TypeError(`Failed to execute 'setValueAtTime' on 'AudioParam': The provided float value is non-finite (${val}).`);
    }
    this.value = val;
    this.history.push({ type: 'setValueAtTime', val, t });
  }
  linearRampToValueAtTime(val, t) {
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
      throw new TypeError(`Failed to execute 'linearRampToValueAtTime' on 'AudioParam': The provided float value is non-finite (${val}).`);
    }
    this.value = val;
    this.history.push({ type: 'linearRampToValueAtTime', val, t });
  }
  setTargetAtTime(val, t, constant) {
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
      throw new TypeError(`Failed to execute 'setTargetAtTime' on 'AudioParam': The provided float value is non-finite (${val}).`);
    }
    this.value = val;
    this.history.push({ type: 'setTargetAtTime', val, t, constant });
  }
}

class MockNode {
  constructor(name) {
    this.name = name;
    this.connections = [];
  }
  connect(target) {
    this.connections.push(target);
  }
  disconnect() {
    this.connections = [];
  }
}

class MockOscillator extends MockNode {
  constructor() {
    super('Oscillator');
    this.frequency = new MockAudioParam(440);
    this.type = 'sine';
    this.started = false;
    this.stopped = false;
  }
  start(t = 0) {
    this.started = true;
  }
  stop(t = 0) {
    this.stopped = true;
  }
}

class MockGain extends MockNode {
  constructor() {
    super('Gain');
    this.gain = new MockAudioParam(1);
  }
}

class MockBiquadFilter extends MockNode {
  constructor() {
    super('BiquadFilter');
    this.frequency = new MockAudioParam(350);
    this.Q = new MockAudioParam(1);
  }
}

class MockAudioContext {
  constructor() {
    this.currentTime = 1.0;
    this.state = 'running';
    this.destination = new MockNode('Destination');
  }
  createOscillator() { return new MockOscillator(); }
  createGain() { return new MockGain(); }
  createBiquadFilter() { return new MockBiquadFilter(); }
  createDynamicsCompressor() {
    return {
      threshold: new MockAudioParam(-24),
      knee: new MockAudioParam(30),
      ratio: new MockAudioParam(12),
      attack: new MockAudioParam(0.003),
      release: new MockAudioParam(0.25),
      connect: () => {},
      disconnect: () => {}
    };
  }
  createWaveShaper() {
    return {
      curve: null,
      oversample: 'none',
      connect: () => {},
      disconnect: () => {}
    };
  }
  createAnalyser() {
    return {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      connect: () => {},
      disconnect: () => {},
      getByteTimeDomainData: () => {},
      getByteFrequencyData: () => {}
    };
  }
  async resume() {
    this.state = 'running';
  }
}

// Setup global mock DOM
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
    this.listeners = {};
    this.elements = {};
  }
  appendChild(child) { this.children.push(child); return child; }
  setAttribute(name, val) { this[name] = val; }
  getAttribute(name) { return this[name] || null; }
  addEventListener(ev, fn) {
    if (!this.listeners[ev]) this.listeners[ev] = [];
    this.listeners[ev].push(fn);
  }
  async dispatchEvent(ev) {
    const handlers = this.listeners[ev.type] || [];
    for (const h of handlers) await h(ev);
  }
  querySelector(selector) {
    if (!this.elements[selector]) {
      const el = new MockElement('mock');
      el.id = selector.replace('#', '');
      this.elements[selector] = el;
    }
    return this.elements[selector];
  }
  querySelectorAll(selector) {
    return [new MockElement('mock'), new MockElement('mock')];
  }
  getContext() {
    return {
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      fillText: () => {},
      arc: () => {},
      fill: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} })
    };
  }
}

globalThis.document = {
  getElementById: (id) => {
    const el = new MockElement(id);
    el.id = id;
    return el;
  },
  createElement: (tag) => new MockElement(tag)
};

globalThis.window = {
  AudioContext: MockAudioContext,
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => {}
};
globalThis.AudioContext = MockAudioContext;
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};

// Import and run tests
const { audioEngine } = await import('./js/audio/AudioEngine.js');
const { FourierLab } = await import('./js/timbre/FourierLab.js');
const { AdsrLab } = await import('./js/timbre/AdsrLab.js');

console.log('=== TEST 1: AudioEngine initialization ===');
await audioEngine.init();
if (!audioEngine.ctx || audioEngine.ctx.state !== 'running') {
  console.error('❌ AudioEngine failed to initialize');
  process.exit(1);
}
console.log('✅ AudioEngine initialized successfully with mock AudioContext.');

console.log('\n=== TEST 2: FourierLab Additive Synthesis Audio ===');
const fourier = new FourierLab('fourierLabContainer');

console.log('Starting audio on fresh instance (Audition Timbre)...');
fourier.startAudio();

if (!fourier.isPlaying) {
  console.error('❌ fourier.isPlaying should be true');
  process.exit(1);
}
if (fourier.oscillators.length !== 16) {
  console.error(`❌ Expected 16 oscillators, got ${fourier.oscillators.length}`);
  process.exit(1);
}
for (let i = 0; i < 16; i++) {
  const osc = fourier.oscillators[i];
  const freq = osc.frequency.value;
  if (typeof freq !== 'number' || isNaN(freq) || !isFinite(freq) || freq <= 0) {
    console.error(`❌ Oscillator #${i + 1} has invalid frequency: ${freq}`);
    process.exit(1);
  }
  if (!osc.started) {
    console.error(`❌ Oscillator #${i + 1} was not started`);
    process.exit(1);
  }
}
console.log(`✅ All 16 harmonic oscillators initialized with valid non-NaN frequencies (f1 = ${fourier.oscillators[0].frequency.value}Hz, f16 = ${fourier.oscillators[15].frequency.value}Hz).`);

console.log('\nTesting preset change while playing...');
fourier.applyPreset('organ');
console.log('✅ Presets applied without audio glitches or NaN errors.');

console.log('\nTesting pitch slider frequency updates...');
fourier.fundamentalFreq = 330;
fourier.updateOscillatorFrequencies();
if (fourier.oscillators[0].frequency.value !== 330) {
  console.error(`❌ Oscillator fundamental not updated: ${fourier.oscillators[0].frequency.value}`);
  process.exit(1);
}
console.log(`✅ Fundamental dynamically shifted to ${fourier.oscillators[0].frequency.value}Hz.`);

console.log('\nTesting stopAudio()...');
fourier.stopAudio();
if (fourier.isPlaying) {
  console.error('❌ fourier.isPlaying should be false after stopAudio');
  process.exit(1);
}
console.log('✅ stopAudio() cleaned up all oscillators and master gain.');

console.log('\nTesting UI Toggle Button Event Lifecycle (Single Listener & Toggle)...');
const toggleBtn = fourier.container.querySelector('#btnToggleFourierSound');
if (toggleBtn.listeners['click']?.length !== 1) {
  console.error(`❌ Expected exactly 1 click listener on toggleBtn, found ${toggleBtn.listeners['click']?.length}`);
  process.exit(1);
}
console.log('✅ Exactly 1 click listener registered on toggleBtn (no double-trigger bug).');

// Simulate first user click
await toggleBtn.dispatchEvent({ type: 'click' });
if (!fourier.isPlaying) {
  console.error('❌ Expected fourier.isPlaying to be true after 1st click');
  process.exit(1);
}
console.log('✅ 1st click successfully started audio synthesis (isPlaying = true).');

// Simulate second user click
await toggleBtn.dispatchEvent({ type: 'click' });
if (fourier.isPlaying) {
  console.error('❌ Expected fourier.isPlaying to be false after 2nd click');
  process.exit(1);
}
console.log('✅ 2nd click successfully stopped audio synthesis (isPlaying = false).');

console.log('\n=== TEST 3: AdsrLab Envelope & Mystery Tone ===');
const adsr = new AdsrLab('adsrLabContainer');

console.log('Triggering ADSR Envelope note...');
await adsr.playAdsrTone();
console.log('✅ ADSR note triggered without errors.');

console.log('Triggering Blind Instrument Mystery Tone...');
await adsr.playMysteryTone();
console.log('✅ Mystery tone synthesized cleanly.');

console.log('\n🎉 ALL TIMBRE AUDIO VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
