import { FFT } from './fft';

/** Edge-node audio format: Arduino Nano 33 BLE Sense PDM mic, resampled to 16 kHz mono. */
export const SR = 16000;
export const CLIP_SECONDS = 5;
export const CLIP_LEN = SR * CLIP_SECONDS;
export const N_FFT = 512; // 32 ms analysis window
export const HOP = 128; // 8 ms hop
export const N_BINS = N_FFT / 2 + 1; // 257
export const BIN_HZ = SR / N_FFT; // 31.25 Hz
export const nFrames = (len: number) => Math.floor(len / HOP) + 1;
export const N_FRAMES = nFrames(CLIP_LEN); // 626
export const FRAME_SEC = HOP / SR;

const fft = new FFT(N_FFT);
const hann = new Float64Array(N_FFT);
for (let i = 0; i < N_FFT; i++) hann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N_FFT);

/** Complex spectrogram. Layout: index = frame * N_BINS + bin. */
export interface Spectrogram {
  re: Float32Array;
  im: Float32Array;
  mag: Float32Array;
  frames: number;
}

const reflect = (i: number, len: number) => {
  if (len === 1) return 0;
  const period = 2 * (len - 1);
  i = ((i % period) + period) % period;
  return i < len ? i : period - i;
};

/** Centered STFT with reflect padding and a periodic Hann window. */
export function stft(x: Float32Array): Spectrogram {
  const frames = nFrames(x.length);
  const re = new Float32Array(frames * N_BINS);
  const im = new Float32Array(frames * N_BINS);
  const mag = new Float32Array(frames * N_BINS);
  const br = new Float64Array(N_FFT);
  const bi = new Float64Array(N_FFT);
  const half = N_FFT / 2;
  for (let t = 0; t < frames; t++) {
    const start = t * HOP - half;
    for (let i = 0; i < N_FFT; i++) {
      br[i] = x[reflect(start + i, x.length)] * hann[i];
      bi[i] = 0;
    }
    fft.forward(br, bi);
    const o = t * N_BINS;
    for (let k = 0; k < N_BINS; k++) {
      re[o + k] = br[k];
      im[o + k] = bi[k];
      mag[o + k] = Math.hypot(br[k], bi[k]);
    }
  }
  return { re, im, mag, frames };
}

/**
 * Inverse STFT of a masked spectrogram (weighted overlap-add).
 * mask may be null (identity). Output length = len.
 */
export function istft(spec: Spectrogram, mask: Float32Array | null, len: number): Float32Array {
  const out = new Float64Array(len + N_FFT);
  const norm = new Float64Array(len + N_FFT);
  const br = new Float64Array(N_FFT);
  const bi = new Float64Array(N_FFT);
  const half = N_FFT / 2;
  for (let t = 0; t < spec.frames; t++) {
    const o = t * N_BINS;
    for (let k = 0; k < N_BINS; k++) {
      const m = mask ? mask[o + k] : 1;
      br[k] = spec.re[o + k] * m;
      bi[k] = spec.im[o + k] * m;
    }
    for (let k = N_BINS; k < N_FFT; k++) {
      br[k] = br[N_FFT - k];
      bi[k] = -bi[N_FFT - k];
    }
    fft.inverse(br, bi);
    const start = t * HOP; // shifted by +half relative to analysis start
    for (let i = 0; i < N_FFT; i++) {
      const idx = start + i;
      out[idx] += br[i] * hann[i];
      norm[idx] += hann[i] * hann[i];
    }
  }
  const y = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const idx = i + half;
    y[i] = norm[idx] > 1e-8 ? out[idx] / norm[idx] : 0;
  }
  return y;
}

export function toDb(mag: Float32Array): Float32Array {
  const db = new Float32Array(mag.length);
  for (let i = 0; i < mag.length; i++) db[i] = 20 * Math.log10(mag[i] + 1e-6);
  return db;
}

/**
 * Per-bin low percentile of dB over time: a robust noise-floor estimate.
 * A low percentile (not the median) keeps sources that are present for most
 * of the clip (cicadas, a hovering hornet) above the floor.
 */
export function noiseFloor(db: Float32Array, frames: number, pct = 0.2): Float32Array {
  const floor = new Float32Array(N_BINS);
  const col = new Float32Array(frames);
  for (let k = 0; k < N_BINS; k++) {
    for (let t = 0; t < frames; t++) col[t] = db[t * N_BINS + k];
    col.sort();
    floor[k] = col[Math.floor(frames * pct)];
  }
  return floor;
}
