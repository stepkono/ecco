import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {fadeIn, riseStyle, springIn} from '../components/anim';
import {Footage, Glass} from '../components/ui';
import {C, INTER} from '../theme';
import {FOOTAGE, FootageSpec, sec} from '../timing';

type Shot = {spec: FootageSpec; at: number; step: string; title: string; sub: string; color: string; zoom: [number, number]; origin?: string};

/** shot starts in seconds inside the scene, matched to "Follow the trace, paint the call, then give your finding a name." */
const SHOTS: Shot[] = [
  {spec: FOOTAGE.playback, at: 0, step: '1', title: 'Play', sub: 'Follow the trace through the landscape', color: C.blue, zoom: [1.02, 1.1]},
  {spec: FOOTAGE.brush, at: 4.8, step: '2', title: 'Paint', sub: 'Brush the call into its own layer', color: C.accent, zoom: [1.08, 1.14], origin: '50% 55%'},
  {spec: FOOTAGE.labeling, at: 6.6, step: '3', title: 'Name', sub: 'Give your finding a name', color: C.accent2, zoom: [1.28, 1.36], origin: '86% 24%'},
];
const SCENE_SECONDS = 9;

const StepCard: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const p = springIn(frame, 6);
  return (
    <div style={{position: 'absolute', left: 300, top: 140, ...riseStyle(p)}}>
      <Glass strong style={{display: 'flex', alignItems: 'center', gap: 18, padding: '16px 24px 16px 16px'}}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 5,
            background: shot.color,
            color: '#12131c',
            fontSize: 24,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {shot.step}
        </div>
        <div>
          <div style={{fontSize: 34, fontWeight: 600, letterSpacing: '-0.02em'}}>{shot.title}</div>
          <div style={{fontSize: 19, color: C.muted, marginTop: 2}}>{shot.sub}</div>
        </div>
      </Glass>
    </div>
  );
};

/** Script line 7. Play, paint, name: three screen recordings with step cards. */
export const Landscape: React.FC = () => (
  <AbsoluteFill style={{fontFamily: INTER, color: C.text, background: C.bg}}>
    {SHOTS.map((shot, i) => (
      <Sequence key={shot.title} from={sec(shot.at)} durationInFrames={sec((SHOTS[i + 1]?.at ?? SCENE_SECONDS + 0.4) - shot.at) + 12}>
        <ShotView shot={shot} first={i === 0} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

const ShotView: React.FC<{shot: Shot; first: boolean}> = ({shot, first}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: first ? 1 : fadeIn(frame, 0, 10)}}>
      <Footage spec={shot.spec} zoom={shot.zoom} origin={shot.origin} />
      <StepCard shot={shot} />
    </AbsoluteFill>
  );
};
