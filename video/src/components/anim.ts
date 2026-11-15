import {Easing, interpolate, spring} from 'remotion';
import {FPS} from '../timing';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** A calm spring from 0 to 1 that starts at `delay` frames. */
export const springIn = (frame: number, delay = 0, damping = 200, durationInFrames?: number) =>
  spring({frame: frame - delay, fps: FPS, config: {damping, mass: 0.9}, durationInFrames});

/** Rise into place with a soft blur, the motion used for every text and panel. */
export const riseStyle = (p: number, distance = 26): React.CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * distance}px)`,
  filter: p < 0.999 ? `blur(${(1 - p) * 10}px)` : undefined,
});

/** 1 until `start`, then fades to 0 over `len` frames. */
export const fadeOut = (frame: number, start: number, len = 12) =>
  interpolate(frame, [start, start + len], [1, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});

export const fadeIn = (frame: number, start: number, len = 12) =>
  interpolate(frame, [start, start + len], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});

export const lerp = (frame: number, input: number[], output: number[], ease = Easing.inOut(Easing.cubic)) =>
  interpolate(frame, input, output, {...clamp, easing: ease});
