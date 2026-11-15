import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {riseStyle, springIn} from '../components/anim';
import {Footage, Kicker, Vignette} from '../components/ui';
import {C, INTER} from '../theme';
import {FOOTAGE, sec} from '../timing';

/** Script line 9. The network of posts over the land, a community that teaches the forest to listen. */
export const Community: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: INTER, color: C.text}}>
      <Footage spec={FOOTAGE.networkTopo} zoom={[1.04, 1.12]} dim={0.2} />
      <Vignette strength={0.8} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 55% 40% at 50% 50%, rgba(7,8,15,0.55), rgba(7,8,15,0) 100%)'}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
        <Kicker color={C.accent2} style={riseStyle(springIn(frame, 2))}>
          The result
        </Kicker>
        <div style={{fontSize: 76, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 18, lineHeight: 1.08, ...riseStyle(springIn(frame, sec(0.5)), 34)}}>
          A community that teaches
          <br />
          the forest to listen.
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            marginTop: 36,
            backgroundImage: `linear-gradient(90deg, ${C.cyan}, ${C.violet} 55%, ${C.pink})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            ...riseStyle(springIn(frame, sec(3.8))),
          }}
        >
          Owned by people, not by big tech.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
