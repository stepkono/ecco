import React from 'react';
import {AbsoluteFill, Easing, Sequence, useCurrentFrame} from 'remotion';
import {fadeIn, lerp, riseStyle, springIn} from '../components/anim';
import {Logo} from '../components/Logo';
import {Footage} from '../components/ui';
import {C, INTER} from '../theme';
import {FOOTAGE, PUNCHLINE, sec} from '../timing';

const LOGO_AT = 4.2;

const Voxels: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: INTER}}>
      <Footage spec={FOOTAGE.outro} zoom={[1.0, 1.05]} />
      <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(7,8,15,0.85) 0%, rgba(7,8,15,0) 32%)'}} />
      <div style={{position: 'absolute', bottom: 92, width: '100%', textAlign: 'center'}}>
        <div style={{fontSize: 48, fontWeight: 500, color: 'rgba(243,245,250,0.78)', letterSpacing: '-0.02em', ...riseStyle(springIn(frame, sec(0.3)))}}>
          Forests are full of voices.
        </div>
        <div style={{fontSize: 56, fontWeight: 600, color: C.text, letterSpacing: '-0.025em', marginTop: 10, ...riseStyle(springIn(frame, sec(1.9)))}}>
          Now everyone can help them be heard.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = lerp(frame, [6, 6 + sec(1.8)], [0, 1], Easing.out(Easing.cubic));
  const glow = lerp(frame, [sec(1.2), sec(3)], [0, 1]);
  return (
    <AbsoluteFill
      style={{
        opacity: fadeIn(frame, 0, 14),
        background: `radial-gradient(ellipse 60% 55% at 50% 50%, ${C.plumFog} 0%, ${C.plumBg} 50%, ${C.bg} 100%)`,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: INTER,
        color: C.text,
      }}
    >
      <div style={{filter: `drop-shadow(0 0 ${30 * glow}px rgba(197,158,242,${0.35 * glow}))`, transform: `scale(${0.96 + 0.04 * springIn(frame, 0, 200, 50)})`}}>
        <Logo progress={draw} height={168} />
      </div>
      <div style={{fontSize: 52, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 54, ...riseStyle(springIn(frame, sec(0.5)))}}>
        Help the forest listen.
      </div>
      <div style={{display: 'flex', gap: 34, marginTop: 30}}>
        {PUNCHLINE.map((line, i) => (
          <div key={line} style={{fontSize: 28, fontWeight: 500, color: [C.accent2, C.violet, C.accent][i], ...riseStyle(springIn(frame, sec(1.4) + i * 8))}}>
            {line}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', bottom: 70, fontSize: 18, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.faint, ...riseStyle(springIn(frame, sec(2.2)))}}>
        Junction 2026
      </div>
    </AbsoluteFill>
  );
};

/** Script line 10. The voxel outro with the closing lines, then the ecco logo and the punchline. */
export const Outro: React.FC = () => (
  <AbsoluteFill style={{background: C.bg}}>
    <Sequence durationInFrames={sec(LOGO_AT) + 16}>
      <Voxels />
    </Sequence>
    <Sequence from={sec(LOGO_AT)}>
      <EndCard />
    </Sequence>
  </AbsoluteFill>
);
