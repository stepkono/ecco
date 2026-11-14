import { CLIP_LEN, SR } from '../dsp/stft';
import { synthHornet, synthWind } from '../dsp/synth';
import { rms } from '../dsp/analysis';
import { SOURCES, type ClassId, type SourceId } from './catalog';

export interface StemSpec {
  src: SourceId;
  gainDb: number; // relative to -20 dBFS RMS reference
  offset?: number; // seconds into the source recording
  at?: number; // seconds into the clip where the stem starts
  dur?: number; // seconds the stem lasts
  seed?: number; // for synthetic sources
}

export interface Level {
  id: string;
  node: string;
  site: string;
  title: string;
  brief: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  stems: StemSpec[];
  targets: ClassId[];
}

export const LEVELS: Level[] = [
  {
    id: 'l1', node: 'W-03', site: 'Wetland edge, dusk', difficulty: 1,
    title: 'Treefrog in drizzle',
    brief: 'A green treefrog calls through light rain. Carve its pulsed calls out of the rain streaks.',
    stems: [
      { src: 'hyla', gainDb: 0, offset: 1.2 },
      { src: 'rain_light', gainDb: 0, offset: 0.5 },
    ],
    targets: ['frog'],
  },
  {
    id: 'l2', node: 'O-11', site: 'Orchard hedge, noon', difficulty: 2,
    title: 'Hornet patrol',
    brief: 'An invasive hornet hawks along the hedge while cicadas buzz and wind hits the mic. Use the tuning fork on its wing-beat comb.',
    stems: [
      { src: 'hornet', gainDb: -2, seed: 7 },
      { src: 'cicada', gainDb: -6, offset: 2 },
      { src: 'wind', gainDb: 0, seed: 3 },
    ],
    targets: ['hornet', 'cicada'],
  },
  {
    id: 'l3', node: 'F-07', site: 'Old-growth margin, morning', difficulty: 3,
    title: 'Saw in the marsh',
    brief: 'A marsh frog chorus, and far away someone starts a chainsaw. Rain on the housing. Separate both: one is a species, one is a threat.',
    stems: [
      { src: 'pelophylax', gainDb: 0, offset: 0 },
      { src: 'chainsaw_b', gainDb: -6, offset: 1 },
      { src: 'rain_drops', gainDb: -5, offset: 2 },
    ],
    targets: ['frog', 'chainsaw'],
  },
  {
    id: 'l4', node: 'S-01', site: 'Storm front, night', difficulty: 4,
    title: 'Storm chorus',
    brief: 'Everything at once: treefrog, hornet, chainsaw, heavy rain and wind. Standard CNNs on the node fail here. Can you untangle it?',
    stems: [
      { src: 'hyla', gainDb: -3, offset: 4 },
      { src: 'hornet', gainDb: -5, seed: 21 },
      { src: 'chainsaw_a', gainDb: -8, offset: 3 },
      { src: 'rain_drops', gainDb: 0, offset: 5 },
      { src: 'wind', gainDb: -2, seed: 9 },
    ],
    targets: ['frog', 'hornet', 'chainsaw'],
  },
  {
    id: 'l5', node: 'R-22', site: 'Sedge pond, rain', difficulty: 5,
    title: 'Whisper of the sedge frog',
    brief: 'A rare sedge frog clicks a few times, barely above the rain. Low SNR: the real edge case the sensor misses.',
    stems: [
      { src: 'litoria', gainDb: 4, offset: 3.4 },
      { src: 'rain_light', gainDb: -2, offset: 4 },
      { src: 'wind', gainDb: -4, seed: 12 },
    ],
    targets: ['frog'],
  },
];

// ---------------- source loading ----------------

const cache = new Map<SourceId, Float32Array>();

function parseWav(buf: ArrayBuffer): Float32Array {
  const dv = new DataView(buf);
  let p = 12;
  let fmtBits = 16;
  let channels = 1;
  while (p < dv.byteLength - 8) {
    const id = String.fromCharCode(dv.getUint8(p), dv.getUint8(p + 1), dv.getUint8(p + 2), dv.getUint8(p + 3));
    const size = dv.getUint32(p + 4, true);
    if (id === 'fmt ') {
      channels = dv.getUint16(p + 10, true);
      fmtBits = dv.getUint16(p + 22, true);
    } else if (id === 'data') {
      if (fmtBits !== 16) throw new Error('only 16-bit PCM supported');
      const n = Math.floor(size / 2 / channels);
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = dv.getInt16(p + 8 + i * 2 * channels, true) / 32768;
      return out;
    }
    p += 8 + size + (size & 1);
  }
  throw new Error('no data chunk');
}

export async function loadSource(src: SourceId, seed = 1): Promise<Float32Array> {
  const info = SOURCES[src];
  if (!info.file) {
    // synthetic: long enough for any offset
    return src === 'hornet' ? synthHornet(CLIP_LEN, seed) : synthWind(CLIP_LEN, seed);
  }
  const hit = cache.get(src);
  if (hit) return hit;
  const res = await fetch(`${import.meta.env.BASE_URL}audio/${info.file}`);
  const x = parseWav(await res.arrayBuffer());
  cache.set(src, x);
  return x;
}

export async function loadAllSources(): Promise<Record<string, Float32Array>> {
  const out: Record<string, Float32Array> = {};
  for (const id of Object.keys(SOURCES) as SourceId[]) {
    if (SOURCES[id].file) out[id] = await loadSource(id);
  }
  return out;
}

// ---------------- mixing ----------------

export interface Mixture {
  mix: Float32Array;
  stems: { spec: StemSpec; cls: ClassId; audio: Float32Array }[];
  /** clean reference signal per class (sum of stems of that class) */
  refs: Partial<Record<ClassId, Float32Array>>;
}

const REF_RMS = 0.1; // -20 dBFS

/** Cut, place, level-normalise and fade one stem into a 5 s clip. */
export function placeStem(source: Float32Array, spec: StemSpec): Float32Array {
  const out = new Float32Array(CLIP_LEN);
  const at = Math.round((spec.at ?? 0) * SR);
  const dur = Math.round((spec.dur ?? CLIP_LEN / SR) * SR);
  const off = Math.round((spec.offset ?? 0) * SR);
  const fade = Math.round(0.03 * SR);
  for (let i = 0; i < dur && at + i < CLIP_LEN; i++) {
    const si = (off + i) % source.length;
    let g = 1;
    if (spec.at && i < fade) g = i / fade;
    if (spec.dur && dur - i < fade) g = (dur - i) / fade;
    out[at + i] = source[si] * g;
  }
  // normalise on the active (non-silent) region so quiet gaps do not inflate gain
  const level = rms(out.subarray(at, Math.min(CLIP_LEN, at + dur))) || 1e-6;
  const gain = (REF_RMS / level) * 10 ** (spec.gainDb / 20);
  for (let i = 0; i < CLIP_LEN; i++) out[i] *= gain;
  return out;
}

export function buildMixture(stems: { spec: StemSpec; audio: Float32Array }[]): Mixture {
  const mix = new Float32Array(CLIP_LEN);
  const placed = stems.map((s) => ({ spec: s.spec, cls: SOURCES[s.spec.src].cls, audio: placeStem(s.audio, s.spec) }));
  for (const s of placed) for (let i = 0; i < CLIP_LEN; i++) mix[i] += s.audio[i];
  let peak = 0;
  for (let i = 0; i < CLIP_LEN; i++) peak = Math.max(peak, Math.abs(mix[i]));
  const g = peak > 0.95 ? 0.95 / peak : 1;
  if (g !== 1) {
    for (let i = 0; i < CLIP_LEN; i++) mix[i] *= g;
    for (const s of placed) for (let i = 0; i < CLIP_LEN; i++) s.audio[i] *= g;
  }
  const refs: Partial<Record<ClassId, Float32Array>> = {};
  for (const s of placed) {
    const r = refs[s.cls] ?? (refs[s.cls] = new Float32Array(CLIP_LEN));
    for (let i = 0; i < CLIP_LEN; i++) r[i] += s.audio[i];
  }
  return { mix, stems: placed, refs };
}

export async function mixLevel(level: Level): Promise<Mixture> {
  const loaded = await Promise.all(level.stems.map(async (spec) => ({ spec, audio: await loadSource(spec.src, spec.seed ?? 1) })));
  return buildMixture(loaded);
}

/** SNR of a class against everything else, in dB. */
export function classSnr(m: Mixture, cls: ClassId): number {
  const ref = m.refs[cls];
  if (!ref) return -Infinity;
  let s = 0;
  let n = 0;
  for (let i = 0; i < CLIP_LEN; i++) {
    s += ref[i] * ref[i];
    const r = m.mix[i] - ref[i];
    n += r * r;
  }
  return 10 * Math.log10((s + 1e-12) / (n + 1e-12));
}

/** Decode an uploaded file (any format the browser supports) to 5 s of 16 kHz mono. */
export async function decodeUpload(file: File, startSec = 0): Promise<Float32Array> {
  const buf = await file.arrayBuffer();
  const ctx = new AudioContext();
  const decoded = await ctx.decodeAudioData(buf);
  await ctx.close();
  const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * SR), SR);
  const node = off.createBufferSource();
  node.buffer = decoded;
  node.connect(off.destination);
  node.start();
  const rendered = await off.startRendering();
  const x = rendered.getChannelData(0);
  const out = new Float32Array(CLIP_LEN);
  const s0 = Math.min(Math.max(0, Math.round(startSec * SR)), Math.max(0, x.length - CLIP_LEN));
  out.set(x.subarray(s0, s0 + CLIP_LEN));
  let peak = 0;
  for (let i = 0; i < CLIP_LEN; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) for (let i = 0; i < CLIP_LEN; i++) out[i] *= 0.8 / peak;
  return out;
}
