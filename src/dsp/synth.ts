import { SR } from './stft';

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gauss(rnd: () => number) {
  const u = Math.max(1e-12, rnd());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
}

/** Smooth random curve in [-1, 1] built from a few slow sinusoids. */
function slowCurve(rnd: () => number, n: number, fmin: number, fmax: number, parts = 4) {
  const out = new Float32Array(n);
  const comps = Array.from({ length: parts }, () => ({
    f: fmin + (fmax - fmin) * rnd(),
    p: rnd() * Math.PI * 2,
    a: 0.5 + rnd(),
  }));
  const asum = comps.reduce((s, c) => s + c.a, 0);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (const c of comps) v += c.a * Math.sin((2 * Math.PI * c.f * i) / SR + c.p);
    out[i] = v / asum;
  }
  return out;
}

/**
 * Physics-inspired hornet fly-by.
 * Wing-beat fundamental near 110 Hz with a rich harmonic series, slight
 * wing-beat jitter, 1/r distance attenuation and Doppler shift as the insect
 * passes the microphone.
 */
export function synthHornet(len: number, seed: number, opts: { f0?: number; closest?: number; speed?: number; tc?: number } = {}) {
  const rnd = mulberry32(seed);
  const f0 = opts.f0 ?? 105 + rnd() * 20;
  const d = opts.closest ?? 0.4; // metres
  const v = opts.speed ?? 1.4; // m/s
  const tc = opts.tc ?? (len / SR) * (0.35 + rnd() * 0.3);
  const c = 343;
  const drift = slowCurve(rnd, len, 0.2, 1.2, 3);
  const nH = 40;
  const amps = Array.from({ length: nH }, (_, i) => {
    const h = i + 1;
    let a = 1 / h ** 0.85;
    if (h === 2) a *= 1.6; // second harmonic dominates in many Hymenoptera
    if (h === 3) a *= 1.2;
    return a * (0.7 + 0.6 * rnd());
  });
  const phases = Array.from({ length: nH }, () => rnd() * Math.PI * 2);
  const y = new Float32Array(len);
  let phi = 0;
  let jitter = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const x = v * (t - tc);
    const r = Math.sqrt(x * x + d * d);
    const vr = (v * x) / r;
    const doppler = c / (c + vr);
    jitter = 0.995 * jitter + 0.002 * gauss(rnd);
    const f = f0 * (1 + 0.035 * drift[i] + jitter) * doppler;
    phi += (2 * Math.PI * f) / SR;
    let s = 0;
    for (let h = 1; h <= nH; h++) {
      if (h * f > SR / 2 - 400) break;
      s += amps[h - 1] * Math.sin(h * phi + phases[h - 1]);
    }
    const am = 1 + 0.15 * Math.sin(phi * 0.5); // slight stroke asymmetry
    y[i] = (s * am * d) / r;
  }
  return y;
}

/** Wind on an exposed microphone: low rumble plus gusty low-passed noise. */
export function synthWind(len: number, seed: number) {
  const rnd = mulberry32(seed);
  const gust = slowCurve(rnd, len, 0.08, 0.6, 5);
  const y = new Float32Array(len);
  let lp1 = 0;
  let lp2 = 0;
  let rumble = 0;
  for (let i = 0; i < len; i++) {
    const g = 0.25 + 0.75 * (0.5 + 0.5 * gust[i]) ** 2;
    const fc = 120 + 900 * g;
    const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
    const n = gauss(rnd);
    lp1 += a * (n - lp1);
    lp2 += a * (lp1 - lp2);
    rumble += 0.004 * (gauss(rnd) - rumble);
    y[i] = g * (lp2 * 1.2 + rumble * 6);
  }
  return y;
}
