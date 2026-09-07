# Harmonix Lab 🪐🎵
### An Explorable Website for Interactive Music Theory, Acoustics Physics & Global Modes

Harmonix Lab is an interactive, visual, and experimental web application designed to teach music theory from first principles. Rather than relying on dry sheet music drills, Harmonix Lab bridges **acoustics physics**, **mathematical ratios**, **world cultural traditions**, and **real-time mini-games** where learners explore sound through direct manipulation.

---

## 🌟 Key Highlights & Interactive Features

### 1. 🎮 Interactive Mini-Games & Jukebox
* **The Chameleon Jukebox (Real-time Genre Re-Arranger)**:
  * Take famous melodic motifs (Beethoven's *Ode to Joy*, *Greensleeves*, Mozart's *Twinkle Variations*, Bach's *Minuet in G*) and re-arrange them in real time across **6 distinct genres**:
    1. **Classical / Baroque**: Harpsichord, violin, cello counterpoint, steady 4/4 pulse.
    2. **Modern Jazz / Bossa Nova**: Rhodes electric piano, syncopated bossa nova clave, walking bass, major 7th and 9th chord substitutions, subtle swing feel.
    3. **Cyberpunk / Synthwave**: Rolling 16th-note analog arp bass, 80s gated snare, lush saw pads, Phrygian minor tonality.
    4. **Traditional Chinese Silk & Bamboo (Sizhu)**: Real-time 5-tone pentatonic quantization, Karplus-Strong guzheng harp, bamboo dizi flute, peaceful rubato tempo.
    5. **Caribbean Reggae / Dub**: Off-beat guitar skank on beats 2 & 4, deep sub-bass line, tape delay echoes, one-drop drum beat.
    6. **Celtic Folk Jig**: Tin whistle, acoustic guitar strum, bodhran drum, lively compound 6/8 meter.
  * Switch styles seamlessly mid-playback with live multi-track mute/solo controls and an animated piano roll visualizer.
* **Polyrhythm Tap Hero**:
  * Two-handed rhythm coordination mini-game (Key `A` for Left Hand vs Key `L` for Right Hand, or on-screen touch pads).
  * Train your brain to feel complex polyrhythms (3:2 and 4:3) with real-time millisecond accuracy feedback (Perfect / Good / Miss) and combo multipliers.
* **Ear Hero & Lissajous Quest**:
  * Interval and chord ear training quest enhanced with physical wave clues.
  * Inspect real-time **Lissajous curve patterns** (where consonant intervals form clean loops and dissonant intervals form chaotic threads) to develop both visual and auditory intuition.
* **World Melody Matrix**:
  * 16-step intuitive step-sequencer and piano roll quantized to world scales (Chinese Gong, Japanese Hirajoshi, Arabic Hijaz, Indian Bhairav, Blues Hexatonic, Futuristic Lydian).
  * Eliminates "wrong notes" so every user can compose authentic melodies effortlessly.

---

### 2. 〰️ The Physics & Mathematics of Sound (Acoustics)
* **Vibrating String & Standing Waves**:
  * Animated physical string simulation illustrating Mersenne's laws, nodes, antinodes, and harmonic subdivisions ($n = 1, 2, 3, 4, 5$).
* **Wave Superposition & Acoustic Beats**:
  * Visualizes the algebraic addition of two sound waves: $y(t) = y_1(t) + y_2(t)$.
  * Detune two test tones (e.g. 440 Hz vs 444 Hz) to see and hear the periodic amplitude modulation at beat frequency $|f_1 - f_2| = 4\text{ Hz}$.
* **The Natural Harmonic Series Ladder**:
  * Interactive vertical overtone ladder ($n = 1$ to $16$).
  * Demonstrates how nature's physics embeds the **Major Triad (4:5:6)** directly into vibrating matter.
  * Displays exact frequency ratios, total cents, and microtonal deviations from 12-Tone Equal Temperament (e.g., 7th harmonic is 31¢ flat; 11th harmonic is 51¢ sharp).
* **The Pythagorean Comma Spiral**:
  * Interactive visual spiral demonstrating why 12 pure fifths $(3/2)^{12} \approx 129.746$ overshoot 7 pure octaves $2^7 = 128.000$ by $23.46\text{ cents}$.
  * Explains why human civilizations devised Equal Temperament (12-TET) by flattening each fifth by 1.95 cents to close the circle.
* **Consonance, Dissonance & Psychoacoustics**:
  * Interactive Helmholtz & Plomp-Levelt roughness curve visualizer.
  * Drag a test tone slider from unison ($1:1$) to octave ($2:1$) to hear sensory roughness peak near the minor 2nd ($16:15$) and fall into consonance valleys at pure harmonic ratios ($4:3$, $3:2$, $5:4$).

---

### 3. 🌈 Scales, Modes & The Geometry of Harmony
* **The 7 Diatonic Modes Brightness Spectrum**:
  * Explores the modes ordered by emotional brightness: **Lydian** (brightest, $+1\sharp$) $\to$ **Ionian** $\to$ **Mixolydian** $\to$ **Dorian** $\to$ **Aeolian** $\to$ **Phrygian** $\to$ **Locrian** (darkest, $-5\flat$).
  * **Parallel Mode Switcher**: Hear the drastic emotional transformation when switching the tonic note C across all 7 modes with identical melodies.
  * Interactive 1-octave modal piano keyboard with color-coded scale degrees.
* **Interactive Circle of Fifths**:
  * Dynamic circular SVG/Canvas harmonic clock displaying key signatures, relative minors, dominant ($V$), and subdominant ($IV$) relationships.
  * Geometric chord polygon overlay: shows how chords form equilateral triangles (Augmented), squares (Diminished 7th), and triangles (Major/Minor) in 12-TET space.
* **World Musical Traditions & Microtones**:
  * **China**: 5-Tone Pentatonic (Gong, Shang, Jiao, Zhi, Yu) and the 2,500-year-old *Sanfen Sunyi* (三分损益) string ratio formula.
  * **India**: 7 Svaras (Sa, Re, Ga, Ma, Pa, Dha, Ni), 10 Thaats, Raga Bhairav & Yaman, and the 22-Shruti microtonal system.
  * **Middle East**: Arabic Maqam system (Bayati, Hijaz) using 24-TET quarter-tones (50¢ and 150¢ half-flats).
  * **Japan**: Traditional Hirajoshi and Insen scales with the aesthetic of *Ma* (間, negative space).
  * **West Africa & American Blues**: Microtonal blue notes and expressive bends.
* **Euler's Tonnetz (Tone Lattice)**:
  * 2D geometric network connecting pitches along fifths, major thirds, and minor thirds.
  * Clickable triangles represent Major and Minor triads.
  * Interactive $P$ (Parallel), $L$ (Leading-Tone), and $R$ (Relative) Neo-Riemannian chord flips.

---

### 4. 🥁 Rhythm, Polyrhythm & Euclidean Geometry
* **Circular Euclidean Rhythm Machine**:
  * Implementation of Godfried Toussaint's Bjorklund algorithm $E(k, n)$.
  * Multi-ring rotating sequencer with synthesized percussion (kick, clave, hi-hat) and world rhythm presets:
    * Cuban Tresillo $E(3, 8)$
    * Cinquillo $E(5, 8)$
    * West African Bell $E(7, 12)$
    * Bossa Nova Clave $E(5, 16)$
    * Bulgarian Ruchenitsa $E(7, 8)$
* **Celestial Polyrhythm Orbitals**:
  * Concentric orbital rings demonstrating polyrhythms (3:2, 4:3, 5:4, 7:4) with colliding satellites and audio triggers.
* **World Grooves & The Science of Swing**:
  * Interactive microtiming slider demonstrating how straight $50\% : 50\%$ subdivisions morph into $66\%$ triplet shuffle and $72\%$ hard bebop swing.
  * Library of world grooves: Cuban Son Clave (3:2 and 2:3), Bossa Nova, Flamenco 12-beat Soleá compás, and Balkan odd meters ($7/8$ Kalamatianos and $11/8$ Kopanitsa).

---

### 5. 🎛️ Timbre, Acoustic Modeling & Harmonics
* **Additive Fourier Synthesizer**:
  * 16 vertical harmonic drawbars ($A_1$ to $A_{16}$) with live multi-oscillator synthesis and real-time time-domain waveform rendering.
  * Presets for Flute (sine), Clarinet (odd harmonics only), Violin/Brass (sawtooth $1/k$), and Organ.
* **ADSR Envelope Sculptor & The Blind Instrument Experiment**:
  * Interactive Attack, Decay, Sustain, Release shaper.
  * Psychoacoustic challenge: test whether your ears can distinguish a **Violin** from a **Trumpet** when the first 50 milliseconds of attack transient are removed!

---

## 💻 Tech Stack & Architecture

- **Zero Heavy Dependencies**: Pure modern web standards (HTML5, ES6 Modules, Canvas 2D, Web Audio API, Modern CSS Glassmorphism).
- **Pure Algorithmic Audio Synthesis**: No external audio sample files! All instruments (Karplus-Strong physical plucked string for Guzheng/Guitar, 2-Operator FM Rhodes, breath-filtered Flute, bowed Sawtooth Violin, analog Bass, and 808/Acoustic Drums) are synthesized in real time via code.
- **Microtonal Precision**: Native frequency ratio calculation supporting 12-TET, 24-TET quarter-tones, Just Intonation, and Pythagorean tuning.
- **60 FPS Responsive Visualizations**: Canvas and SVG graphics optimized for fluid animations.

---

## 🚀 Getting Started

### 1. Launch with Node.js
```bash
node server.js
```
Open your browser at:
```
http://localhost:3000
```

### 2. Run Automated Verification Tests
```bash
node test_verification.js
```

### 3. Alternative: Any Local HTTP Server
```bash
python3 -m http.server 8080
# or
npx serve .
```
Or simply open `index.html` in any modern web browser that supports ES Modules.

---

## 📚 Educational References & Inspiration
1. **Bartosz Ciechanowski**: Interactive physics essays (*Sound*, *Color Spaces*, *Mechanical Watch*).
2. **Godfried Toussaint** (2005): *The Euclidean Algorithm Generates Traditional Musical Rhythms*.
3. **Leonhard Euler** (1739): *Tentamen novae theoriae musicae* (The Tonnetz lattice).
4. **Hermann von Helmholtz** (1863) & **Plomp & Levelt** (1965): *Tonal Consonance and Critical Bandwidth*.
5. **Guan Zhong / Guanzi** (7th Century BCE): *Sanfen Sunyi* (三分损益法, Generating the 12 Lü).
