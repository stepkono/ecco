import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {fadeIn, lerp, riseStyle, springIn} from '../components/anim';
import {Footage} from '../components/ui';
import {C, INTER} from '../theme';
import {FOOTAGE, sec} from '../timing';

const SEE_AT = 0.5; // "Easy to see." and the landscape starts to build

/**
 * "Hard to hear." over "Easy to see.", always in the same place,
 * so the hiss scene can end on the first line and this scene adds the second.
 */
export const TurnText: React.FC<{hard: number; easy: number; lift?: number}> = ({hard, easy, lift = 0}) => {
  const frame = useCurrentFrame();
  const jitter = (random(`j${frame}`) - 0.5) * 6 * (1 - easy);
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: INTER,
        opacity: 1 - lift,
        transform: `translateY(${-lift * 40}px)`,
      }}
    >
      <div
        style={{
          fontSize: 112,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: C.muted,
          transform: `translateX(${jitter}px) translateY(${(1 - hard) * 20}px)`,
          filter: `blur(${1.6 * (1 - easy) + (1 - hard) * 8}px)`,
          opacity: hard * (1 - 0.45 * easy),
        }}
      >
        Hard to hear.
      </div>
      <div
        style={{
          fontSize: 132,
          fontWeight: 700,
          letterSpacing: '-0.035em',
          marginTop: 8,
          backgroundImage: `linear-gradient(90deg, ${C.cyan}, ${C.violet} 55%, ${C.pink})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          ...riseStyle(easy, 30),
        }}
      >
        Easy to see.
      </div>
    </AbsoluteFill>
  );
};

/** Animated hiss, a grainy layer that dies away when the picture takes over. */
const Hiss: React.FC<{opacity: number}> = ({opacity}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity}}>
      <filter id="hiss">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 12} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width={1920} height={1080} filter="url(#hiss)" />
    </svg>
  );
};

/** Script line 6. "Easy to see." joins "Hard to hear." and the landscape builds behind it. */
export const TurningPoint: React.FC = () => {
  const frame = useCurrentFrame();
  const easy = springIn(frame, sec(SEE_AT), 30);
  const lift = lerp(frame, [sec(2.8), sec(3.9)], [0, 1]);
  const bg = fadeIn(frame, sec(SEE_AT) - 6, 18);
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill style={{opacity: bg}}>
        <Footage spec={FOOTAGE.reveal} zoom={[1, 1.05]} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: `rgba(7,8,15,${0.6 - 0.55 * lift})`}} />
      <Hiss opacity={0.16 * (1 - bg)} />
      <TurnText hard={1} easy={easy} lift={lift} />
    </AbsoluteFill>
  );
};
