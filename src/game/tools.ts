import { BIN_HZ, N_BINS, FRAME_SEC } from '../dsp/stft';
import type { Session } from './session';

/** Map from spectrogram cells to world coordinates of the 3D surface. */
export interface Mapping {
  xOfFrame: (t: number) => number;
  zOfBin: Float32Array;
}

export interface PaintOpts {
  strength: number; // 0..1
  grip: number; // dB above the per-bin noise floor that the tool sticks to
  erase: boolean;
  exclusive: boolean; // painting a cell into one layer takes it from the others
}

/** How strongly a cell "sticks" to a tool: 0 below the grip threshold, 1 well above it. */
export function gate(s: Session, i: number, k: number, grip: number): number {
  const v = (s.db[i] - s.floor[k] - grip) / 6 + 0.5;
  return v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v);
}

function applyCell(s: Session, layerIdx: number, i: number, k: number, w: number, o: PaintOpts) {
  const layer = s.layers[layerIdx];
  if (o.erase) {
    layer.mask[i] *= 1 - w;
    return;
  }
  const a = w * gate(s, i, k, o.grip);
  if (a <= 0) return;
  layer.mask[i] += a * (1 - layer.mask[i]);
  if (o.exclusive) {
    for (let j = 0; j < s.layers.length; j++) if (j !== layerIdx) s.layers[j].mask[i] *= 1 - a;
  }
}

/** Soft spatial brush in world space (x = time, z = warped frequency). */
export function brush(s: Session, map: Mapping, layerIdx: number, cx: number, cz: number, radius: number, o: PaintOpts) {
  const r2 = radius * radius;
  for (let t = 0; t < s.frames; t++) {
    const dx = map.xOfFrame(t) - cx;
    if (Math.abs(dx) > radius) continue;
    for (let k = 0; k < N_BINS; k++) {
      const dz = map.zOfBin[k] - cz;
      const d2 = (dx * dx + dz * dz) / r2;
      if (d2 >= 1) continue;
      const w = (1 - d2) * (1 - d2) * o.strength;
      applyCell(s, layerIdx, t * N_BINS + k, k, w, o);
    }
  }
}

/** Band knife: claim a time x frequency box. */
export function knife(s: Session, layerIdx: number, t0: number, t1: number, k0: number, k1: number, o: PaintOpts) {
  const [ta, tb] = [Math.max(0, Math.round(Math.min(t0, t1))), Math.min(s.frames - 1, Math.round(Math.max(t0, t1)))];
  const [ka, kb] = [Math.max(0, Math.round(Math.min(k0, k1))), Math.min(N_BINS - 1, Math.round(Math.max(k0, k1)))];
  for (let t = ta; t <= tb; t++) for (let k = ka; k <= kb; k++) applyCell(s, layerIdx, t * N_BINS + k, k, o.strength, o);
}

// ---------------- harmonic tuning fork ----------------

function aboveFloor(s: Session, t: number, hz: number): number {
  const b = hz / BIN_HZ;
  const k = Math.floor(b);
  if (k < 0 || k >= N_BINS - 1) return 0;
  const f = b - k;
  const i = t * N_BINS + k;
  const db = s.db[i] * (1 - f) + s.db[i + 1] * f;
  const fl = s.floor[k] * (1 - f) + s.floor[k + 1] * f;
  return Math.max(0, db - fl);
}

function dbAt(s: Session, t: number, hz: number): number {
  const b = hz / BIN_HZ;
  const k = Math.floor(b);
  if (k < 0 || k >= N_BINS - 1) return -120;
  const f = b - k;
  const i = t * N_BINS + k;
  return s.db[i] * (1 - f) + s.db[i + 1] * f;
}

/**
 * Harmonic salience: how far the harmonics h*f stand above the valleys
 * between them ((h +- 0.5) * f), averaged over the first harmonics, combined
 * with energy above the noise floor. Comb contrast is robust to stationary
 * sources and to broadband noise such as rain.
 */
function salience(s: Session, t: number, f: number, nHarm = 6): number {
  let acc = 0;
  let n = 0;
  let floorAcc = 0;
  for (let h = 1; h <= nHarm; h++) {
    if ((h + 0.5) * f >= 7900) break;
    const peak = Math.max(dbAt(s, t, h * f), dbAt(s, t, h * f * 0.985), dbAt(s, t, h * f * 1.015));
    const valley = 0.5 * (dbAt(s, t, (h - 0.5) * f) + dbAt(s, t, (h + 0.5) * f));
    const w = 1 / Math.sqrt(h);
    acc += w * Math.max(0, peak - valley);
    floorAcc += w * aboveFloor(s, t, h * f);
    n += w;
  }
  if (!n) return 0;
  // need both: a comb shape, and energy that is not just the noise floor
  return Math.min(acc / n, floorAcc / n + 6);
}

function refine(s: Session, t: number, f: number, tol: number): [number, number] {
  let best = f;
  let bestS = -1;
  const lo = f * (1 - tol);
  const hi = f * (1 + tol);
  const step = Math.max(0.5, (hi - lo) / 24);
  for (let c = lo; c <= hi; c += step) {
    const sc = salience(s, t, c);
    if (sc > bestS) {
      bestS = sc;
      best = c;
    }
  }
  return [best, bestS];
}

export interface ForkOpts {
  minSalience: number; // dB
  persistence: number; // frames the tracker may lose the pitch before stopping
  tolerance: number; // relative pitch change per frame
  steady: boolean; // fixed pitch over the whole clip instead of tracking
}

/** Follow a harmonic strand forward and backward in time from a click. */
export function trackPitch(s: Session, t0: number, f0: number, o: ForkOpts): Map<number, number> {
  const track = new Map<number, number>();
  t0 = Math.max(0, Math.min(s.frames - 1, Math.round(t0)));
  if (o.steady) {
    const [fr] = refine(s, t0, f0, 0.04);
    for (let t = 0; t < s.frames; t++) if (salience(s, t, fr) >= o.minSalience) track.set(t, fr);
    return track;
  }
  const [fStart] = refine(s, t0, f0, 0.05);
  track.set(t0, fStart);
  for (const dir of [1, -1]) {
    let f = fStart;
    let miss = 0;
    for (let t = t0 + dir; t >= 0 && t < s.frames; t += dir) {
      const [fc, sc] = refine(s, t, f, o.tolerance);
      if (sc >= o.minSalience) {
        f = fc;
        miss = 0;
        track.set(t, f);
      } else if (++miss > o.persistence) break;
    }
  }
  return track;
}

/** Apply a harmonic comb mask along a pitch track. */
export function applyComb(s: Session, layerIdx: number, track: Map<number, number>, p: PaintOpts, maxHarm = 60) {
  for (const [t, f] of track) {
    for (let h = 1; h <= maxHarm && h * f < 7950; h++) {
      const c = (h * f) / BIN_HZ;
      const w = 1.3 + (h * f * 0.012) / BIN_HZ;
      const ka = Math.max(0, Math.floor(c - w));
      const kb = Math.min(N_BINS - 1, Math.ceil(c + w));
      for (let k = ka; k <= kb; k++) {
        const d = (k - c) / w;
        if (Math.abs(d) >= 1) continue;
        // the comb shape is already selective, so it grips 10 dB deeper than the brush
        applyCell(s, layerIdx, t * N_BINS + k, k, (1 - d * d) * p.strength, { ...p, grip: p.grip - 10 });
      }
    }
  }
}

// ---------------- rhythm echo ----------------

export interface EchoResult {
  matches: { t: number; corr: number }[];
  periodSec: number | null;
}

/**
 * Template matching along time: take the pattern inside a box (preferably
 * already masked in the active layer), find where it repeats, and copy the
 * mask to every repetition.
 */
export function echo(s: Session, layerIdx: number, t0: number, t1: number, k0: number, k1: number, grip: number, threshold = 0.5): EchoResult {
  const ta = Math.max(0, Math.round(Math.min(t0, t1)));
  const tb = Math.min(s.frames - 1, Math.round(Math.max(t0, t1)));
  const ka = Math.max(0, Math.round(Math.min(k0, k1)));
  const kb = Math.min(N_BINS - 1, Math.round(Math.max(k0, k1)));
  const W = tb - ta + 1;
  const Hh = kb - ka + 1;
  if (W < 3 || Hh < 2) return { matches: [], periodSec: null };
  const layer = s.layers[layerIdx];

  // energy feature: dB above floor+grip, clipped at 0
  const feat = (t: number, k: number) => Math.max(0, s.db[t * N_BINS + k] - s.floor[k] - grip * 0.5);
  const tpl = new Float32Array(W * Hh);
  let hasMask = false;
  for (let t = 0; t < W; t++)
    for (let k = 0; k < Hh; k++) {
      const i = (ta + t) * N_BINS + ka + k;
      if (layer.mask[i] > 0.2) hasMask = true;
    }
  for (let t = 0; t < W; t++)
    for (let k = 0; k < Hh; k++) {
      const i = (ta + t) * N_BINS + ka + k;
      tpl[t * Hh + k] = feat(ta + t, ka + k) * (hasMask ? layer.mask[i] : 1);
    }
  const mean = tpl.reduce((a, b) => a + b, 0) / tpl.length;
  let tnorm = 0;
  for (let i = 0; i < tpl.length; i++) {
    tpl[i] -= mean;
    tnorm += tpl[i] * tpl[i];
  }
  tnorm = Math.sqrt(tnorm) || 1;

  const corr = new Float32Array(s.frames - W + 1);
  for (let off = 0; off < corr.length; off++) {
    let m = 0;
    for (let t = 0; t < W; t++) for (let k = 0; k < Hh; k++) m += feat(off + t, ka + k);
    m /= W * Hh;
    let dot = 0;
    let nn = 0;
    for (let t = 0; t < W; t++)
      for (let k = 0; k < Hh; k++) {
        const v = feat(off + t, ka + k) - m;
        dot += v * tpl[t * Hh + k];
        nn += v * v;
      }
    corr[off] = dot / (Math.sqrt(nn) * tnorm + 1e-9);
  }

  // non-maximum suppression
  const minGap = Math.max(2, Math.floor(W * 0.7));
  const peaks: { t: number; corr: number }[] = [];
  for (let off = 0; off < corr.length; off++) {
    if (corr[off] < threshold) continue;
    let isMax = true;
    for (let d = -minGap; d <= minGap && isMax; d++) {
      const j = off + d;
      if (d !== 0 && j >= 0 && j < corr.length && corr[j] > corr[off]) isMax = false;
    }
    if (isMax) peaks.push({ t: off, corr: corr[off] });
  }

  // the pattern to copy: the layer's own mask if the player already carved the
  // call, otherwise the gated energy inside the box (which is then claimed too)
  const pattern = new Float32Array(W * Hh);
  for (let t = 0; t < W; t++)
    for (let k = 0; k < Hh; k++) {
      const src = (ta + t) * N_BINS + ka + k;
      pattern[t * Hh + k] = hasMask ? layer.mask[src] : gate(s, src, ka + k, grip);
    }
  if (!hasMask && !peaks.some((p) => Math.abs(p.t - ta) < minGap)) peaks.push({ t: ta, corr: 1 });
  peaks.sort((a, b) => a.t - b.t);

  // copy the mask pattern to every repetition
  for (const p of peaks) {
    if (hasMask && Math.abs(p.t - ta) < minGap) continue;
    for (let t = 0; t < W; t++)
      for (let k = 0; k < Hh; k++) {
        const dst = (p.t + t) * N_BINS + ka + k;
        const v = pattern[t * Hh + k] * gate(s, dst, ka + k, grip * 0.5);
        if (v > layer.mask[dst]) {
          const a = v - layer.mask[dst];
          layer.mask[dst] = v;
          for (let j = 0; j < s.layers.length; j++) if (j !== layerIdx) s.layers[j].mask[dst] *= 1 - a;
        }
      }
  }

  let periodSec: number | null = null;
  if (peaks.length >= 3) {
    const gaps = peaks.slice(1).map((p, i) => p.t - peaks[i].t).sort((a, b) => a - b);
    periodSec = gaps[Math.floor(gaps.length / 2)] * FRAME_SEC;
  }
  return { matches: peaks, periodSec };
}
