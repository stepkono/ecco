import { CLIP_LEN, SR, N_BINS, stft } from '../dsp/stft';
import { logMel, maskToMel, melFilterbank, N_MELS } from '../dsp/analysis';
import { mulberry32, synthHornet, synthWind } from '../dsp/synth';
import { MODEL_CLASSES, SOURCES, type ClassId, type SourceId } from '../game/catalog';
import { buildMixture, type StemSpec } from '../game/levels';
import { N_CLS, type DataItem } from './model';

const fb = melFilterbank();

/** Turn a mixture magnitude + per-class linear masks into a training item. */
export function makeItem(
  mag: Float32Array,
  frames: number,
  masks: Partial<Record<ClassId, Float32Array>>,
  origin: DataItem['origin'],
  label: string,
): DataItem {
  const feat = logMel(mag, frames, fb);
  const target = new Float32Array(N_CLS * frames * N_MELS);
  MODEL_CLASSES.forEach((cls, c) => {
    const m = masks[cls];
    if (!m) return;
    target.set(maskToMel(m, mag, frames, fb), c * frames * N_MELS);
  });
  return { feat, target, frames, origin, label };
}

// the invasive hornet is the priority target, so it is sampled more often
const TARGET_SRC: SourceId[] = ['hyla', 'pelophylax', 'litoria', 'cicada', 'chainsaw_a', 'chainsaw_b', 'hornet', 'hornet', 'hornet'];
const NOISE_SRC: SourceId[] = ['rain_drops', 'rain_light', 'wind'];

/**
 * Simulated community contributions: random re-mixes of the stems, labelled
 * with an imperfect "human-like" mask (soft-thresholded ideal ratio mask with
 * random dropouts). Stands in for thousands of players while the demo has one.
 * Offsets, gains and synthetic seeds are randomised, so the exact level
 * mixtures are practically never reproduced.
 */
export function simulateCommunity(
  sources: Record<string, Float32Array>,
  n: number,
  seed: number,
  onProgress?: (p: number) => void,
): DataItem[] {
  const rnd = mulberry32(seed);
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const items: DataItem[] = [];
  for (let i = 0; i < n; i++) {
    const nT = 1 + Math.floor(rnd() * 2);
    const nN = 1 + Math.floor(rnd() * 2);
    const chosen = new Set<SourceId>();
    while (chosen.size < nT) chosen.add(pick(TARGET_SRC));
    const noise = new Set<SourceId>();
    while (noise.size < nN) noise.add(pick(NOISE_SRC));
    const stems: { spec: StemSpec; audio: Float32Array }[] = [];
    for (const src of chosen) {
      const s = Math.floor(rnd() * 1e9);
      const audio = src === 'hornet' ? synthHornet(CLIP_LEN, s) : sources[src];
      const len = audio.length / SR;
      stems.push({ spec: { src, gainDb: -8 + rnd() * 10, offset: rnd() * Math.max(0, len - 5) }, audio });
    }
    for (const src of noise) {
      const s = Math.floor(rnd() * 1e9);
      const audio = src === 'wind' ? synthWind(CLIP_LEN, s) : sources[src];
      const len = audio.length / SR;
      stems.push({ spec: { src, gainDb: -6 + rnd() * 6, offset: rnd() * Math.max(0, len - 5) }, audio });
    }
    const mix = buildMixture(stems);
    const spec = stft(mix.mix);
    const classMags: Partial<Record<ClassId, Float32Array>> = {};
    for (const [cls, ref] of Object.entries(mix.refs)) classMags[cls as ClassId] = stft(ref!).mag;
    const total = new Float32Array(spec.mag.length);
    for (const m of Object.values(classMags)) for (let j = 0; j < total.length; j++) total[j] += m![j];
    const masks: Partial<Record<ClassId, Float32Array>> = {};
    for (const cls of MODEL_CLASSES) {
      const m = classMags[cls];
      if (!m) continue;
      const mask = new Float32Array(total.length);
      // human-like: soft threshold, and players miss ~10% of the time-frequency blobs
      const dropT = Math.floor(rnd() * spec.frames);
      const dropW = Math.floor(rnd() * 40);
      for (let j = 0; j < mask.length; j++) {
        const irm = m[j] / (total[j] + 1e-9);
        const t = Math.floor(j / N_BINS);
        const missed = t >= dropT && t < dropT + dropW && rnd() < 0.8;
        mask[j] = missed ? 0 : 1 / (1 + Math.exp(-(irm - 0.5) * 10));
      }
      masks[cls] = mask;
    }
    const label = [...chosen].map((s) => SOURCES[s].common).join(' + ') + ' in ' + [...noise].map((s) => SOURCES[s].common.toLowerCase()).join(', ');
    items.push(makeItem(spec.mag, spec.frames, masks, 'sim', label));
    onProgress?.((i + 1) / n);
  }
  return items;
}
