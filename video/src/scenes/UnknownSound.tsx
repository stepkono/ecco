import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fadeOut, riseStyle, springIn} from '../components/anim';
import {Footage, Glass, Kicker} from '../components/ui';
import {C, INTER, MONO} from '../theme';
import {FOOTAGE, sec} from '../timing';

/** Script line 5, first sentence. The live recordings the post could not name, as they arrive on ecco. */
export const UnknownSound: React.FC = () => {
  const frame = useCurrentFrame();
  const card = Math.min(springIn(frame, sec(0.4)), fadeOut(frame, sec(4.6), 10));
  return (
    <AbsoluteFill style={{fontFamily: INTER, color: C.text}}>
      <Footage spec={FOOTAGE.liveRecording} zoom={[1.0, 1.04]} />
      <div style={{position: 'absolute', right: 70, top: 300, width: 450, ...riseStyle(card)}}>
        <Glass strong style={{padding: '22px 24px'}}>
          <Kicker color={C.amber} style={{fontSize: 14}}>
            Unsure on the post
          </Kicker>
          <div style={{fontSize: 34, fontWeight: 600, marginTop: 10}}>Engine noise?</div>
          <div style={{fontFamily: MONO, fontSize: 17, color: C.muted, marginTop: 8}}>post-03 · Nuuksio wetland edge</div>
          <div style={{height: 1, background: C.edgeSoft, margin: '16px 0'}} />
          <div style={{fontSize: 20, color: C.muted, lineHeight: 1.4}}>The machine cannot name it. These are the sounds that matter most.</div>
        </Glass>
      </div>
    </AbsoluteFill>
  );
};
