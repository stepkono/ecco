import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, INTER} from '../theme';
import {PLACED, sec} from '../timing';
import {fadeIn, fadeOut} from './anim';

type Cue = {text: string; start: number; end: number; onScreen: boolean};

const CUES: Cue[] = PLACED.flatMap((scene) =>
  scene.voice.map((line, i) => {
    const next = scene.voice[i + 1];
    const end = next ? scene.start + sec(next.at) - 4 : scene.start + scene.frames - 6;
    return {text: line.text, start: scene.start + sec(line.at), end, onScreen: !!line.onScreen};
  }),
);

/** The script as subtitles. Lines that are already big text on screen are skipped. */
export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const cue = CUES.find((c) => !c.onScreen && frame >= c.start && frame < c.end);
  if (!cue) return null;
  const o = Math.min(fadeIn(frame, cue.start, 6), fadeOut(frame, cue.end - 6, 6));
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 64, pointerEvents: 'none'}}>
      <div
        style={{
          opacity: o,
          fontFamily: INTER,
          fontSize: 34,
          fontWeight: 500,
          color: C.text,
          letterSpacing: '-0.005em',
          padding: '10px 22px',
          borderRadius: 6,
          background: 'rgba(7, 8, 15, 0.62)',
          border: `1px solid ${C.edgeSoft}`,
          backdropFilter: 'blur(14px)',
          maxWidth: 1400,
          textAlign: 'center',
        }}
      >
        {cue.text}
      </div>
    </AbsoluteFill>
  );
};
