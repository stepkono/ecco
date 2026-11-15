import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fadeOut, riseStyle, springIn} from '../components/anim';
import {Chip, Footage, Vignette} from '../components/ui';
import {C, INTER} from '../theme';
import {FOOTAGE, sec} from '../timing';

const WORDS = ['Forests', 'are', 'full', 'of', 'voices.'];
const KINDS: [string, string][] = [
  ['Frogs', C.accent2],
  ['Birds', C.accent],
  ['Insects', C.amber],
];

/** 0:00 Slow spiral B-roll, "Forests are full of voices." word by word, then the three kinds of voices. */
export const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const out = fadeOut(frame, sec(7.0), 12);
  return (
    <AbsoluteFill>
      <Footage spec={FOOTAGE.openingSpiral} zoom={[1.08, 1.18]} dim={0.25} />
      <Vignette strength={0.75} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: out}}>
        <div style={{display: 'flex', gap: 26, fontFamily: INTER, fontSize: 104, fontWeight: 600, letterSpacing: '-0.03em', color: C.text}}>
          {WORDS.map((w, i) => (
            <span key={w} style={riseStyle(springIn(frame, sec(0.5) + i * 5), 34)}>
              {w}
            </span>
          ))}
        </div>
        <div style={{display: 'flex', gap: 16, marginTop: 44, height: 60}}>
          {KINDS.map(([k, col], i) => (
            <div key={k} style={riseStyle(springIn(frame, sec(2.4) + i * 8))}>
              <Chip dot={col} style={{fontSize: 24}}>
                {k}
              </Chip>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: INTER,
            fontSize: 32,
            fontWeight: 400,
            color: C.muted,
            ...riseStyle(springIn(frame, sec(3.9))),
          }}
        >
          Some of them are disappearing, and almost nobody is listening.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
