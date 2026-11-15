import React, {useMemo} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {lerp, riseStyle, springIn} from '../components/anim';
import {Footage, Glass, Kicker} from '../components/ui';
import {C, INTER, MONO} from '../theme';
import {FOOTAGE, sec} from '../timing';

/** The stamps in the archive, with a hue each, like renderStamp in src/ui/archive.ts */
const STAMPS: {name: string; place: string; hue: number; seed: number}[] = [
  {name: 'Treefrog', place: 'Nuuksio', hue: 300, seed: 1},
  {name: 'Hornet patrol', place: 'Repovesi', hue: 20, seed: 2},
  {name: 'Sedge frog', place: 'Liesjärvi', hue: 170, seed: 3},
  {name: 'Storm chorus', place: 'Oulanka', hue: 230, seed: 4},
  {name: 'Cicada', place: 'Koli', hue: 45, seed: 5},
  {name: 'Wren at dawn', place: 'Nuuksio', hue: 330, seed: 6},
  {name: 'Rain bed', place: 'Pallas', hue: 200, seed: 7},
  {name: 'Owl, far', place: 'Urho Kekkonen', hue: 265, seed: 8},
  {name: 'Engine noise', place: 'Espoo', hue: 0, seed: 9},
  {name: 'Crickets', place: 'Teijo', hue: 90, seed: 10},
  {name: 'Woodpecker', place: 'Sipoonkorpi', hue: 140, seed: 11},
  {name: 'Chirping birds', place: 'Nuuksio', hue: 280, seed: 12},
];

const hsl = (h: number, s: number, l: number): [number, number, number] => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
};

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** A coarse 14 x 14 grid with a few call-like blobs, coloured low, mid, high, then blurred. */
const makeStamp = (hue: number, seed: number, size = 220) => {
  const G = 14;
  const rnd = mulberry32(seed * 977);
  const grid = new Float32Array(G * G);
  const calls = 2 + Math.floor(rnd() * 3);
  for (let n = 0; n < calls; n++) {
    const cy = 2 + rnd() * (G - 4);
    const reps = 1 + Math.floor(rnd() * 5);
    const step = G / (reps + 1);
    const w = 0.6 + rnd() * 1.6;
    const h = 0.8 + rnd() * 2.5;
    for (let r = 0; r < reps; r++) {
      const cx = step * (r + 1) + (rnd() - 0.5);
      for (let y = 0; y < G; y++)
        for (let x = 0; x < G; x++) {
          const d = ((x - cx) / w) ** 2 + ((y - cy) / h) ** 2;
          grid[y * G + x] += Math.exp(-d) * (0.6 + rnd() * 0.5);
        }
    }
  }
  for (let i = 0; i < G * G; i++) grid[i] += rnd() * 0.12;
  const small = document.createElement('canvas');
  small.width = small.height = G;
  const g = small.getContext('2d')!;
  const img = g.createImageData(G, G);
  const lo = hsl(hue, 50, 13);
  const mid = hsl((hue + 40) % 360, 70, 48);
  const hi = hsl((hue + 80) % 360, 90, 80);
  for (let i = 0; i < G * G; i++) {
    const v = Math.min(1, grid[i] * 0.9);
    const [a, b, f] = v < 0.5 ? [lo, mid, v / 0.5] : [mid, hi, (v - 0.5) / 0.5];
    img.data[i * 4] = a[0] + (b[0] - a[0]) * f;
    img.data[i * 4 + 1] = a[1] + (b[1] - a[1]) * f;
    img.data[i * 4 + 2] = a[2] + (b[2] - a[2]) * f;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const big = document.createElement('canvas');
  big.width = big.height = size;
  const bctx = big.getContext('2d')!;
  bctx.imageSmoothingEnabled = true;
  bctx.imageSmoothingQuality = 'high';
  bctx.filter = 'blur(11px)';
  bctx.drawImage(small, -18, -18, size + 36, size + 36);
  return big.toDataURL('image/jpeg', 0.9);
};

const COLS = 6;
const CARD = 230;
const GAP = 22;

/** Script line 8, first sentence. The archive: every solved sound becomes a soft, unique stamp. */
export const Archive: React.FC = () => {
  const frame = useCurrentFrame();
  const stamps = useMemo(() => STAMPS.map((s) => makeStamp(s.hue, s.seed)), []);
  const gridW = COLS * CARD + (COLS - 1) * GAP;
  const drift = lerp(frame, [0, sec(6.4)], [0, -24], (x) => x);
  const out = 1;
  return (
    <AbsoluteFill style={{fontFamily: INTER, color: C.text, background: C.bg, opacity: out}}>
      <Footage spec={FOOTAGE.themes} zoom={[1.15, 1.25]} blur={28} dim={0.55} />
      <div style={{position: 'absolute', left: (1920 - gridW) / 2, top: 92}}>
        <Kicker style={riseStyle(springIn(frame, 0))}>Community archive</Kicker>
        <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: gridW, marginTop: 10}}>
          <div style={{fontSize: 64, fontWeight: 600, letterSpacing: '-0.03em', ...riseStyle(springIn(frame, sec(0.3)))}}>Every solved sound becomes a Sound Stamp.</div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: (1920 - gridW) / 2,
          top: 300,
          width: gridW,
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, ${CARD}px)`,
          gap: GAP,
          transform: `translateY(${drift}px)`,
        }}
      >
        {STAMPS.map((s, i) => {
          const p = springIn(frame, sec(0.5) + i * 3, 18);
          return (
            <div key={s.name} style={{opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 40}px) scale(${0.9 + 0.1 * p})`}}>
              <Glass strong style={{padding: 10}}>
                <Img src={stamps[i]} style={{width: CARD - 22, height: CARD - 22 - 60, objectFit: 'cover', borderRadius: 4, display: 'block'}} />
                <div style={{fontSize: 19, fontWeight: 600, marginTop: 10, paddingLeft: 4}}>{s.name}</div>
                <div style={{fontFamily: MONO, fontSize: 13, color: C.faint, marginTop: 3, paddingLeft: 4}}>{s.place}</div>
              </Glass>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', width: '100%', textAlign: 'center', top: 830, ...riseStyle(springIn(frame, sec(2.6)))}}>
        <span
          style={{
            fontSize: 52,
            fontWeight: 600,
            letterSpacing: '-0.025em',
            backgroundImage: `linear-gradient(90deg, ${C.cyan}, ${C.violet} 55%, ${C.pink})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Verified training data, made by people.
        </span>
      </div>
    </AbsoluteFill>
  );
};
