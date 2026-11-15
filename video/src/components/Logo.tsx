import React from 'react';
import {RAYS, WORDMARK} from '../logoPaths';
import {C} from '../theme';
import {lerp} from './anim';

/**
 * The ecco Echo Rays logo. `progress` 0..1 draws the rays one by one (the inner rays first),
 * then the wordmark fades in. `withWord` false shows only the mark.
 */
export const Logo: React.FC<{progress: number; height?: number; withWord?: boolean; wordColor?: string}> = ({
  progress,
  height = 120,
  withWord = true,
  wordColor = C.text,
}) => {
  const inner = RAYS[RAYS.length - 1];
  const outer = RAYS.slice(0, -1);
  const vbW = withWord ? 215 : 64;
  return (
    <svg viewBox={`0 0 ${vbW} 64`} height={height} width={(height * vbW) / 64} style={{overflow: 'visible'}}>
      <path
        d={inner.d}
        stroke={inner.color}
        strokeWidth={3.4}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - lerp(progress, [0, 0.25], [0, 1])}
      />
      {outer.map((r, i) => {
        const a = 0.15 + (i / outer.length) * 0.45;
        const p = lerp(progress, [a, a + 0.18], [0, 1]);
        return (
          <path
            key={i}
            d={r.d}
            stroke={r.color}
            strokeWidth={3.4}
            strokeLinecap="round"
            fill="none"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - p}
            opacity={p > 0 ? 1 : 0}
          />
        );
      })}
      {withWord ? (
        <path
          d={WORDMARK}
          fill={wordColor}
          opacity={lerp(progress, [0.55, 0.9], [0, 1])}
          transform={`translate(${lerp(progress, [0.55, 0.95], [-6, 0])} 0)`}
        />
      ) : null}
    </svg>
  );
};
