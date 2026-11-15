import { CLIP_LEN, N_BINS, istft, noiseFloor, stft, toDb, type Spectrogram } from '../dsp/stft';
import { siSdr } from '../dsp/analysis';
import { CLASSES, type ClassId } from './catalog';
import type { Level, Mixture } from './levels';

export interface Layer {
  id: number;
  name: string;
  cls: ClassId;
  color: string;
  mask: Float32Array;
  visible: boolean;
  origin: 'player' | 'ai' | 'assist';
}

export interface ClassScore {
  cls: ClassId;
  baseline: number; // SI-SDR of the raw mixture vs the clean reference
  player: number | null; // SI-SDR of the player's separation
  oracle: number; // SI-SDR of the ideal ratio mask: the ceiling of STFT masking
  progress: number; // (player - baseline) / (oracle - baseline)
}

let nextLayerId = 1;

/** One playable clip: the mixture, its spectrogram and the player's layers. */
export class Session {
  level: Level | null;
  mixture: Mixture;
  spec: Spectrogram;
  db: Float32Array;
  floor: Float32Array;
  maxDb: number;
  layers: Layer[] = [];
  activeLayer = -1;
  frames: number;
  /** ideal ratio masks per class (only when ground truth is known) */
  oracle: Partial<Record<ClassId, Float32Array>> = {};
  private oracleScore: Partial<Record<ClassId, number>> = {};
  private baselineScore: Partial<Record<ClassId, number>> = {};

  constructor(level: Level | null, mixture: Mixture) {
    this.level = level;
    this.mixture = mixture;
    this.spec = stft(mixture.mix);
    this.frames = this.spec.frames;
    this.db = toDb(this.spec.mag);
    this.floor = noiseFloor(this.db, this.frames);
    this.maxDb = -Infinity;
    for (let i = 0; i < this.db.length; i++) this.maxDb = Math.max(this.maxDb, this.db[i]);
    this.computeOracle();
  }

  get hasTruth() {
    return Object.keys(this.mixture.refs).length > 0;
  }

  private computeOracle() {
    const classes = Object.keys(this.mixture.refs) as ClassId[];
    if (!classes.length) return;
    const mags = classes.map((c) => stft(this.mixture.refs[c]!).mag);
    const n = this.spec.mag.length;
    const total = new Float32Array(n);
    for (const m of mags) for (let i = 0; i < n; i++) total[i] += m[i];
    classes.forEach((c, j) => {
      const irm = new Float32Array(n);
      for (let i = 0; i < n; i++) irm[i] = mags[j][i] / (total[i] + 1e-9);
      this.oracle[c] = irm;
      const ref = this.mixture.refs[c]!;
      this.oracleScore[c] = siSdr(istft(this.spec, irm, CLIP_LEN), ref);
      this.baselineScore[c] = siSdr(this.mixture.mix, ref);
    });
  }

  addLayer(cls: ClassId, origin: Layer['origin'] = 'player', name?: string): Layer {
    const sameCls = this.layers.filter((l) => l.cls === cls).length;
    const layer: Layer = {
      id: nextLayerId++,
      name: name ?? `${CLASSES[cls].label}${sameCls ? ' ' + (sameCls + 1) : ''}`,
      cls,
      color: CLASSES[cls].color,
      mask: new Float32Array(this.frames * N_BINS),
      visible: true,
      origin,
    };
    this.layers.push(layer);
    this.activeLayer = this.layers.length - 1;
    return layer;
  }

  removeLayer(idx: number) {
    this.layers.splice(idx, 1);
    this.activeLayer = Math.min(this.activeLayer, this.layers.length - 1);
  }

  get active(): Layer | null {
    return this.layers[this.activeLayer] ?? null;
  }

  /**
   * Final per-class masks. Overlapping claims are normalised so the masks of
   * all layers never sum above 1 in any cell (energy is conserved).
   */
  classMasks(filter: (l: Layer) => boolean = () => true): Partial<Record<ClassId, Float32Array>> {
    const n = this.spec.mag.length;
    const layers = this.layers.filter(filter);
    const sum = new Float32Array(n);
    for (const l of layers) for (let i = 0; i < n; i++) sum[i] += l.mask[i];
    const out: Partial<Record<ClassId, Float32Array>> = {};
    for (const l of layers) {
      const m = out[l.cls] ?? (out[l.cls] = new Float32Array(n));
      for (let i = 0; i < n; i++) m[i] += l.mask[i] / Math.max(1, sum[i]);
    }
    return out;
  }

  /** The share of each cell that belongs to this layer (overlapping layers split a cell). */
  layerMask(layer: Layer): Float32Array {
    const n = this.spec.mag.length;
    const sum = new Float32Array(n);
    for (const l of this.layers) for (let i = 0; i < n; i++) sum[i] += l.mask[i];
    const m = new Float32Array(n);
    for (let i = 0; i < n; i++) m[i] = layer.mask[i] / Math.max(1, sum[i]);
    return m;
  }

  /** What no layer has claimed yet. */
  residualMask(): Float32Array {
    const n = this.spec.mag.length;
    const m = new Float32Array(n).fill(1);
    for (const l of this.layers) for (let i = 0; i < n; i++) m[i] -= l.mask[i];
    for (let i = 0; i < n; i++) m[i] = Math.max(0, m[i]);
    return m;
  }

  private bgMask: Float32Array | null = null;
  /**
   * Keeps what rises above each frequency band's steady background and fades the
   * background itself out (soft spectral gate, same idea as "Hide background" in the view).
   */
  backgroundMask(): Float32Array {
    if (this.bgMask) return this.bgMask;
    const n = this.db.length;
    const m = new Float32Array(n);
    for (let t = 0; t < this.frames; t++)
      for (let k = 0; k < N_BINS; k++) {
        const i = t * N_BINS + k;
        const v = (this.db[i] - this.floor[k] - 3) / 9; // 3 dB above the floor starts, 12 dB passes fully
        m[i] = v <= 0 ? 0.03 : v >= 1 ? 1 : 0.03 + 0.97 * v * v * (3 - 2 * v);
      }
    return (this.bgMask = m);
  }

  /** Resynthesise the mixture through a time-frequency mask (values above 1 make cells louder). */
  maskedAudio(mask: Float32Array): Float32Array {
    return istft(this.spec, mask, CLIP_LEN);
  }

  layerAudio(layer: Layer): Float32Array {
    return this.maskedAudio(this.layerMask(layer));
  }

  residualAudio(): Float32Array {
    return this.maskedAudio(this.residualMask());
  }

  scores(filter: (l: Layer) => boolean = (l) => l.origin !== 'ai'): ClassScore[] {
    if (!this.hasTruth || !this.level) return [];
    const masks = this.classMasks(filter);
    return this.level.targets.map((cls) => {
      const ref = this.mixture.refs[cls]!;
      const baseline = this.baselineScore[cls]!;
      const oracle = this.oracleScore[cls]!;
      const m = masks[cls];
      let player: number | null = null;
      if (m && m.some((v) => v > 0.01)) player = siSdr(istft(this.spec, m, CLIP_LEN), ref);
      const progress = player === null ? 0 : Math.max(0, Math.min(1, (player - baseline) / Math.max(0.5, oracle - baseline)));
      return { cls, baseline, player, oracle, progress };
    });
  }
}

export const stars = (progress: number) => (progress >= 0.8 ? 3 : progress >= 0.6 ? 2 : progress >= 0.4 ? 1 : 0);
