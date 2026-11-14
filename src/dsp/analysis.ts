import { N_BINS, SR, N_FFT } from './stft';

// ---------- HPSS (Fitzgerald 2010): median filtering across time vs frequency ----------

function median(buf: Float32Array, n: number): number {
  // insertion sort is fast for the short kernels used here
  for (let i = 1; i < n; i++) {
    const v = buf[i];
    let j = i - 1;
    while (j >= 0 && buf[j] > v) {
      buf[j + 1] = buf[j];
      j--;
    }
    buf[j + 1] = v;
  }
  return buf[n >> 1];
}

/**
 * Harmonic / percussive soft masks.
 * Harmonic sounds (calls, engines, wing-beats) are smooth along time.
 * Percussive sounds (rain drops, clicks) are smooth along frequency.
 */
export function hpss(mag: Float32Array, frames: number, kTime = 17, kFreq = 17) {
  const H = new Float32Array(mag.length);
  const P = new Float32Array(mag.length);
  const buf = new Float32Array(Math.max(kTime, kFreq));
  const ht = kTime >> 1;
  const hf = kFreq >> 1;
  for (let t = 0; t < frames; t++) {
    for (let k = 0; k < N_BINS; k++) {
      let n = 0;
      for (let d = -ht; d <= ht; d++) {
        const tt = Math.min(frames - 1, Math.max(0, t + d));
        buf[n++] = mag[tt * N_BINS + k];
      }
      H[t * N_BINS + k] = median(buf, n);
      n = 0;
      for (let d = -hf; d <= hf; d++) {
        const kk = Math.min(N_BINS - 1, Math.max(0, k + d));
        buf[n++] = mag[t * N_BINS + kk];
      }
      P[t * N_BINS + k] = median(buf, n);
    }
  }
  const mh = new Float32Array(mag.length);
  const mp = new Float32Array(mag.length);
  for (let i = 0; i < mag.length; i++) {
    const h2 = H[i] * H[i];
    const p2 = P[i] * P[i];
    const s = h2 + p2 + 1e-12;
    mh[i] = h2 / s;
    mp[i] = p2 / s;
  }
  return { harmonic: mh, percussive: mp };
}

// ---------- NMF with KL divergence (Lee & Seung multiplicative updates) ----------

export interface NmfResult {
  W: Float32Array; // N_BINS x K (column-major per component: W[k*N_BINS + f])
  H: Float32Array; // K x frames (H[k*frames + t])
  K: number;
  frames: number;
}

export function nmf(mag: Float32Array, frames: number, K: number, iters: number, seed = 1, onProgress?: (p: number) => void): NmfResult {
  const F = N_BINS;
  const T = frames;
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  // V is F x T, stored as V[t*F + f] (same as spectrogram layout)
  const V = mag;
  let mean = 0;
  for (let i = 0; i < V.length; i++) mean += V[i];
  mean /= V.length;
  const W = new Float32Array(F * K);
  const H = new Float32Array(K * T);
  for (let i = 0; i < W.length; i++) W[i] = 0.5 + rnd();
  for (let i = 0; i < H.length; i++) H[i] = (0.5 + rnd()) * mean;
  const WH = new Float32Array(F * T);
  const R = new Float32Array(F * T);
  const num = new Float32Array(Math.max(F, T));

  const computeWH = () => {
    WH.fill(1e-9);
    for (let k = 0; k < K; k++) {
      const wo = k * F;
      const ho = k * T;
      for (let t = 0; t < T; t++) {
        const h = H[ho + t];
        if (h === 0) continue;
        const o = t * F;
        for (let f = 0; f < F; f++) WH[o + f] += W[wo + f] * h;
      }
    }
  };

  for (let it = 0; it < iters; it++) {
    // update H
    computeWH();
    for (let i = 0; i < R.length; i++) R[i] = V[i] / WH[i];
    for (let k = 0; k < K; k++) {
      const wo = k * F;
      let wsum = 0;
      for (let f = 0; f < F; f++) wsum += W[wo + f];
      for (let t = 0; t < T; t++) {
        const o = t * F;
        let acc = 0;
        for (let f = 0; f < F; f++) acc += W[wo + f] * R[o + f];
        H[k * T + t] *= acc / (wsum + 1e-12);
      }
    }
    // update W
    computeWH();
    for (let i = 0; i < R.length; i++) R[i] = V[i] / WH[i];
    for (let k = 0; k < K; k++) {
      const ho = k * T;
      let hsum = 0;
      for (let t = 0; t < T; t++) hsum += H[ho + t];
      num.fill(0, 0, F);
      for (let t = 0; t < T; t++) {
        const h = H[ho + t];
        if (h === 0) continue;
        const o = t * F;
        for (let f = 0; f < F; f++) num[f] += R[o + f] * h;
      }
      const wo = k * F;
      for (let f = 0; f < F; f++) W[wo + f] *= num[f] / (hsum + 1e-12);
      // normalise column, push scale into H
      let norm = 0;
      for (let f = 0; f < F; f++) norm += W[wo + f];
      norm = norm || 1;
      for (let f = 0; f < F; f++) W[wo + f] /= norm;
      for (let t = 0; t < T; t++) H[ho + t] *= norm;
    }
    if (onProgress && it % 5 === 0) onProgress(it / iters);
  }
  return { W, H, K, frames };
}

/** Wiener-style soft mask of one NMF component: W_k H_k / sum_j W_j H_j. */
export function nmfComponentMask(r: NmfResult, k: number): Float32Array {
  const F = N_BINS;
  const T = r.frames;
  const total = new Float32Array(F * T).fill(1e-9);
  const comp = new Float32Array(F * T);
  for (let j = 0; j < r.K; j++) {
    for (let t = 0; t < T; t++) {
      const h = r.H[j * T + t];
      const o = t * F;
      for (let f = 0; f < F; f++) {
        const v = r.W[j * F + f] * h;
        total[o + f] += v;
        if (j === k) comp[o + f] = v;
      }
    }
  }
  for (let i = 0; i < comp.length; i++) comp[i] /= total[i];
  return comp;
}

/** Centroid frequency (Hz) of an NMF basis vector, used to sort/describe components. */
export function basisCentroidHz(r: NmfResult, k: number): number {
  let num = 0;
  let den = 0;
  for (let f = 0; f < N_BINS; f++) {
    const w = r.W[k * N_BINS + f];
    num += w * f;
    den += w;
  }
  return ((num / (den || 1)) * SR) / N_FFT;
}

// ---------- Mel filterbank (for the TinyML front-end) ----------

export const N_MELS = 32;
const hzToMel = (hz: number) => 2595 * Math.log10(1 + hz / 700);
const melToHz = (m: number) => 700 * (10 ** (m / 2595) - 1);

/** Triangular mel filters, fb[b*N_BINS + f]. */
export function melFilterbank(nMels = N_MELS, fmin = 50, fmax = SR / 2): Float32Array {
  const fb = new Float32Array(nMels * N_BINS);
  const mmin = hzToMel(fmin);
  const mmax = hzToMel(fmax);
  const pts: number[] = [];
  for (let i = 0; i < nMels + 2; i++) pts.push(melToHz(mmin + ((mmax - mmin) * i) / (nMels + 1)));
  for (let b = 0; b < nMels; b++) {
    const [lo, c, hi] = [pts[b], pts[b + 1], pts[b + 2]];
    for (let f = 0; f < N_BINS; f++) {
      const hz = (f * SR) / N_FFT;
      let w = 0;
      if (hz >= lo && hz <= c) w = (hz - lo) / (c - lo || 1);
      else if (hz > c && hz <= hi) w = (hi - hz) / (hi - c || 1);
      fb[b * N_BINS + f] = Math.max(0, w);
    }
  }
  return fb;
}

/** Log-mel features (dB), layout [t*nMels + b]. */
export function logMel(mag: Float32Array, frames: number, fb: Float32Array, nMels = N_MELS): Float32Array {
  const out = new Float32Array(frames * nMels);
  for (let t = 0; t < frames; t++) {
    for (let b = 0; b < nMels; b++) {
      let e = 0;
      const fo = b * N_BINS;
      const so = t * N_BINS;
      for (let f = 0; f < N_BINS; f++) {
        const w = fb[fo + f];
        if (w > 0) e += w * mag[so + f] * mag[so + f];
      }
      out[t * nMels + b] = 10 * Math.log10(e + 1e-10);
    }
  }
  return out;
}

/** Energy-weighted projection of a linear-bin mask onto mel bands. */
export function maskToMel(mask: Float32Array, mag: Float32Array, frames: number, fb: Float32Array, nMels = N_MELS): Float32Array {
  const out = new Float32Array(frames * nMels);
  for (let t = 0; t < frames; t++) {
    for (let b = 0; b < nMels; b++) {
      let num = 0;
      let den = 0;
      for (let f = 0; f < N_BINS; f++) {
        const w = fb[b * N_BINS + f];
        if (w <= 0) continue;
        const e = w * mag[t * N_BINS + f] * mag[t * N_BINS + f] + 1e-12;
        num += e * mask[t * N_BINS + f];
        den += e;
      }
      out[t * nMels + b] = num / den;
    }
  }
  return out;
}

/** Spread a mel-band mask back to linear bins (normalised transpose of the filterbank). */
export function melToMask(melMask: Float32Array, frames: number, fb: Float32Array, nMels = N_MELS): Float32Array {
  const out = new Float32Array(frames * N_BINS);
  const colSum = new Float32Array(N_BINS);
  for (let b = 0; b < nMels; b++) for (let f = 0; f < N_BINS; f++) colSum[f] += fb[b * N_BINS + f];
  for (let t = 0; t < frames; t++) {
    for (let f = 0; f < N_BINS; f++) {
      let v = 0;
      if (colSum[f] > 0) {
        for (let b = 0; b < nMels; b++) {
          const w = fb[b * N_BINS + f];
          if (w > 0) v += w * melMask[t * nMels + b];
        }
        v /= colSum[f];
      } else {
        // below fmin: copy the lowest band
        v = melMask[t * nMels];
      }
      out[t * N_BINS + f] = v;
    }
  }
  return out;
}

// ---------- Metrics ----------

/** Scale-invariant signal-to-distortion ratio in dB (Le Roux et al. 2019). */
export function siSdr(est: Float32Array, ref: Float32Array): number {
  let dot = 0;
  let rr = 0;
  let em = 0;
  let rm = 0;
  const n = Math.min(est.length, ref.length);
  for (let i = 0; i < n; i++) {
    em += est[i];
    rm += ref[i];
  }
  em /= n;
  rm /= n;
  for (let i = 0; i < n; i++) {
    dot += (est[i] - em) * (ref[i] - rm);
    rr += (ref[i] - rm) ** 2;
  }
  const a = dot / (rr + 1e-12);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const s = a * (ref[i] - rm);
    const e = est[i] - em - s;
    num += s * s;
    den += e * e;
  }
  return 10 * Math.log10((num + 1e-12) / (den + 1e-12));
}

export function rms(x: Float32Array): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s / x.length);
}
