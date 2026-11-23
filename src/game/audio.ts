import { BiomeKind, GamePhase } from './types';

export type MusicTheme =
  | 'title'
  | 'jungle'
  | 'desert'
  | 'ice'
  | 'volcanic'
  | 'nebula'
  | 'paris'
  | 'rapids'
  | 'rocket'
  | 'boss';

interface ThemeArrangement {
  bpm: number;
  chords: number[][]; // 4 bars, MIDI note arrays
  bass: (number | null)[]; // 16 steps per bar (64 steps total, or 32 looped)
  arp: (number | null)[]; // 32-step pattern
  lead: (number | null)[]; // 64-step melody
  leadWave: OscillatorType;
  leadFilterHz: number;
  padWave: OscillatorType;
  bassWave: OscillatorType;
  drumStyle: 'soft' | 'jungle' | 'desert' | 'ice' | 'volcanic' | 'nebula' | 'paris' | 'rapids' | 'rocket' | 'boss';
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// 64-step (4 bars x 16 sixteenth notes) procedural arrangements per biome/mode
const ARRANGEMENTS: Record<MusicTheme, ThemeArrangement> = {
  // "Órbita Nova" — Cosmic Lydian synth-pop at 112 BPM
  title: {
    bpm: 112,
    chords: [
      [60, 64, 67, 71, 74], // Cmaj9
      [57, 60, 64, 67, 71], // Am9
      [53, 57, 60, 64, 69], // Fmaj9
      [55, 59, 62, 64, 67], // G6
    ],
    bass: [
      36, null, null, 36, null, null, 43, null, 36, null, 48, null, 43, null, 40, null,
      33, null, null, 33, null, null, 40, null, 33, null, 45, null, 40, null, 38, null,
      29, null, null, 29, null, null, 36, null, 29, null, 41, null, 36, null, 35, null,
      31, null, null, 31, null, null, 38, null, 31, null, 43, null, 38, null, 43, null,
    ],
    arp: [
      72, 76, 79, 83, 79, 76, 84, 79, 72, 76, 79, 83, 86, 83, 79, 76,
      69, 72, 76, 79, 76, 72, 81, 76, 71, 74, 79, 83, 79, 74, 83, 79,
    ],
    lead: [
      76, null, null, 79, null, null, 83, null, 84, null, 83, null, 79, null, null, null,
      72, null, null, 76, null, null, 79, null, 76, null, null, null, null, null, null, null,
      77, null, null, 76, null, null, 72, null, 74, null, 76, null, 79, null, null, null,
      74, null, null, 71, null, null, 74, null, 79, null, null, null, null, null, null, null,
    ],
    leadWave: 'triangle',
    leadFilterHz: 2400,
    padWave: 'sine',
    bassWave: 'triangle',
    drumStyle: 'soft',
  },

  // "Selva Esmeralda" — Playful tropical synth marimba & funk bass at 122 BPM
  jungle: {
    bpm: 122,
    chords: [
      [65, 69, 72, 76], // Fmaj7
      [62, 65, 69, 72], // Dm7
      [58, 62, 65, 69], // Bbmaj7
      [60, 65, 67, 70], // C7sus4
    ],
    bass: [
      41, null, 41, null, 48, null, 53, null, 41, null, 45, 48, null, 53, null, 48,
      38, null, 38, null, 45, null, 50, null, 38, null, 41, 45, null, 50, null, 45,
      34, null, 34, null, 41, null, 46, null, 34, null, 38, 41, null, 46, null, 41,
      36, null, 36, null, 43, null, 48, null, 36, null, 43, null, 48, null, 52, null,
    ],
    arp: [
      77, null, 81, 84, null, 81, 88, null, 77, null, 81, 84, 89, null, 84, null,
      74, null, 77, 81, null, 77, 84, null, 70, null, 74, 77, 82, null, 77, null,
    ],
    lead: [
      77, null, 81, null, 84, null, null, 81, 84, null, 86, null, 84, null, 81, null,
      74, null, 77, null, 81, null, null, 77, 81, null, 79, null, 77, null, null, null,
      70, null, 74, null, 77, null, 81, null, 82, null, 81, null, 77, null, 74, null,
      76, null, 79, null, 84, null, 82, null, 79, null, 76, null, 72, null, null, null,
    ],
    leadWave: 'triangle',
    leadFilterHz: 3000,
    padWave: 'triangle',
    bassWave: 'sawtooth',
    drumStyle: 'jungle',
  },

  // "Dunas Solares" — Adventurous desert galactic groove at 124 BPM (D Phrygian Dominant)
  desert: {
    bpm: 124,
    chords: [
      [62, 66, 69, 72], // D7
      [63, 67, 70, 74], // Ebmaj7
      [60, 63, 67, 70], // Cm7
      [62, 66, 69, 73], // Dmaj7/Phrygian
    ],
    bass: [
      38, 38, null, 38, 45, null, 38, null, 38, null, 45, null, 50, null, 45, null,
      39, 39, null, 39, 46, null, 39, null, 39, null, 46, null, 51, null, 46, null,
      36, 36, null, 36, 43, null, 36, null, 36, null, 43, null, 48, null, 43, null,
      38, 38, null, 38, 45, null, 46, null, 45, null, 43, null, 42, null, 39, null,
    ],
    arp: [
      74, 78, 81, 86, 81, 78, 74, 81, 75, 79, 82, 87, 82, 79, 75, 82,
      72, 75, 79, 84, 79, 75, 72, 79, 74, 78, 81, 85, 81, 78, 74, 81,
    ],
    lead: [
      74, null, null, 75, 78, null, 79, null, 81, null, 79, null, 78, null, 75, null,
      74, null, 75, null, 78, null, null, null, 79, null, 75, null, 74, null, null, null,
      72, null, null, 74, 75, null, 79, null, 78, null, 75, null, 74, null, 72, null,
      74, null, 78, null, 81, null, 82, null, 81, null, 78, null, 74, null, null, null,
    ],
    leadWave: 'sawtooth',
    leadFilterHz: 1850,
    padWave: 'sawtooth',
    bassWave: 'sawtooth',
    drumStyle: 'desert',
  },

  // "Glaciar Aurora" — Crystalline aurora chimes & shimmering pads at 118 BPM
  ice: {
    bpm: 118,
    chords: [
      [64, 67, 71, 74, 78], // Em9
      [60, 64, 67, 71, 76], // Cmaj7
      [62, 66, 69, 71, 74], // D6
      [59, 62, 66, 69, 74], // Bm7
    ],
    bass: [
      40, null, null, 40, null, 47, null, 52, 40, null, null, 47, null, 52, 47, null,
      36, null, null, 36, null, 43, null, 48, 36, null, null, 43, null, 48, 43, null,
      38, null, null, 38, null, 45, null, 50, 38, null, null, 45, null, 50, 45, null,
      35, null, null, 35, null, 42, null, 47, 35, null, null, 42, null, 47, 42, null,
    ],
    arp: [
      76, 79, 83, 88, 83, 79, 90, 83, 72, 76, 79, 84, 79, 76, 83, 79,
      74, 78, 81, 86, 81, 78, 83, 78, 71, 74, 78, 83, 78, 74, 81, 78,
    ],
    lead: [
      83, null, null, 86, null, null, 88, null, 90, null, 88, null, 83, null, null, null,
      79, null, null, 83, null, null, 84, null, 83, null, null, null, 79, null, null, null,
      78, null, null, 81, null, null, 83, null, 86, null, 83, null, 81, null, null, null,
      79, null, null, 78, null, null, 74, null, 76, null, null, null, null, null, null, null,
    ],
    leadWave: 'sine',
    leadFilterHz: 4200,
    padWave: 'sine',
    bassWave: 'triangle',
    drumStyle: 'ice',
  },

  // "Cañón Volcánico" — Driving volcanic synth-rock in E Phrygian at 132 BPM
  volcanic: {
    bpm: 132,
    chords: [
      [52, 59, 64, 67], // Em5/Em
      [53, 60, 65, 69], // Fmaj
      [55, 62, 67, 71], // G
      [53, 57, 60, 64], // Fmaj7
    ],
    bass: [
      28, 28, 40, 28, 28, 40, 28, 35, 28, 28, 40, 28, 31, 33, 35, 28,
      29, 29, 41, 29, 29, 41, 29, 36, 29, 29, 41, 29, 33, 36, 38, 41,
      31, 31, 43, 31, 31, 43, 31, 38, 31, 31, 43, 31, 35, 38, 40, 43,
      29, 29, 41, 29, 28, 40, 28, 35, 29, 29, 41, 29, 40, 38, 36, 35,
    ],
    arp: [
      76, 79, 83, 88, 83, 79, 76, 83, 77, 81, 84, 89, 84, 81, 77, 84,
      79, 83, 86, 91, 86, 83, 79, 86, 77, 81, 83, 88, 83, 81, 77, 76,
    ],
    lead: [
      76, null, 77, null, 79, null, 83, null, 84, null, 83, null, 79, null, 77, null,
      76, null, 72, null, 74, null, 76, null, 77, null, 76, null, 74, null, null, null,
      79, null, 83, null, 86, null, 84, null, 83, null, 79, null, 77, null, 76, null,
      77, null, 76, null, 74, null, 72, null, 71, null, 76, null, null, null, null, null,
    ],
    leadWave: 'sawtooth',
    leadFilterHz: 2200,
    padWave: 'sawtooth',
    bassWave: 'sawtooth',
    drumStyle: 'volcanic',
  },

  // "Ciudadela Nebulosa" — Soaring cosmic synthwave in C# minor at 128 BPM
  nebula: {
    bpm: 128,
    chords: [
      [61, 64, 68, 73], // C#m
      [57, 61, 64, 69], // A
      [59, 63, 66, 71], // B
      [56, 61, 64, 68], // G#m7
    ],
    bass: [
      37, null, 37, 49, 37, null, 44, null, 37, null, 37, 49, 44, null, 49, null,
      33, null, 33, 45, 33, null, 40, null, 33, null, 33, 45, 40, null, 45, null,
      35, null, 35, 47, 35, null, 42, null, 35, null, 35, 47, 42, null, 47, null,
      32, null, 32, 44, 32, null, 39, null, 32, null, 35, 39, 44, null, 47, null,
    ],
    arp: [
      73, 76, 80, 85, 80, 76, 85, 80, 69, 73, 76, 81, 76, 73, 81, 76,
      71, 75, 78, 83, 78, 75, 83, 78, 68, 73, 76, 80, 76, 73, 80, 76,
    ],
    lead: [
      80, null, null, 83, 85, null, 88, null, 87, null, 85, null, 83, null, 80, null,
      81, null, null, 80, 76, null, 80, null, 83, null, null, null, null, null, null, null,
      83, null, null, 85, 87, null, 90, null, 88, null, 87, null, 85, null, 83, null,
      80, null, 83, null, 85, null, 80, null, 76, null, null, null, null, null, null, null,
    ],
    leadWave: 'triangle',
    leadFilterHz: 3200,
    padWave: 'sawtooth',
    bassWave: 'sawtooth',
    drumStyle: 'nebula',
  },

  // "Propulsión Estelar" — High-energy Astro Rocket overdrive at 136 BPM
  rocket: {
    bpm: 136,
    chords: [
      [57, 60, 64, 69], // Am
      [53, 57, 60, 65], // F
      [60, 64, 67, 72], // C
      [55, 59, 62, 67], // G
    ],
    bass: [
      33, 45, 33, 45, 33, 45, 33, 45, 33, 45, 33, 45, 33, 45, 36, 48,
      29, 41, 29, 41, 29, 41, 29, 41, 29, 41, 29, 41, 29, 41, 31, 43,
      36, 48, 36, 48, 36, 48, 36, 48, 36, 48, 36, 48, 36, 48, 38, 50,
      31, 43, 31, 43, 31, 43, 31, 43, 31, 43, 35, 47, 38, 50, 40, 52,
    ],
    arp: [
      69, 72, 76, 81, 76, 72, 81, 76, 65, 69, 72, 77, 72, 69, 77, 72,
      72, 76, 79, 84, 79, 76, 84, 79, 67, 71, 74, 79, 74, 71, 79, 74,
    ],
    lead: [
      81, null, 81, null, 84, null, 88, null, 86, null, 84, null, 81, null, 79, null,
      77, null, 77, null, 81, null, 84, null, 81, null, 79, null, 77, null, null, null,
      84, null, 84, null, 88, null, 91, null, 89, null, 88, null, 84, null, 83, null,
      79, null, 83, null, 86, null, 88, null, 86, null, 83, null, 79, null, null, null,
    ],
    leadWave: 'square',
    leadFilterHz: 2600,
    padWave: 'sawtooth',
    bassWave: 'sawtooth',
    drumStyle: 'rocket',
  },

  // "Titán Kraxus" — Epic high-tempo Boss Battle at 142 BPM (D minor heroic showdown)
  boss: {
    bpm: 142,
    chords: [
      [50, 57, 62, 65], // Dm
      [58, 62, 65, 70], // Bb
      [55, 58, 62, 67], // Gm
      [57, 61, 64, 69], // A7
    ],
    bass: [
      26, 38, 26, 38, 26, 38, 26, 38, 26, 38, 26, 38, 29, 41, 31, 43,
      34, 46, 34, 46, 34, 46, 34, 46, 34, 46, 34, 46, 33, 45, 31, 43,
      31, 43, 31, 43, 31, 43, 31, 43, 31, 43, 31, 43, 34, 46, 36, 48,
      33, 45, 33, 45, 33, 45, 33, 45, 37, 49, 38, 50, 40, 52, 43, 55,
    ],
    arp: [
      74, 77, 81, 86, 81, 77, 86, 81, 70, 74, 77, 82, 77, 74, 82, 77,
      67, 70, 74, 79, 74, 70, 79, 74, 69, 73, 76, 81, 76, 73, 81, 76,
    ],
    lead: [
      74, null, 74, 77, 81, null, 86, null, 85, null, 81, null, 79, null, 77, null,
      74, null, 77, null, 82, null, 81, null, 79, null, 77, null, 74, null, null, null,
      79, null, 79, 82, 86, null, 91, null, 89, null, 86, null, 84, null, 82, null,
      81, null, 85, null, 88, null, 89, null, 88, null, 85, null, 81, null, null, null,
    ],
    leadWave: 'sawtooth',
    leadFilterHz: 2800,
    padWave: 'sawtooth',
    bassWave: 'sawtooth',
    drumStyle: 'boss',
  },

  // "Cielos de París" — Breezy sunlit Parisian sky accordion-synth pop in G major at 120 BPM
  paris: {
    bpm: 120,
    chords: [
      [67, 71, 74, 78], // Gmaj7
      [64, 67, 71, 74], // Em7
      [60, 64, 67, 71], // Cmaj7
      [62, 66, 69, 72], // D7
    ],
    bass: [
      43, null, null, 43, 50, null, 43, null, 43, null, 47, null, 50, null, 47, null,
      40, null, null, 40, 47, null, 40, null, 40, null, 43, null, 47, null, 43, null,
      36, null, null, 36, 43, null, 36, null, 36, null, 40, null, 43, null, 40, null,
      38, null, null, 38, 45, null, 38, null, 38, null, 42, null, 45, null, 48, null,
    ],
    arp: [
      79, 83, 86, 83, 79, 83, 91, 86, 76, 79, 83, 79, 76, 79, 88, 83,
      72, 76, 79, 76, 72, 76, 84, 79, 74, 78, 81, 78, 74, 78, 86, 81,
    ],
    lead: [
      79, null, 83, null, 86, null, null, 83, 84, null, 83, null, 79, null, 78, null,
      76, null, 79, null, 83, null, null, 79, 76, null, null, null, null, null, null, null,
      72, null, 76, null, 79, null, 83, null, 84, null, 83, null, 79, null, 76, null,
      78, null, 81, null, 86, null, 84, null, 83, null, 81, null, 79, null, null, null,
    ],
    leadWave: 'triangle',
    leadFilterHz: 3200,
    padWave: 'sine',
    bassWave: 'triangle',
    drumStyle: 'paris',
  },

  // "Rápidos del Río Bravo" — Energetic canyon whitewater adventure groove in A minor at 132 BPM
  rapids: {
    bpm: 132,
    chords: [
      [57, 60, 64, 67], // Am7
      [53, 57, 60, 64], // Fmaj7
      [55, 59, 62, 67], // G6
      [52, 55, 59, 64], // Em7
    ],
    bass: [
      33, 33, null, 40, 45, null, 33, null, 33, null, 40, null, 45, null, 40, null,
      29, 29, null, 36, 41, null, 29, null, 29, null, 36, null, 41, null, 36, null,
      31, 31, null, 38, 43, null, 31, null, 31, null, 38, null, 43, null, 38, null,
      28, 28, null, 35, 40, null, 28, null, 35, null, 38, null, 40, null, 43, null,
    ],
    arp: [
      81, null, 84, 88, 84, null, 93, 88, 77, null, 81, 84, 81, null, 89, 84,
      79, null, 83, 86, 83, null, 91, 86, 76, null, 79, 83, 79, null, 88, 83,
    ],
    lead: [
      81, null, 84, null, 88, null, 86, null, 84, null, 81, null, 79, null, null, null,
      77, null, 81, null, 84, null, 83, null, 81, null, 79, null, 77, null, null, null,
      79, null, 83, null, 86, null, 88, null, 86, null, 83, null, 79, null, null, null,
      76, null, 79, null, 83, null, 84, null, 83, null, 79, null, 76, null, null, null,
    ],
    leadWave: 'sawtooth',
    leadFilterHz: 2500,
    padWave: 'triangle',
    bassWave: 'sawtooth',
    drumStyle: 'rapids',
  },
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private muted = false;
  private musicMuted = false;

  // Hover continuous synth nodes
  private hoverOscA: OscillatorNode | null = null;
  private hoverOscB: OscillatorNode | null = null;
  private hoverNoise: AudioBufferSourceNode | null = null;
  private hoverGain: GainNode | null = null;

  private coinCombo = 0;
  private lastCoinTime = 0;
  private lastFootstepTime = 0;

  // Lookahead Soundtrack Sequencer State
  private currentTheme: MusicTheme = 'title';
  private currentPhase: GamePhase = 'title';
  private schedulerId: number | null = null;
  private stepIndex = 0;
  private nextNoteTime = 0;

  private ensureCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-14, ctx.currentTime);
        compressor.knee.setValueAtTime(18, ctx.currentTime);
        compressor.ratio.setValueAtTime(6, ctx.currentTime);
        compressor.attack.setValueAtTime(0.004, ctx.currentTime);
        compressor.release.setValueAtTime(0.18, ctx.currentTime);

        const master = ctx.createGain();
        master.gain.setValueAtTime(this.muted ? 0 : 0.88, ctx.currentTime);

        const sfx = ctx.createGain();
        sfx.gain.setValueAtTime(0.95, ctx.currentTime);

        const music = ctx.createGain();
        music.gain.setValueAtTime(this.computeTargetMusicGain(), ctx.currentTime);

        sfx.connect(compressor);
        music.connect(compressor);
        compressor.connect(master);
        master.connect(ctx.destination);

        // Pre-bake 1.5s white noise buffer for percussion, whooshes, jets & impacts
        const sampleRate = ctx.sampleRate;
        const length = Math.floor(sampleRate * 1.5);
        const buf = ctx.createBuffer(1, length, sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < length; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        this.ctx = ctx;
        this.masterGain = master;
        this.sfxBus = sfx;
        this.musicBus = music;
        this.noiseBuffer = buf;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getSfxDest(): AudioNode | null {
    if (this.muted) return null;
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxBus) return null;
    return this.sfxBus;
  }

  private computeTargetMusicGain(): number {
    if (this.muted || this.musicMuted) return 0;
    if (this.currentPhase === 'victory' || this.currentPhase === 'gameover') return 0;
    if (this.currentPhase === 'paused') return 0.11;
    if (this.currentPhase === 'title') return 0.22;
    return this.currentTheme === 'rocket' ? 0.36 : 0.32;
  }

  private updateMusicBusGain() {
    if (!this.ctx || !this.musicBus) return;
    const target = this.computeTargetMusicGain();
    this.musicBus.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
  }

  public unlock() {
    const ctx = this.ensureCtx();
    if (ctx && this.schedulerId === null) {
      this.startSequencer();
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stopHover();
    }
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.88, this.ctx.currentTime, 0.03);
    }
    this.updateMusicBusGain();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMusicMuted(musicMuted: boolean) {
    this.musicMuted = musicMuted;
    this.updateMusicBusGain();
  }

  public isMusicMuted(): boolean {
    return this.musicMuted;
  }

  public setMusicContext(biome: BiomeKind, isRocket: boolean, phase: GamePhase, isBoss = false) {
    const biomeTheme: MusicTheme = biome === 'temple' ? 'jungle' : biome;
    const nextTheme: MusicTheme =
      phase === 'title' ? 'title' : isBoss ? 'boss' : isRocket ? 'rocket' : biomeTheme;
    const themeChanged = nextTheme !== this.currentTheme;
    this.currentTheme = nextTheme;
    this.currentPhase = phase;

    if (themeChanged) {
      this.stepIndex = 0;
    }
    this.updateMusicBusGain();

    if (this.ctx && this.schedulerId === null) {
      this.startSequencer();
    }
  }

  // ==================== PROCEDURAL SOUNDTRACK SEQUENCER ====================

  private startSequencer() {
    if (this.schedulerId !== null || typeof window === 'undefined') return;
    if (!this.ctx) return;

    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.schedulerId = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      if (this.muted || this.musicMuted) {
        this.nextNoteTime = this.ctx.currentTime + 0.05;
        return;
      }
      if (this.currentPhase === 'victory' || this.currentPhase === 'gameover') {
        this.nextNoteTime = this.ctx.currentTime + 0.05;
        return;
      }

      // Guard against tab-backgrounding catch-up bursts
      if (this.nextNoteTime < this.ctx.currentTime - 0.25) {
        this.nextNoteTime = this.ctx.currentTime + 0.05;
      }

      const lookahead = 0.14;
      while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
        const arr = ARRANGEMENTS[this.currentTheme];
        const stepDuration = 60 / arr.bpm / 4; // 16th note duration
        this.scheduleStep(this.stepIndex, this.nextNoteTime, stepDuration, arr);
        this.nextNoteTime += stepDuration;
        this.stepIndex = (this.stepIndex + 1) % 64;
      }
    }, 25);
  }

  public stopMusic() {
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
  }

  private scheduleStep(step: number, time: number, stepDur: number, arr: ThemeArrangement) {
    if (!this.ctx || !this.musicBus) return;
    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;

    // 1. Warm Pad Chord on beat 1 of every bar
    if (stepInBar === 0) {
      const chord = arr.chords[bar % arr.chords.length];
      this.playMusicPad(chord, time, stepDur * 15.2, arr.padWave);
    }

    // 2. Bassline
    const bassMidi = arr.bass[step % arr.bass.length];
    if (bassMidi !== null) {
      this.playMusicBass(midiToFreq(bassMidi), time, stepDur * 1.45, arr.bassWave);
    }

    // 3. Arpeggio sparkle
    const arpMidi = arr.arp[step % arr.arp.length];
    if (arpMidi !== null) {
      this.playMusicArp(midiToFreq(arpMidi), time, stepDur * 0.9, this.currentTheme === 'ice');
    }

    // 4. Main Lead Melody
    const leadMidi = arr.lead[step % arr.lead.length];
    if (leadMidi !== null) {
      // Look ahead for note length
      let holdSteps = 1;
      while (
        step + holdSteps < arr.lead.length &&
        arr.lead[step + holdSteps] === null &&
        holdSteps < 4
      ) {
        holdSteps++;
      }
      this.playMusicLead(
        midiToFreq(leadMidi),
        time,
        stepDur * holdSteps * 0.92,
        arr.leadWave,
        arr.leadFilterHz
      );
    }

    // 5. Percussion Groove
    this.scheduleDrumStep(stepInBar, time, arr.drumStyle);
  }

  private playMusicPad(notes: number[], time: number, dur: number, wave: OscillatorType) {
    if (!this.ctx || !this.musicBus) return;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1150, time);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(0.11 / Math.max(1, notes.length * 0.55), time + 0.12);
    env.gain.setValueAtTime(0.09 / Math.max(1, notes.length * 0.55), time + dur * 0.72);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    filter.connect(env).connect(this.musicBus);

    for (const midi of notes) {
      const osc = this.ctx.createOscillator();
      osc.type = wave;
      osc.frequency.setValueAtTime(midiToFreq(midi), time);
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + dur + 0.03);
    }
  }

  private playMusicBass(freq: number, time: number, dur: number, wave: OscillatorType) {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(wave === 'sawtooth' ? 920 : 650, time);
    filter.frequency.exponentialRampToValueAtTime(220, time + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.24, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0008, time + dur);

    osc.connect(filter).connect(gain).connect(this.musicBus);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  private playMusicArp(freq: number, time: number, dur: number, crystalline: boolean) {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    osc.type = crystalline ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.085, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0005, time + dur);

    osc.connect(gain).connect(this.musicBus);
    osc.start(time);
    osc.stop(time + dur + 0.02);

    if (crystalline) {
      const overtone = this.ctx.createOscillator();
      const oGain = this.ctx.createGain();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 2, time);
      oGain.gain.setValueAtTime(0.03, time);
      oGain.gain.exponentialRampToValueAtTime(0.0004, time + dur * 0.7);
      overtone.connect(oGain).connect(this.musicBus);
      overtone.start(time);
      overtone.stop(time + dur + 0.02);
    }
  }

  private playMusicLead(
    freq: number,
    time: number,
    dur: number,
    wave: OscillatorType,
    filterHz: number
  ) {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, time);

    // Slight chorus detune twin voice for lush Astro Bot lead warmth
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.0035, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterHz, time);
    filter.frequency.exponentialRampToValueAtTime(filterHz * 0.55, time + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.14, time + 0.015);
    gain.gain.setValueAtTime(0.11, time + dur * 0.65);
    gain.gain.exponentialRampToValueAtTime(0.0008, time + dur);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain).connect(this.musicBus);

    osc.start(time);
    osc2.start(time);
    osc.stop(time + dur + 0.03);
    osc2.stop(time + dur + 0.03);
  }

  private scheduleDrumStep(
    stepInBar: number,
    time: number,
    style: ThemeArrangement['drumStyle']
  ) {
    if (!this.ctx || !this.musicBus) return;

    // Kick pattern
    const kickHits =
      style === 'rocket' || style === 'boss' || style === 'volcanic' || style === 'rapids'
        ? stepInBar % 4 === 0 || (style === 'boss' && stepInBar === 14)
        : style === 'desert' || style === 'nebula'
          ? stepInBar === 0 || stepInBar === 6 || stepInBar === 8 || stepInBar === 14
          : style === 'jungle' || style === 'paris'
            ? stepInBar === 0 || stepInBar === 3 || stepInBar === 8 || stepInBar === 11
            : stepInBar === 0 || stepInBar === 8;

    if (kickHits) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(style === 'rocket' || style === 'boss' ? 148 : 120, time);
      osc.frequency.exponentialRampToValueAtTime(42, time + 0.09);
      const peak = style === 'soft' ? 0.16 : style === 'boss' ? 0.32 : 0.28;
      gain.gain.setValueAtTime(peak, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(gain).connect(this.musicBus);
      osc.start(time);
      osc.stop(time + 0.13);
    }

    // Snare / Clap on 4 & 12 (or jungle syncopated rim)
    const snareHit =
      style === 'jungle'
        ? stepInBar === 4 || stepInBar === 12 || stepInBar === 14
        : stepInBar === 4 || stepInBar === 12;

    if (snareHit && this.noiseBuffer && style !== 'soft') {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(style === 'ice' || style === 'nebula' ? 2800 : 1850, time);
      bp.Q.setValueAtTime(1.2, time);
      const gain = this.ctx.createGain();
      const peak = style === 'rocket' || style === 'boss' ? 0.17 : 0.11;
      gain.gain.setValueAtTime(peak, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + (style === 'rocket' || style === 'boss' ? 0.12 : 0.08));
      noise.connect(bp).connect(gain).connect(this.musicBus);
      noise.start(time);
      noise.stop(time + 0.14);
    }

    // Desert / Jungle / Volcanic melodic tom accents
    if ((style === 'jungle' || style === 'desert' || style === 'volcanic') && (stepInBar === 6 || stepInBar === 10)) {
      const tom = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      tom.type = 'triangle';
      const startF = stepInBar === 6 ? 195 : 155;
      tom.frequency.setValueAtTime(startF, time);
      tom.frequency.exponentialRampToValueAtTime(startF * 0.55, time + 0.09);
      gain.gain.setValueAtTime(0.11, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      tom.connect(gain).connect(this.musicBus);
      tom.start(time);
      tom.stop(time + 0.11);
    }

    // Crisp Hi-hat on off-beats / 16ths
    const hatHit =
      style === 'rocket' || style === 'boss' || style === 'nebula'
        ? stepInBar % 2 === 0 || stepInBar === 15
        : style === 'soft'
          ? stepInBar % 4 === 2
          : stepInBar % 2 === 1 || stepInBar % 4 === 0;

    if (hatHit && this.noiseBuffer) {
      const hat = this.ctx.createBufferSource();
      hat.buffer = this.noiseBuffer;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(6800, time);
      const gain = this.ctx.createGain();
      const open = style === 'rocket' && stepInBar % 4 === 2;
      gain.gain.setValueAtTime(style === 'soft' ? 0.035 : 0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.0005, time + (open ? 0.075 : 0.032));
      hat.connect(hp).connect(gain).connect(this.musicBus);
      hat.start(time);
      hat.stop(time + 0.09);
    }
  }

  // ==================== UPGRADED SOUND EFFECTS (SFX) ====================

  private playNoiseBurst(
    now: number,
    duration: number,
    filterType: BiquadFilterType,
    freqStart: number,
    freqEnd: number,
    volume: number,
    q = 1.0
  ) {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.Q.setValueAtTime(q, now);
    filter.frequency.setValueAtTime(freqStart, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    src.connect(filter).connect(gain).connect(dest);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  public playJump() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Layer 1: Buoyant Astro chirp
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(215, now);
    osc.frequency.exponentialRampToValueAtTime(690, now + 0.13);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain).connect(dest);
    osc.start(now);
    osc.stop(now + 0.17);

    // Layer 2: Harmonic overtone sparkle
    const shimmer = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(480, now + 0.01);
    shimmer.frequency.exponentialRampToValueAtTime(1180, now + 0.14);
    sGain.gain.setValueAtTime(0.11, now + 0.01);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    shimmer.connect(sGain).connect(dest);
    shimmer.start(now + 0.01);
    shimmer.stop(now + 0.16);

    // Layer 3: Crisp air-pop transient
    this.playNoiseBurst(now, 0.06, 'bandpass', 1400, 3200, 0.12, 1.4);
  }

  public playLand(impactSpeed = 8) {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;
    const intensity = Math.min(1, Math.max(0.3, impactSpeed / 16));

    // Soft robotic boot thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.08);
    gain.gain.setValueAtTime(0.18 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain).connect(dest);
    osc.start(now);
    osc.stop(now + 0.1);

    // Micro-servo boot click
    this.playNoiseBurst(now, 0.045, 'lowpass', 950, 260, 0.12 * intensity);
  }

  public playFootstep(onIce = false) {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastFootstepTime < 0.18) return;
    this.lastFootstepTime = now;

    if (onIce) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1450 + Math.random() * 220, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.035);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain).connect(dest);
      osc.start(now);
      osc.stop(now + 0.045);
    } else {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(185 + Math.random() * 35, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.035);
      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain).connect(dest);
      osc.start(now);
      osc.stop(now + 0.045);
    }
  }

  public startHover() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx || this.hoverOscA) return;
    const now = this.ctx.currentTime;

    const oscA = this.ctx.createOscillator();
    const oscB = this.ctx.createOscillator();
    oscA.type = 'sawtooth';
    oscB.type = 'triangle';
    oscA.frequency.setValueAtTime(155, now);
    oscB.frequency.setValueAtTime(312, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(780, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.06);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain).connect(dest);

    oscA.start(now);
    oscB.start(now);

    if (this.noiseBuffer) {
      const nSrc = this.ctx.createBufferSource();
      nSrc.buffer = this.noiseBuffer;
      nSrc.loop = true;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1400, now);
      bp.Q.setValueAtTime(1.5, now);
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.45, now);
      nSrc.connect(bp).connect(nGain).connect(gain);
      nSrc.start(now);
      this.hoverNoise = nSrc;
    }

    this.hoverOscA = oscA;
    this.hoverOscB = oscB;
    this.hoverGain = gain;
  }

  public stopHover() {
    if (!this.hoverGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      this.hoverGain.gain.cancelScheduledValues(now);
      this.hoverGain.gain.setValueAtTime(Math.max(0.001, this.hoverGain.gain.value), now);
      this.hoverGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      this.hoverOscA?.stop(now + 0.07);
      this.hoverOscB?.stop(now + 0.07);
      this.hoverNoise?.stop(now + 0.07);
    } catch {
      // Ignore already stopped oscillators
    }
    this.hoverOscA = null;
    this.hoverOscB = null;
    this.hoverNoise = null;
    this.hoverGain = null;
  }

  public playSpin() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Cyclone whistle sweep
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.24);
    osc2.frequency.setValueAtTime(640, now);
    osc2.frequency.exponentialRampToValueAtTime(320, now + 0.24);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.26);
    osc2.stop(now + 0.26);

    // Air whip whoosh
    this.playNoiseBurst(now, 0.22, 'bandpass', 650, 2800, 0.18, 2.2);
  }

  public playCoin() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastCoinTime < 0.75) {
      this.coinCombo = Math.min(10, this.coinCombo + 1);
    } else {
      this.coinCombo = 0;
    }
    this.lastCoinTime = now;

    const baseFreq = 880 * Math.pow(1.05946, this.coinCombo);
    [baseFreq, baseFreq * 1.5].forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = now + idx * 0.048;
      const osc = this.ctx.createOscillator();
      const overtone = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      overtone.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      overtone.frequency.setValueAtTime(freq * 2, t);
      gain.gain.setValueAtTime(idx === 0 ? 0.14 : 0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + (idx === 0 ? 0.12 : 0.28));
      osc.connect(gain);
      overtone.connect(gain);
      gain.connect(dest);
      osc.start(t);
      overtone.start(t);
      osc.stop(t + 0.3);
      overtone.stop(t + 0.3);
    });
  }

  public playBotRescue() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Happy Astro chirp + Major9 arpeggio
    const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const shimmer = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      shimmer.type = 'sine';
      const t = now + idx * 0.065;
      osc.frequency.setValueAtTime(freq, t);
      shimmer.frequency.setValueAtTime(freq * 2, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
      osc.connect(gain);
      shimmer.connect(gain);
      gain.connect(dest);
      osc.start(t);
      shimmer.start(t);
      osc.stop(t + 0.36);
      shimmer.stop(t + 0.36);
    });
  }

  public playBowPickup() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const t = now + i * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  public playEnemyHit() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Sub-bass KO punch
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(170, now);
    sub.frequency.exponentialRampToValueAtTime(42, now + 0.16);
    subGain.gain.setValueAtTime(0.32, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    sub.connect(subGain).connect(dest);
    sub.start(now);
    sub.stop(now + 0.19);

    // 2. Crunchy metallic hit pop
    const pop = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    pop.type = 'square';
    pop.frequency.setValueAtTime(420, now);
    pop.frequency.exponentialRampToValueAtTime(115, now + 0.11);
    popGain.gain.setValueAtTime(0.15, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    pop.connect(popGain).connect(dest);
    pop.start(now);
    pop.stop(now + 0.13);

    // 3. Spark burst noise
    this.playNoiseBurst(now, 0.12, 'bandpass', 2200, 520, 0.24, 1.4);
  }

  public playBounce() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Elastic spring boing with FM wobble
    const carrier = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(175, now);
    carrier.frequency.exponentialRampToValueAtTime(840, now + 0.24);

    mod.type = 'sine';
    mod.frequency.setValueAtTime(28, now);
    modGain.gain.setValueAtTime(45, now);
    modGain.gain.exponentialRampToValueAtTime(4, now + 0.24);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    mod.connect(modGain).connect(carrier.frequency);
    carrier.connect(gain).connect(dest);
    mod.start(now);
    carrier.start(now);
    mod.stop(now + 0.29);
    carrier.stop(now + 0.29);
  }

  public playCrateBreak() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Heavy low knock
    const thud = this.ctx.createOscillator();
    const tGain = this.ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(160, now);
    thud.frequency.exponentialRampToValueAtTime(48, now + 0.12);
    tGain.gain.setValueAtTime(0.28, now);
    tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    thud.connect(tGain).connect(dest);
    thud.start(now);
    thud.stop(now + 0.15);

    // Wood/tech splinter crack
    this.playNoiseBurst(now, 0.15, 'bandpass', 2400, 480, 0.28, 0.9);
  }

  public playCheckpoint() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;
    [587.33, 783.99, 1174.66].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const t = now + i * 0.065;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public playHurt() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Robot glitch short-circuit + heavy impact
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc2.type = 'square';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.linearRampToValueAtTime(72, now + 0.28);
    osc2.frequency.setValueAtTime(175, now);
    osc2.frequency.linearRampToValueAtTime(55, now + 0.28);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + 0.28);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain).connect(dest);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.31);
    osc2.stop(now + 0.31);

    this.playNoiseBurst(now, 0.16, 'lowpass', 1800, 260, 0.24);
  }

  public playGameOver() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 392, 349.23, 261.63];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const t = now + i * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  public playVictory() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    fanfare.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      sub.type = 'sine';
      const t = now + i * 0.088;
      osc.frequency.setValueAtTime(freq, t);
      sub.frequency.setValueAtTime(freq * 0.5, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (i === fanfare.length - 1 ? 0.75 : 0.42));
      osc.connect(gain);
      sub.connect(gain);
      gain.connect(dest);
      osc.start(t);
      sub.start(t);
      osc.stop(t + 0.8);
      sub.stop(t + 0.8);
    });
  }

  public playRocketBoost() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Turbine ignition sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.28);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    osc.connect(filter).connect(gain).connect(dest);
    osc.start(now);
    osc.stop(now + 0.35);

    // Thruster roar
    this.playNoiseBurst(now, 0.36, 'bandpass', 420, 2100, 0.26, 0.8);
  }

  public playModeSwitch() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;
    [440, 659.25, 880].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const t = now + i * 0.032;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, t + 0.14);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + 0.17);
    });
  }

  public playBowShoot() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Bowstring twang
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(560, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.13);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain).connect(dest);
    osc.start(now);
    osc.stop(now + 0.16);

    // Aerodynamic arrow zip
    this.playNoiseBurst(now, 0.11, 'highpass', 2400, 4800, 0.16);
  }

  public playTargetHit() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;
    [659.25, 987.77, 1318.5, 1661.22].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const t = now + i * 0.045;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public playMonkeyPickup() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const t = now + i * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.17, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public playClimbStep() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastFootstepTime < 0.2) return;
    this.lastFootstepTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260 + Math.random() * 50, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.055);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain).connect(dest);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playBossHit() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;

    const sub = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(190, now);
    sub.frequency.exponentialRampToValueAtTime(48, now + 0.26);
    sGain.gain.setValueAtTime(0.32, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    sub.connect(sGain).connect(dest);
    sub.start(now);
    sub.stop(now + 0.29);

    this.playNoiseBurst(now, 0.22, 'bandpass', 1800, 320, 0.26, 1.2);
  }

  public playShockwave() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.35);
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(gain).connect(dest);
    osc.start(now);
    osc.stop(now + 0.4);

    this.playNoiseBurst(now, 0.28, 'lowpass', 950, 140, 0.24);
  }

  public playBossDefeat() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;

    this.playNoiseBurst(now, 0.55, 'lowpass', 1600, 120, 0.34);
    const fanfare = [392, 523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    fanfare.forEach((freq, i) => {
      if (!this.ctx) return;
      const t = now + 0.12 + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + 0.58);
    });
  }

  public playWindWhoosh() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.playNoiseBurst(now, 0.34, 'bandpass', 520, 1900, 0.24, 0.9);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.24);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain).connect(dest);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playSplash() {
    const dest = this.getSfxDest();
    if (!dest || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.playNoiseBurst(now, 0.36, 'bandpass', 1400, 380, 0.3, 0.7);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.16);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain).connect(dest);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

export const soundEngine = new SoundEngine();
