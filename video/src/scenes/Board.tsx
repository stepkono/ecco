import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {fadeIn, lerp, riseStyle, springIn} from '../components/anim';
import {Footage, Glass, Kicker, Vignette} from '../components/ui';
import {C, INTER} from '../theme';
import {FOOTAGE, sec} from '../timing';

/** shot changes inside the scene, in seconds */
const STUDIO_AT = 5.0;
const TREE_AGAIN_AT = 10.6;

/** A thin line from a panel to a point on the post, drawn in, with a dot at the end. */
const Leader: React.FC<{from: [number, number]; to: [number, number]; p: number}> = ({from, to, p}) => {
  const x = from[0] + (to[0] - from[0]) * p;
  const y = from[1] + (to[1] - from[1]) * p;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <line x1={from[0]} y1={from[1]} x2={x} y2={y} stroke="rgba(255,255,255,0.85)" strokeWidth={1.5} />
      <circle cx={to[0]} cy={to[1]} r={7 * p} fill="none" stroke="#fff" strokeWidth={1.5} opacity={p} />
      <circle cx={to[0]} cy={to[1]} r={3 * p} fill="#fff" opacity={p} />
    </svg>
  );
};

const Callout: React.FC<{
  at: number;
  left: number;
  top: number;
  width: number;
  anchor?: [number, number];
  target?: [number, number];
  kicker: string;
  kickerColor: string;
  title: string;
  big?: boolean;
  sub: string;
}> = ({at, left, top, width, anchor, target, kicker, kickerColor, title, big, sub}) => {
  const frame = useCurrentFrame();
  const p = springIn(frame, at);
  const line = lerp(frame, [at + 6, at + 22], [0, 1]);
  return (
    <>
      {anchor && target ? <Leader from={anchor} to={target} p={line} /> : null}
      <div style={{position: 'absolute', left, top, width, ...riseStyle(p)}}>
        <Glass strong style={{padding: '22px 26px'}}>
          <Kicker color={kickerColor} style={{fontSize: 15}}>
            {kicker}
          </Kicker>
          <div style={{fontSize: big ? 76 : 40, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 8, lineHeight: 1.05}}>{title}</div>
          <div style={{fontSize: 22, color: C.muted, marginTop: 10, lineHeight: 1.35}}>{sub}</div>
        </Glass>
      </div>
    </>
  );
};

/** "Meet ecco." on the post in the forest */
const Tree: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: INTER, color: C.text}}>
      <Footage spec={FOOTAGE.postOnTree} zoom={[1.04, 1.12]} origin="50% 40%" />
      <Vignette strength={0.5} bottom={0.75} />
      <div style={{position: 'absolute', left: 120, bottom: 150}}>
        <div style={{fontSize: 128, fontWeight: 700, letterSpacing: '-0.04em', ...riseStyle(springIn(frame, sec(0.4)), 40)}}>Meet ecco.</div>
        <div style={{fontSize: 36, fontWeight: 500, color: 'rgba(243,245,250,0.82)', marginTop: 6, ...riseStyle(springIn(frame, sec(1.5)))}}>
          Small listening posts in the forest.
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** The open post: the board, milliseconds, habitats */
const Studio: React.FC = () => {
  const frame = useCurrentFrame();
  const d = (s: number) => sec(s - STUDIO_AT);
  return (
    <AbsoluteFill style={{fontFamily: INTER, color: C.text, opacity: fadeIn(frame, 0, 10)}}>
      <Footage spec={FOOTAGE.postStudio} zoom={[1.0, 1.07]} origin="50% 45%" dim={0.18} />
      <Vignette strength={0.55} />
      <Callout
        at={d(5.3)}
        left={150}
        top={300}
        width={480}
        anchor={[630, 400]}
        target={[830, 470]}
        kicker="Built on"
        kickerColor={C.accent2}
        title="Arduino UNO Q"
        sub="The AI runs right on the board."
      />
      <Callout
        at={d(6.3)}
        left={1300}
        top={200}
        width={470}
        anchor={[1300, 310]}
        target={[1120, 420]}
        kicker="Recognizes calls in"
        kickerColor={C.accent}
        title="about 9 ms"
        big
        sub="On the spot. No cloud needed."
      />
      <Callout
        at={d(8.0)}
        left={1300}
        top={600}
        width={470}
        kicker="For conservation"
        kickerColor={C.amber}
        title="Maps habitats"
        sub="Tracks endangered species over time."
      />
    </AbsoluteFill>
  );
};

/** Back in the forest: privacy on the device, so posts can stand in busy parks */
const TreeAgain: React.FC = () => {
  const frame = useCurrentFrame();
  const d = (s: number) => sec(s - TREE_AGAIN_AT);
  return (
    <AbsoluteFill style={{fontFamily: INTER, color: C.text, opacity: fadeIn(frame, 0, 10)}}>
      <Footage spec={FOOTAGE.postOnTreeClose} zoom={[1.22, 1.3]} origin="52% 42%" />
      <Vignette strength={0.55} />
      <Callout
        at={d(10.9)}
        left={1250}
        top={250}
        width={500}
        kicker="Privacy on the device"
        kickerColor={C.orange}
        title="Speech removed"
        sub="Human voices never leave the post."
      />
      <Callout
        at={d(13.5)}
        left={1250}
        top={560}
        width={500}
        kicker="Works in busy places"
        kickerColor={C.accent2}
        title="National parks"
        sub="Visitors walk by. Only nature is heard."
      />
    </AbsoluteFill>
  );
};

/** Script line 3. Meet ecco: the post on a tree, the open post with callouts, back to the forest. */
export const Board: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={sec(STUDIO_AT) + 10}>
      <Tree />
    </Sequence>
    <Sequence from={sec(STUDIO_AT)} durationInFrames={sec(TREE_AGAIN_AT - STUDIO_AT) + 10}>
      <Studio />
    </Sequence>
    <Sequence from={sec(TREE_AGAIN_AT)}>
      <TreeAgain />
    </Sequence>
  </AbsoluteFill>
);
