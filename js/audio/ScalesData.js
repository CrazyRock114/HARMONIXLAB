/**
 * ScalesData.js
 * Comprehensive encyclopedia of scales, modes, intervals, and song motifs across global musical traditions.
 */

export const ScalesData = {
  // Western Diatonic Modes (arranged by Brightness Spectrum: Lydian = brightest -> Locrian = darkest)
  diatonicModes: [
    {
      id: 'lydian',
      name: 'Lydian',
      brightness: 1, // Brightest
      intervals: [0, 2, 4, 6, 7, 9, 11], // 1 2 3 #4 5 6 7
      formula: '1 - 2 - 3 - #4 - 5 - 6 - 7',
      characteristic: '#4 (Augmented 4th)',
      mood: 'Floating, ethereal, mystical, futuristic, wonder (e.g. E.T., The Simpsons)',
      famousExamples: ['The Simpsons Theme', 'E.T. Flying Theme (John Williams)', 'Soundgarden - Pretty Noose'],
      color: '#38bdf8'
    },
    {
      id: 'ionian',
      name: 'Ionian (Major)',
      brightness: 2,
      intervals: [0, 2, 4, 5, 7, 9, 11], // 1 2 3 4 5 6 7
      formula: '1 - 2 - 3 - 4 - 5 - 6 - 7',
      characteristic: 'Natural 4 & 7',
      mood: 'Bright, resolved, triumphant, peaceful, foundational',
      famousExamples: ['Ode to Joy', 'Twinkle Twinkle Little Star', 'The Beatles - Let It Be'],
      color: '#4ade80'
    },
    {
      id: 'mixolydian',
      name: 'Mixolydian',
      brightness: 3,
      intervals: [0, 2, 4, 5, 7, 9, 10], // 1 2 3 4 5 6 b7
      formula: '1 - 2 - 3 - 4 - 5 - 6 - b7',
      characteristic: 'b7 (Flat 7th with Major 3rd)',
      mood: 'Bluesy, heroic yet relaxed, Celtic folk, southern rock',
      famousExamples: ['Guns N\' Roses - Sweet Child O\' Mine', 'Beatles - Norwegian Wood', 'Lord of the Rings Shire themes'],
      color: '#facc15'
    },
    {
      id: 'dorian',
      name: 'Dorian',
      brightness: 4, // Center / Balanced Minor
      intervals: [0, 2, 3, 5, 7, 9, 10], // 1 2 b3 4 5 6 b7
      formula: '1 - 2 - b3 - 4 - 5 - 6 - b7',
      characteristic: 'Major 6th in a Minor scale',
      mood: 'Soulful, contemplative, hopeful melancholy, medieval ballad',
      famousExamples: ['Miles Davis - So What', 'Scarborough Fair', 'Daft Punk - Get Lucky', 'Pink Floyd - Breathe'],
      color: '#fb923c'
    },
    {
      id: 'aeolian',
      name: 'Aeolian (Natural Minor)',
      brightness: 5,
      intervals: [0, 2, 3, 5, 7, 8, 10], // 1 2 b3 4 5 b6 b7
      formula: '1 - 2 - b3 - 4 - 5 - b6 - b7',
      characteristic: 'b6 & b7',
      mood: 'Sad, serious, dramatic, emotional, cinematic',
      famousExamples: ['R.E.M. - Losing My Religion', 'Game of Thrones Theme', 'Billie Eilish - Bad Guy'],
      color: '#a855f7'
    },
    {
      id: 'phrygian',
      name: 'Phrygian',
      brightness: 6,
      intervals: [0, 1, 3, 5, 7, 8, 10], // 1 b2 b3 4 5 b6 b7
      formula: '1 - b2 - b3 - 4 - 5 - b6 - b7',
      characteristic: 'b2 (Minor 2nd)',
      mood: 'Dark, tense, exotic, Spanish/Flamenco, aggressive heavy metal',
      famousExamples: ['Flamenco Por Arriba', 'Metallica - Wherever I May Roam', 'Howard Shore - Mordor Theme'],
      color: '#ec4899'
    },
    {
      id: 'locrian',
      name: 'Locrian',
      brightness: 7, // Darkest
      intervals: [0, 1, 3, 5, 6, 8, 10], // 1 b2 b3 4 b5 b6 b7
      formula: '1 - b2 - b3 - 4 - b5 - b6 - b7',
      characteristic: 'b5 (Diminished 5th / Tritone root)',
      mood: 'Extremely unstable, ominous, unresolved, dissonant nightmare',
      famousExamples: ['Rush - YYZ (intro riff)', 'Björk - Army of Me', 'Judas Priest - Painkiller'],
      color: '#f43f5e'
    }
  ],

  // World Musical Systems and Regional Scales
  worldTraditions: [
    {
      id: 'chinese_gong',
      name: 'Chinese Pentatonic (Gong Mode / 宫调)',
      region: 'East Asia / China',
      culture: 'Traditional Chinese Silk & Bamboo (Sizhu) & Court Music',
      intervals: [0, 2, 4, 7, 9], // C D E G A
      noteNames: ['Gong (宫)', 'Shang (商)', 'Jiao (角)', 'Zhi (徵)', 'Yu (羽)'],
      theory: 'Formed via "Sanfen Sunyi" (三分损益, adding & subtracting 1/3 string length), generating pure fifths (3:2) over 2,500 years ago.',
      color: '#f59e0b',
      instruments: ['Guzheng', 'Pipa', 'Dizi Bamboo Flute', 'Erhu'],
      mood: 'Serene, natural, poetic, free-flowing'
    },
    {
      id: 'chinese_yu',
      name: 'Chinese Pentatonic (Yu Mode / 羽调)',
      region: 'East Asia / China',
      culture: 'Traditional Chinese Minor Pentatonic',
      intervals: [0, 3, 5, 7, 10], // A C D E G relative
      noteNames: ['Yu (羽)', 'Gong (宫)', 'Shang (商)', 'Jiao (角)', 'Zhi (徵)'],
      theory: 'The melancholy, reflective mode of ancient Chinese poetry and nature lamentation.',
      color: '#d97706',
      instruments: ['Guqin', 'Xiao Flute', 'Yangqin'],
      mood: 'Reflective, nostalgic, misty river'
    },
    {
      id: 'indian_bhairav',
      name: 'Indian Raga Bhairav (भैरव)',
      region: 'South Asia / North India',
      culture: 'Hindustani Classical Tradition',
      intervals: [0, 1, 4, 5, 7, 8, 11], // Sa, komal Re, shuddha Ga, Ma, Pa, komal Dha, shuddha Ni
      svaras: ['Sa', 're (komal)', 'Ga', 'Ma', 'Pa', 'dha (komal)', 'Ni'],
      theory: 'Early morning Raga embodying solemn majesty, peace, and spiritual awakening. Uses subtle microtonal slides (meend) across the 22 Shrutis.',
      color: '#e11d48',
      instruments: ['Sitar', 'Sarod', 'Tanpura Drone', 'Tabla'],
      mood: 'Devotional, grand, meditative dawn'
    },
    {
      id: 'indian_yaman',
      name: 'Indian Raga Yaman (यमन)',
      region: 'South Asia / North India',
      culture: 'Hindustani Evening Raga (Kalyan Thaat)',
      intervals: [0, 2, 4, 6, 7, 9, 11], // Sa Re Ga teevra Ma Pa Dha Ni (Lydian-like)
      svaras: ['Sa', 'Re', 'Ga', 'Ma (teevra)', 'Pa', 'Dha', 'Ni'],
      theory: 'Sung at twilight as lamps are lit. The teevra Ma (#4) creates a warm, shimmering luminescence.',
      color: '#0284c7',
      instruments: ['Bansuri Flute', 'Sitar', 'Harmonium'],
      mood: 'Romantic, serene, illuminated dusk'
    },
    {
      id: 'arabic_hijaz',
      name: 'Arabic Maqam Hijaz (مقام حجاز)',
      region: 'Middle East / Levant / North Africa',
      culture: 'Arabic & Ottoman Classical Tradition',
      intervals: [0, 1, 4, 5, 7, 8, 10], // 1 b2 3 4 5 b6 b7 (Phrygian Dominant)
      theory: 'Features an augmented second interval between scale degrees 2 and 3 (3 semitones), creating deep emotional gravity and passionate longing (Tarab).',
      color: '#ea580c',
      instruments: ['Oud', 'Ney Flute', 'Qanun', 'Riq Tambourine'],
      mood: 'Passionate, majestic, dramatic, yearning'
    },
    {
      id: 'arabic_bayati',
      name: 'Arabic Maqam Bayati (مقام بياتي)',
      region: 'Middle East / Persia',
      culture: 'Microtonal Quarter-Tone Tradition',
      intervals: [0, 1.5, 3, 5, 7, 8, 10], // Degree 2 is a half-flat (3/4 tone, 150 cents)
      theory: 'Divides the octave into 24 quarter-tones. The 2nd note (E-half-flat) sits halfway between minor and major, yielding a bittersweet expression impossible in 12-TET.',
      color: '#c026d3',
      instruments: ['Oud', 'Kemenche', 'Darbuka'],
      mood: 'Bittersweet, soulful, hypnotic, timeless'
    },
    {
      id: 'japanese_hirajoshi',
      name: 'Japanese Hirajoshi (平調子)',
      region: 'Japan',
      culture: 'Koto & Shamisen Tradition (Edo Period)',
      intervals: [0, 2, 3, 7, 8], // 1 2 b3 5 b6 (pentatonic without 4 or 7)
      theory: 'Asymmetrical intervals (M2, m2, P4, m2, M3) creating intense negative space (Ma, 間) and tension between adjacent half-steps.',
      color: '#4f46e5',
      instruments: ['Koto Harp', 'Shakuhachi Flute', 'Shamisen', 'Taiko'],
      mood: 'Zen-like, stark, disciplined beauty, autumn leaves'
    },
    {
      id: 'japanese_insen',
      name: 'Japanese Insen (陰旋)',
      region: 'Japan',
      culture: 'Traditional Gagaku & Folk Music',
      intervals: [0, 1, 5, 7, 10], // 1 b2 4 5 b7
      theory: 'Dark folk scale characterized by the minor 2nd step and wide 4th jump.',
      color: '#059669',
      instruments: ['Shakuhachi', 'Biwa', 'Shinobue'],
      mood: 'Shadowy, austere, moonlit bamboo forest'
    },
    {
      id: 'blues_hexatonic',
      name: 'African-American Blues Scale',
      region: 'North America / West African Roots',
      culture: 'Blues, Jazz, Rock & Soul',
      intervals: [0, 3, 5, 6, 7, 10], // 1 b3 4 b5 5 b7
      theory: 'The "blue note" (b5 / tritone) bends fluidly against the major triad harmony beneath it, resolving heartbreak into resilience.',
      color: '#2563eb',
      instruments: ['Electric Guitar', 'Harmonica', 'Hammond Organ', 'Upright Bass'],
      mood: 'Gritty, cathartic, defiant, deeply emotional'
    },
    {
      id: 'flamenco_gypsy',
      name: 'Flamenco / Spanish Gypsy Scale',
      region: 'Southern Spain / Andalusia / Romani',
      culture: 'Flamenco Cante Jondo',
      intervals: [0, 1, 4, 5, 7, 8, 10], // 1 b2 3 4 5 b6 b7
      theory: 'Drives the Spanish Phrygian cadence (Am - G - F - E). The major 3rd on the tonic alongside the minor 2nd defines Andalusian passion.',
      color: '#dc2626',
      instruments: ['Flamenco Guitar', 'Palmas (Handclaps)', 'Cajón'],
      mood: 'Fiery, proud, tragic, explosive'
    }
  ],

  // Famous melodic motifs pre-arranged for the Style Chameleon Mini-Game
  motifs: {
    odeToJoy: {
      id: 'odeToJoy',
      title: 'Ode to Joy (Beethoven)',
      composer: 'Ludwig van Beethoven (Symphony No. 9)',
      key: 'C',
      rootMidi: 60, // C4
      // Sequence: pitch (semitones from root), duration in 16th notes (4 = quarter note)
      notes: [
        { step: 4, dur: 4 }, { step: 4, dur: 4 }, { step: 5, dur: 4 }, { step: 7, dur: 4 },
        { step: 7, dur: 4 }, { step: 5, dur: 4 }, { step: 4, dur: 4 }, { step: 2, dur: 4 },
        { step: 0, dur: 4 }, { step: 0, dur: 4 }, { step: 2, dur: 4 }, { step: 4, dur: 4 },
        { step: 4, dur: 6 }, { step: 2, dur: 2 }, { step: 2, dur: 8 },

        { step: 4, dur: 4 }, { step: 4, dur: 4 }, { step: 5, dur: 4 }, { step: 7, dur: 4 },
        { step: 7, dur: 4 }, { step: 5, dur: 4 }, { step: 4, dur: 4 }, { step: 2, dur: 4 },
        { step: 0, dur: 4 }, { step: 0, dur: 4 }, { step: 2, dur: 4 }, { step: 4, dur: 4 },
        { step: 2, dur: 6 }, { step: 0, dur: 2 }, { step: 0, dur: 8 }
      ]
    },
    greensleeves: {
      id: 'greensleeves',
      title: 'Greensleeves (Traditional)',
      composer: '16th Century English Folk Ballad',
      key: 'A Minor / Dorian',
      rootMidi: 57, // A3
      notes: [
        { step: 0, dur: 4 }, { step: 3, dur: 8 }, { step: 5, dur: 4 }, { step: 7, dur: 6 }, { step: 8, dur: 2 }, { step: 7, dur: 4 },
        { step: 5, dur: 8 }, { step: 2, dur: 4 }, { step: 0, dur: 6 }, { step: -2, dur: 2 }, { step: 0, dur: 4 },
        { step: 2, dur: 8 }, { step: 3, dur: 4 }, { step: 0, dur: 12 }
      ]
    },
    twinkle: {
      id: 'twinkle',
      title: 'Twinkle Variations (Mozart / Folk)',
      composer: 'Traditional / W.A. Mozart KV 265',
      key: 'C',
      rootMidi: 60,
      notes: [
        { step: 0, dur: 4 }, { step: 0, dur: 4 }, { step: 7, dur: 4 }, { step: 7, dur: 4 },
        { step: 9, dur: 4 }, { step: 9, dur: 4 }, { step: 7, dur: 8 },
        { step: 5, dur: 4 }, { step: 5, dur: 4 }, { step: 4, dur: 4 }, { step: 4, dur: 4 },
        { step: 2, dur: 4 }, { step: 2, dur: 4 }, { step: 0, dur: 8 }
      ]
    },
    bachMinuet: {
      id: 'bachMinuet',
      title: 'Minuet in G (Petzold / Bach)',
      composer: 'Christian Petzold (Notebook for Anna Magdalena)',
      key: 'G',
      rootMidi: 55, // G3
      notes: [
        { step: 7, dur: 4 }, { step: 0, dur: 2 }, { step: 2, dur: 2 }, { step: 4, dur: 2 }, { step: 5, dur: 2 },
        { step: 7, dur: 4 }, { step: 0, dur: 4 }, { step: 0, dur: 4 },
        { step: 9, dur: 4 }, { step: 4, dur: 2 }, { step: 5, dur: 2 }, { step: 7, dur: 2 }, { step: 9, dur: 2 },
        { step: 11, dur: 4 }, { step: 0, dur: 4 }, { step: 0, dur: 4 }
      ]
    }
  },

  // The 6 Genre Styles for the Chameleon Jukebox Mini-Game
  styles: [
    {
      id: 'classical',
      name: 'Classical / Baroque',
      icon: '🎻',
      bpm: 108,
      meter: '4/4',
      scaleId: 'ionian',
      instruments: {
        lead: 'violin',
        chords: 'harpsichord',
        bass: 'cello',
        drums: 'none'
      },
      swing: 0,
      grooveDesc: 'Structured Alberti bass & steady pulse with elegant ornaments'
    },
    {
      id: 'jazz_bossa',
      name: 'Jazz / Bossa Nova',
      icon: '🎷',
      bpm: 124,
      meter: '4/4',
      scaleId: 'dorian',
      instruments: {
        lead: 'flute',
        chords: 'rhodes',
        bass: 'uprightBass',
        drums: 'bossaDrums'
      },
      swing: 0.25,
      grooveDesc: 'Syncopated Bossa Nova clave with rich major 7th and 9th chord substitutions'
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk / Synthwave',
      icon: '⚡',
      bpm: 130,
      meter: '4/4',
      scaleId: 'phrygian',
      instruments: {
        lead: 'leadSynth',
        chords: 'retroPad',
        bass: 'arpBass',
        drums: 'synth808'
      },
      swing: 0,
      grooveDesc: '16th-note rolling analog bassline, 80s gated snare, and dark Phrygian tension'
    },
    {
      id: 'sizhu',
      name: 'Silk & Bamboo (Chinese)',
      icon: '🪕',
      bpm: 76,
      meter: 'Free / 4/4',
      scaleId: 'chinese_gong',
      instruments: {
        lead: 'dizi',
        chords: 'guzheng',
        bass: 'erhuDrone',
        drums: 'woodblock'
      },
      swing: 0,
      grooveDesc: 'Pure 5-tone pentatonic quantization with expressive Karplus-Strong string plucks'
    },
    {
      id: 'reggae_dub',
      name: 'Caribbean Reggae / Dub',
      icon: '🌴',
      bpm: 74,
      meter: '4/4',
      scaleId: 'mixolydian',
      instruments: {
        lead: 'organ',
        chords: 'guitarSkank',
        bass: 'subDubBass',
        drums: 'oneDropDrums'
      },
      swing: 0.15,
      grooveDesc: 'Off-beat chord skanks on beats 2 & 4, deep sine sub-bass, and tape delay echoes'
    },
    {
      id: 'celtic_jig',
      name: 'Celtic Folk Jig',
      icon: '☘️',
      bpm: 136,
      meter: '6/8',
      scaleId: 'mixolydian',
      instruments: {
        lead: 'tinWhistle',
        chords: 'acousticGuitar',
        bass: 'droneBass',
        drums: 'bodhran'
      },
      swing: 0,
      grooveDesc: 'Lively compound 6/8 triplet rhythm with bagpipe drone accompaniment'
    }
  ]
};
