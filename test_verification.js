/**
 * test_verification.js
 * Automated test suite for Harmonix Lab core mathematical and musical modules.
 */

import { TuningSystems } from './js/audio/TuningSystems.js';
import { ScalesData } from './js/audio/ScalesData.js';
import { EuclideanSequencer } from './js/rhythm/EuclideanSequencer.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('--- 1. Testing TuningSystems & Mathematical Calculations ---');
const a4Freq = TuningSystems.midiToFreq(69);
assert(Math.abs(a4Freq - 440.0) < 0.001, `A4 MIDI 69 produces exactly 440 Hz (got ${a4Freq})`);

const c4Freq = TuningSystems.midiToFreq(60);
assert(Math.abs(c4Freq - 261.625) < 0.01, `C4 MIDI 60 produces ~261.63 Hz (got ${c4Freq.toFixed(2)})`);

const fifthCents = TuningSystems.ratioToCents(3 / 2);
assert(Math.abs(fifthCents - 701.955) < 0.01, `Pure 3:2 fifth is ~701.96 cents (got ${fifthCents.toFixed(2)})`);

const comma = TuningSystems.getPythagoreanComma();
assert(Math.abs(comma.cents - 23.46) < 0.05, `Pythagorean Comma is ~23.46 cents (got ${comma.cents})`);

const harmonics = TuningSystems.getHarmonicSeries(100, 16);
assert(harmonics.length === 16, `Harmonic series generates 16 overtones`);
assert(harmonics[0].freq === 100, `First harmonic (fundamental) is 100 Hz`);
assert(harmonics[1].freq === 200, `Second harmonic (octave) is 200 Hz`);
assert(harmonics[2].freq === 300, `Third harmonic (fifth) is 300 Hz`);
assert(harmonics[3].freq === 400, `Fourth harmonic (double octave) is 400 Hz`);
assert(harmonics[4].freq === 500, `Fifth harmonic (major third) is 500 Hz`);

console.log('\n--- 2. Testing Bjorklund Euclidean Rhythms ---');
const tresillo = EuclideanSequencer.generateEuclidean(3, 8);
const tresilloPulses = tresillo.filter(p => p === 1).length;
assert(tresilloPulses === 3, `E(3, 8) has exactly 3 pulses`);
assert(tresillo.length === 8, `E(3, 8) has length 8`);

const cinquillo = EuclideanSequencer.generateEuclidean(5, 8);
const cinquilloPulses = cinquillo.filter(p => p === 1).length;
assert(cinquilloPulses === 5, `E(5, 8) has exactly 5 pulses`);
assert(cinquillo.length === 8, `E(5, 8) has length 8`);

const africanBell = EuclideanSequencer.generateEuclidean(7, 12);
const africanPulses = africanBell.filter(p => p === 1).length;
assert(africanPulses === 7, `E(7, 12) has exactly 7 pulses`);
assert(africanBell.length === 12, `E(7, 12) has length 12`);

console.log('\n--- 3. Testing ScalesData & Motifs ---');
assert(ScalesData.diatonicModes.length === 7, `7 Diatonic modes defined`);
assert(ScalesData.diatonicModes[0].name === 'Lydian', `Brightest mode is Lydian`);
assert(ScalesData.diatonicModes[6].name === 'Locrian', `Darkest mode is Locrian`);

assert(ScalesData.worldTraditions.length >= 6, `At least 6 world traditions defined (got ${ScalesData.worldTraditions.length})`);
assert(ScalesData.styles.length === 6, `6 Genre styles defined for Chameleon Jukebox`);

const odeNotes = ScalesData.motifs.odeToJoy.notes;
assert(odeNotes.length > 20, `Ode to Joy motif contains ${odeNotes.length} notes`);

console.log(`\n========================================`);
console.log(`Total tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);
