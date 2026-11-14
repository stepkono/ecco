/**
 * TinyML mask estimator for the edge node.
 *
 * Input:  5 context frames x 32 log-mel bands (per-clip median normalised) = 160 values
 * Hidden: 64 ReLU units
 * Output: 4 classes x 32 mel bands sigmoid mask = 128 values
 * ~19k parameters, ~19 KB as int8. Fits the 1 MB flash / 256 KB RAM of an
 * Arduino Nano 33 BLE Sense with lots of room to spare.
 */
import { N_MELS } from '../dsp/analysis';

export const CONTEXT = 2; // frames on each side
export const N_IN = N_MELS * (2 * CONTEXT + 1);
export const N_HID = 64;
export const N_CLS = 4;
export const N_OUT = N_CLS * N_MELS;

export interface DataItem {
  feat: Float32Array; // raw log-mel dB [T * N_MELS]
  target: Float32Array; // mel masks [N_CLS * T * N_MELS], class-major
  frames: number;
  origin: 'player' | 'sim';
  label: string;
}

export interface FloatModel {
  W1: Float32Array; // N_HID x N_IN
  b1: Float32Array;
  W2: Float32Array; // N_OUT x N_HID
  b2: Float32Array;
}

export interface QuantModel {
  W1: Int8Array;
  b1: Int32Array;
  W2: Int8Array;
  b2: Int32Array;
  sx: number; // input scale
  sw1: number;
  sh: number; // hidden activation scale
  sw2: number;
}

/** Per-clip, per-band median normalisation: removes stationary noise colour and gain. */
export function normaliseFeatures(feat: Float32Array, frames: number): Float32Array {
  const out = new Float32Array(feat.length);
  const col = new Float32Array(frames);
  for (let b = 0; b < N_MELS; b++) {
    for (let t = 0; t < frames; t++) col[t] = feat[t * N_MELS + b];
    col.sort();
    const med = col[frames >> 1];
    for (let t = 0; t < frames; t++) out[t * N_MELS + b] = (feat[t * N_MELS + b] - med) / 20;
  }
  return out;
}

export function contextVector(norm: Float32Array, frames: number, t: number, out: Float32Array) {
  let p = 0;
  for (let d = -CONTEXT; d <= CONTEXT; d++) {
    const tt = Math.min(frames - 1, Math.max(0, t + d));
    for (let b = 0; b < N_MELS; b++) out[p++] = norm[tt * N_MELS + b];
  }
}

export function initModel(seed = 42): FloatModel {
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296 - 0.5) * 2;
  const he = (fanIn: number) => Math.sqrt(6 / fanIn);
  const W1 = new Float32Array(N_HID * N_IN).map(() => rnd() * he(N_IN));
  const W2 = new Float32Array(N_OUT * N_HID).map(() => rnd() * he(N_HID) * 0.5);
  const b2 = new Float32Array(N_OUT).fill(-2); // masks start mostly closed
  return { W1, b1: new Float32Array(N_HID), W2, b2 };
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export function forwardFloat(m: FloatModel, x: Float32Array, h: Float32Array, y: Float32Array) {
  for (let j = 0; j < N_HID; j++) {
    let a = m.b1[j];
    const o = j * N_IN;
    for (let i = 0; i < N_IN; i++) a += m.W1[o + i] * x[i];
    h[j] = a > 0 ? a : 0;
  }
  for (let j = 0; j < N_OUT; j++) {
    let a = m.b2[j];
    const o = j * N_HID;
    for (let i = 0; i < N_HID; i++) a += m.W2[o + i] * h[i];
    y[j] = sigmoid(a);
  }
}

/** Mini-batch Adam training with binary cross-entropy on the mel masks. */
export function train(
  items: DataItem[],
  epochs: number,
  onEpoch: (epoch: number, loss: number) => void,
  init?: FloatModel,
): { model: FloatModel; calib: { xMax: number; hMax: number } } {
  // assemble samples (every 2nd frame: neighbours are highly redundant at 8 ms hop)
  const X: Float32Array[] = [];
  const Y: Float32Array[] = [];
  const W: number[] = [];
  for (const it of items) {
    const norm = normaliseFeatures(it.feat, it.frames);
    for (let t = 0; t < it.frames; t += 2) {
      const x = new Float32Array(N_IN);
      contextVector(norm, it.frames, t, x);
      const y = new Float32Array(N_OUT);
      for (let c = 0; c < N_CLS; c++)
        for (let b = 0; b < N_MELS; b++) y[c * N_MELS + b] = it.target[c * it.frames * N_MELS + t * N_MELS + b];
      X.push(x);
      Y.push(y);
      W.push(it.origin === 'player' ? 2 : 1); // human-verified labels count double
    }
  }
  const m = init ?? initModel();
  const params = [m.W1, m.b1, m.W2, m.b2];
  const mom = params.map((p) => new Float32Array(p.length));
  const vel = params.map((p) => new Float32Array(p.length));
  const grads = params.map((p) => new Float32Array(p.length));
  const lr = 2e-3;
  const b1 = 0.9;
  const b2 = 0.999;
  let step = 0;
  const batch = 64;
  const h = new Float32Array(N_HID);
  const y = new Float32Array(N_OUT);
  const dh = new Float32Array(N_HID);
  const order = X.map((_, i) => i);
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

  for (let ep = 0; ep < epochs; ep++) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    let lossSum = 0;
    let count = 0;
    for (let bs = 0; bs < order.length; bs += batch) {
      grads.forEach((g) => g.fill(0));
      const be = Math.min(order.length, bs + batch);
      for (let bi = bs; bi < be; bi++) {
        const n = order[bi];
        const x = X[n];
        const tgt = Y[n];
        const wgt = W[n];
        forwardFloat(m, x, h, y);
        dh.fill(0);
        for (let j = 0; j < N_OUT; j++) {
          const p = Math.min(1 - 1e-6, Math.max(1e-6, y[j]));
          lossSum -= wgt * (tgt[j] * Math.log(p) + (1 - tgt[j]) * Math.log(1 - p));
          const dz = wgt * (y[j] - tgt[j]);
          grads[3][j] += dz;
          const o = j * N_HID;
          for (let i = 0; i < N_HID; i++) {
            grads[2][o + i] += dz * h[i];
            dh[i] += dz * m.W2[o + i];
          }
        }
        count += N_OUT;
        for (let jj = 0; jj < N_HID; jj++) {
          if (h[jj] <= 0) continue;
          const d = dh[jj];
          grads[1][jj] += d;
          const o = jj * N_IN;
          for (let i = 0; i < N_IN; i++) grads[0][o + i] += d * x[i];
        }
      }
      step++;
      const scale = 1 / (be - bs);
      const c1 = 1 - b1 ** step;
      const c2 = 1 - b2 ** step;
      for (let pi = 0; pi < params.length; pi++) {
        const p = params[pi];
        const g = grads[pi];
        const mo = mom[pi];
        const ve = vel[pi];
        for (let i = 0; i < p.length; i++) {
          const gi = g[i] * scale;
          mo[i] = b1 * mo[i] + (1 - b1) * gi;
          ve[i] = b2 * ve[i] + (1 - b2) * gi * gi;
          p[i] -= (lr * (mo[i] / c1)) / (Math.sqrt(ve[i] / c2) + 1e-8);
        }
      }
    }
    onEpoch(ep + 1, lossSum / count);
  }

  // calibration for int8 activations (99.9th percentile of |x| and h)
  const xs: number[] = [];
  const hs: number[] = [];
  for (let n = 0; n < X.length; n += Math.max(1, Math.floor(X.length / 800))) {
    forwardFloat(m, X[n], h, y);
    for (let i = 0; i < N_IN; i++) xs.push(Math.abs(X[n][i]));
    for (let i = 0; i < N_HID; i++) hs.push(h[i]);
  }
  xs.sort((a, b) => a - b);
  hs.sort((a, b) => a - b);
  const pct = (a: number[]) => a[Math.min(a.length - 1, Math.floor(a.length * 0.999))] || 1;
  return { model: m, calib: { xMax: pct(xs), hMax: pct(hs) } };
}

// ---------------- int8 post-training quantisation ----------------

function maxAbs(a: Float32Array) {
  let m = 0;
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i]));
  return m || 1;
}

export function quantise(m: FloatModel, calib: { xMax: number; hMax: number }): QuantModel {
  const sx = calib.xMax / 127;
  const sh = calib.hMax / 127;
  const sw1 = maxAbs(m.W1) / 127;
  const sw2 = maxAbs(m.W2) / 127;
  const q8 = (a: Float32Array, s: number) => Int8Array.from(a, (v) => Math.max(-127, Math.min(127, Math.round(v / s))));
  return {
    W1: q8(m.W1, sw1),
    W2: q8(m.W2, sw2),
    b1: Int32Array.from(m.b1, (v) => Math.round(v / (sx * sw1))),
    b2: Int32Array.from(m.b2, (v) => Math.round(v / (sh * sw2))),
    sx, sw1, sh, sw2,
  };
}

/** Mirrors the integer arithmetic of the C inference routine in the exported header. */
export function forwardInt8(q: QuantModel, x: Float32Array, y: Float32Array, xq = new Int8Array(N_IN), hq = new Int8Array(N_HID)) {
  for (let i = 0; i < N_IN; i++) xq[i] = Math.max(-127, Math.min(127, Math.round(x[i] / q.sx)));
  const m1 = q.sx * q.sw1;
  for (let j = 0; j < N_HID; j++) {
    let acc = q.b1[j];
    const o = j * N_IN;
    for (let i = 0; i < N_IN; i++) acc += q.W1[o + i] * xq[i];
    const hv = acc * m1;
    hq[j] = hv <= 0 ? 0 : Math.min(127, Math.round(hv / q.sh));
  }
  const m2 = q.sh * q.sw2;
  for (let j = 0; j < N_OUT; j++) {
    let acc = q.b2[j];
    const o = j * N_HID;
    for (let i = 0; i < N_HID; i++) acc += q.W2[o + i] * hq[i];
    y[j] = sigmoid(acc * m2);
  }
}

/** Run the (quantised or float) model over a whole clip. Returns class-major mel masks. */
export function predictClip(feat: Float32Array, frames: number, model: { q?: QuantModel; f?: FloatModel }): Float32Array {
  const norm = normaliseFeatures(feat, frames);
  const out = new Float32Array(N_CLS * frames * N_MELS);
  const x = new Float32Array(N_IN);
  const y = new Float32Array(N_OUT);
  const h = new Float32Array(N_HID);
  for (let t = 0; t < frames; t++) {
    contextVector(norm, frames, t, x);
    if (model.q) forwardInt8(model.q, x, y);
    else forwardFloat(model.f!, x, h, y);
    for (let c = 0; c < N_CLS; c++)
      for (let b = 0; b < N_MELS; b++) out[c * frames * N_MELS + t * N_MELS + b] = y[c * N_MELS + b];
  }
  return out;
}

export const MACS_PER_INFERENCE = N_IN * N_HID + N_HID * N_OUT;
export const PARAM_COUNT = N_IN * N_HID + N_HID + N_HID * N_OUT + N_OUT;
export const INT8_BYTES = N_IN * N_HID + N_HID * N_OUT + 4 * (N_HID + N_OUT);

/** Arduino-ready C header with int8 weights and a dependency-free inference routine. */
export function exportHeader(q: QuantModel, classes: string[], meta: { samples: number; clips: number }): string {
  const arr = (a: ArrayLike<number>, per = 24) => {
    const lines: string[] = [];
    for (let i = 0; i < a.length; i += per) lines.push('  ' + Array.from({ length: Math.min(per, a.length - i) }, (_, j) => a[i + j]).join(', '));
    return lines.join(',\n');
  };
  return `// biospectra_model.h
// Generated by BioSpectra from ${meta.clips} human-untangled spectrograms (${meta.samples} frames).
// Mask estimator: ${N_IN} -> ${N_HID} (ReLU) -> ${N_OUT} (sigmoid), int8 weights, int32 accumulators.
// Front-end expected on the node (16 kHz PDM mic):
//   512-pt Hann STFT, hop 128, 32 triangular mel bands 50 Hz..8 kHz, 10*log10(power),
//   per-band running median subtracted, divided by 20, 5-frame context (t-2..t+2).
// Output: per class, a 32-band mask in [0,1]. Classes: ${classes.join(', ')}.
#pragma once
#include <stdint.h>
#include <math.h>

#define BS_N_IN ${N_IN}
#define BS_N_HID ${N_HID}
#define BS_N_OUT ${N_OUT}
#define BS_N_CLS ${N_CLS}
#define BS_N_MELS ${N_MELS}

static const float bs_sx = ${q.sx.toExponential(8)}f;
static const float bs_sw1 = ${q.sw1.toExponential(8)}f;
static const float bs_sh = ${q.sh.toExponential(8)}f;
static const float bs_sw2 = ${q.sw2.toExponential(8)}f;

static const int8_t bs_w1[BS_N_HID * BS_N_IN] = {
${arr(q.W1)}
};
static const int32_t bs_b1[BS_N_HID] = {
${arr(q.b1, 12)}
};
static const int8_t bs_w2[BS_N_OUT * BS_N_HID] = {
${arr(q.W2)}
};
static const int32_t bs_b2[BS_N_OUT] = {
${arr(q.b2, 12)}
};

static inline int8_t bs_clamp8(float v, float lo) {
  long r = lroundf(v);
  if (r < (long)lo) r = (long)lo;
  if (r > 127) r = 127;
  return (int8_t)r;
}

// x: BS_N_IN normalised features, y: BS_N_OUT mask values in [0,1]
static inline void bs_infer(const float *x, float *y) {
  int8_t xq[BS_N_IN];
  int8_t hq[BS_N_HID];
  for (int i = 0; i < BS_N_IN; i++) xq[i] = bs_clamp8(x[i] / bs_sx, -127);
  const float m1 = bs_sx * bs_sw1;
  for (int j = 0; j < BS_N_HID; j++) {
    int32_t acc = bs_b1[j];
    const int8_t *w = &bs_w1[j * BS_N_IN];
    for (int i = 0; i < BS_N_IN; i++) acc += (int32_t)w[i] * xq[i];
    float h = acc * m1;
    hq[j] = h <= 0 ? 0 : bs_clamp8(h / bs_sh, 0);
  }
  const float m2 = bs_sh * bs_sw2;
  for (int j = 0; j < BS_N_OUT; j++) {
    int32_t acc = bs_b2[j];
    const int8_t *w = &bs_w2[j * BS_N_HID];
    for (int i = 0; i < BS_N_HID; i++) acc += (int32_t)w[i] * hq[i];
    y[j] = 1.0f / (1.0f + expf(-acc * m2));
  }
}
`;
}
