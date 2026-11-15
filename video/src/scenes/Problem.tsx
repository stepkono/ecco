import React, {useMemo} from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {fadeIn, fadeOut, lerp, riseStyle, springIn} from '../components/anim';
import {Chip, Glass, Kicker} from '../components/ui';
import {C, INTER, MONO} from '../theme';
import {TurnText} from './TurningPoint';
import {sec} from '../timing';

const COLS = 3400;
const ROWS = 96;
const SX = 2; // screen px per column
const PANEL_W = 1680;
const STRIP_H = 300;
const WAVE_H = 150;
const PLAYHEAD_X = 670;
/** the hidden frog call: 8 short pulses in the middle band */
const CALL = {col: 2000, pulses: 8, every: 18, width: 6, rowLo: 40, rowHi: 54};
/** part 1 runs first, part 2 picks the same recording up later, so the scroll continues */
const PART1_SECONDS = 7.5;
const CALL_AT = PART1_SECONDS + 5.4; // seconds of the whole strip, when the call passes the playhead

/** small seeded generator, the same noise in every render tab */
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const RAMP: [number, number, number][] = [
  [9, 6, 16],
  [52, 26, 68],
  [110, 63, 124],
  [184, 99, 143],
  [238, 160, 178],
];
const ramp = (v: number) => {
  const x = Math.max(0, Math.min(0.999, v)) * (RAMP.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  return RAMP[i].map((a, k) => a + (RAMP[i + 1][k] - a) * f);
};

const isCall = (c: number, r: number) => {
  const d = c - CALL.col;
  if (d < 0 || d > CALL.pulses * CALL.every) return 0;
  const inPulse = d % CALL.every < CALL.width;
  if (!inPulse) return 0;
  const centre = (CALL.rowLo + CALL.rowHi) / 2 + Math.sin(d * 0.6) * 2;
  const dist = Math.abs(r - centre) / ((CALL.rowHi - CALL.rowLo) / 2);
  return dist < 1 ? 1 - dist * dist : 0;
};

/** A long noisy spectrogram, the call hidden at the same brightness as the hiss around it. */
const useSpectrogram = () =>
  useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = COLS;
    cv.height = ROWS;
    const g = cv.getContext('2d')!;
    const img = g.createImageData(COLS, ROWS);
    const amp: number[] = [];
    const rnd = mulberry32(7);
    for (let c = 0; c < COLS; c++) {
      const gust = 0.5 + 0.5 * Math.sin(c * 0.013) * Math.sin(c * 0.0041 + 1);
      const drop = rnd() > 0.93 ? rnd() * 0.35 : 0;
      let colSum = 0;
      for (let r = 0; r < ROWS; r++) {
        const hissBand = 0.3 + 0.35 * (1 - r / ROWS); // hiss is strongest high up
        let v = hissBand * (0.45 + 0.55 * rnd()) * (0.75 + 0.3 * gust) + drop * (0.6 + 0.4 * rnd());
        v += isCall(c, r) * 0.32;
        colSum += v;
        const [R, G, B] = ramp(v);
        const o = (r * COLS + c) * 4;
        img.data[o] = R;
        img.data[o + 1] = G;
        img.data[o + 2] = B;
        img.data[o + 3] = 255;
      }
      amp.push(colSum / ROWS);
    }
    g.putImageData(img, 0, 0);
    const mid = WAVE_H / 2;
    let top = `M0 ${mid}`;
    let bot = '';
    for (let c = 0; c < COLS; c += 2) {
      const a = (amp[c] - 0.15) * 1.6 * mid * (0.7 + 0.6 * rnd());
      top += ` L${c * SX} ${mid - a}`;
      bot = ` L${c * SX} ${mid + a}` + bot;
    }
    return {src: cv.toDataURL('image/png'), wave: `${top}${bot} Z`};
  }, []);

const PARTS = {
  1: {
    kicker: 'The bottleneck',
    headlines: [
      [0.3, 'A massive bottleneck.'],
      [2.6, 'Slow. Exhausting.'],
      [4.8, 'Locked behind centralized AI.'],
    ] as [number, string][],
  },
  2: {
    kicker: 'The hard part',
    headlines: [
      [0.3, 'The most tedious job in AI.'],
      [3.8, 'Hours of hiss. One call.'],
    ] as [number, string][],
  },
};

/**
 * The problem: a long, tiring recording full of hiss.
 * Part 1 (script line 2) shows the bottleneck. Part 2 (script line 5) finds the hidden call
 * and ends on "Hard to hear.", which the turning point picks up.
 */
export const Problem: React.FC<{part: 1 | 2}> = ({part}) => {
  const frame = useCurrentFrame();
  const {src, wave} = useSpectrogram();
  const {kicker, headlines} = PARTS[part];
  const t = part === 1 ? frame : frame + sec(PART1_SECONDS); // frames on the whole strip
  const speed = (CALL.col * SX - PLAYHEAD_X) / sec(CALL_AT);
  const scroll = t * speed;
  const callX = CALL.col * SX - scroll;
  const callW = CALL.pulses * CALL.every * SX;
  const box = part === 2 ? springIn(frame, sec(5.1)) : 0;
  const enter = part === 1 ? springIn(frame, 0) : 1;
  const replays = Math.min(31, 9 + Math.floor(t / 14));
  const clock = 2 * 3600 + 14 * 60 + 7 + Math.floor(t * 1.7);
  const hh = String(Math.floor(clock / 3600)).padStart(2, '0');
  const mm = String(Math.floor((clock % 3600) / 60)).padStart(2, '0');
  const ss = String(clock % 60).padStart(2, '0');
  const tired = lerp(t, [sec(2.6), sec(6.5)], [0, 1]);
  const hard = part === 2 ? springIn(frame, sec(6.1)) : 0;
  const chipAt = (s: number) => (part === 1 ? springIn(frame, sec(s)) : 1);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 55%, ${C.plumBg} 0%, ${C.bg} 75%)`,
        fontFamily: INTER,
        color: C.text,
      }}
    >
      <AbsoluteFill style={{opacity: 1 - 0.75 * hard, filter: hard > 0.01 ? `blur(${hard * 6}px)` : undefined}}>
      {/* headline */}
      <div style={{position: 'absolute', left: 120, top: 92}}>
        <Kicker style={riseStyle(enter)}>{kicker}</Kicker>
        <div style={{position: 'relative', height: 90, marginTop: 14}}>
          {headlines.map(([at, txt], i) => {
            const next = headlines[i + 1]?.[0];
            const o = Math.min(springIn(frame, sec(at)), next ? fadeOut(frame, sec(next) - 8, 8) : 1);
            return (
              <div key={txt} style={{position: 'absolute', whiteSpace: 'nowrap', fontSize: 64, fontWeight: 600, letterSpacing: '-0.025em', ...riseStyle(o)}}>
                {txt}
              </div>
            );
          })}
        </div>
      </div>
      {/* the recording */}
      <div style={{position: 'absolute', left: 120, top: 300, ...riseStyle(enter, 40)}}>
        <Glass style={{width: PANEL_W, height: WAVE_H + STRIP_H + 72, overflow: 'hidden', position: 'relative'}}>
          <div style={{position: 'absolute', left: 20, top: 14, right: 20, display: 'flex', justifyContent: 'space-between', fontSize: 16, color: C.muted}}>
            <span style={{fontFamily: MONO}}>post-07 / night_2026-06-14.wav</span>
            <span style={{fontFamily: MONO}}>
              {hh}:{mm}:{ss} / 40:00:00
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 48,
              filter: `blur(${tired * 1.2}px) saturate(${1 - tired * 0.35})`,
            }}
          >
            <svg width={COLS * SX} height={WAVE_H} style={{position: 'absolute', left: -scroll, top: 0}}>
              <path d={wave} fill="rgba(243,245,250,0.32)" />
            </svg>
            <Img src={src} style={{position: 'absolute', left: -scroll, top: WAVE_H + 6, width: COLS * SX, height: STRIP_H}} />
          </div>
          {/* playhead */}
          <div style={{position: 'absolute', left: PLAYHEAD_X, top: 44, width: 2, height: WAVE_H + STRIP_H + 14, background: C.text, opacity: 0.85}} />
          <div style={{position: 'absolute', left: PLAYHEAD_X - 6, top: 40, width: 14, height: 8, borderRadius: 2, background: C.text}} />
          {/* the hidden call, found at last */}
          <div
            style={{
              position: 'absolute',
              left: callX - 10,
              top: 48 + WAVE_H + 6 + (CALL.rowLo / ROWS) * STRIP_H - 14,
              width: callW + 20,
              height: ((CALL.rowHi - CALL.rowLo) / ROWS) * STRIP_H + 28,
              border: `2px dashed ${C.accent2}`,
              borderRadius: 5,
              opacity: box,
              transform: `scale(${1.2 - 0.2 * box})`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -44,
                left: 0,
                whiteSpace: 'nowrap',
                fontSize: 20,
                fontWeight: 600,
                color: '#0b1a1f',
                background: C.accent2,
                padding: '6px 12px',
                borderRadius: 4,
              }}
            >
              one frog call
            </div>
          </div>
        </Glass>
      </div>

      {/* tiring counters */}
      <div style={{position: 'absolute', left: 120, top: 860, display: 'flex', gap: 16}}>
        <div style={riseStyle(chipAt(2.8))}>
          <Chip dot={C.amber}>Replayed {replays} times</Chip>
        </div>
        <div style={riseStyle(chipAt(3.2))}>
          <Chip dot={C.accent}>3 of 1 200 clips labeled</Chip>
        </div>
        <div style={{...riseStyle(chipAt(3.6)), opacity: (part === 1 ? fadeIn(frame, sec(3.6), 10) : 1) * (1 - box)}}>
          <Chip dot={C.faint}>Is that a call? Or rain?</Chip>
        </div>
      </div>
      </AbsoluteFill>
      {part === 2 ? <TurnText hard={hard} easy={0} /> : null}
    </AbsoluteFill>
  );
};
