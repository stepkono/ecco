import type * as THREE from 'three';
import type { Theme } from './themes';

/**
 * Contract between SpectroView (scene.ts) and a self-contained display mode
 * that lives in its own file (for example disc.ts).
 *
 * Coordinates: "canonical" space is the original spectrogram layout.
 *   x = time,      -WORLD_W/2 .. WORLD_W/2   (WORLD_W = 16), x = ctx.xOfFrame(t)
 *   z = frequency,  WORLD_D/2 .. -WORLD_D/2  (WORLD_D = 9, mel warped), z = ctx.zOfHz(k * ctx.BIN_HZ)
 *   y = amplitude,  0 .. WORLD_H (2.4), more when layers are unfolded
 * The mode maps canonical points to its own display space. Its object is added
 * to the scene root with an identity transform.
 */
export interface ModeCtx {
  frames: number; // T
  nBins: number; // N_BINS = 257
  BIN_HZ: number;
  WORLD_W: number;
  WORLD_D: number;
  WORLD_H: number;
  /** canonical height per cell, index t * nBins + k */
  heights: Float32Array;
  /** linear RGB per cell (theme ramp plus painted layers), index (t * nBins + k) * 3 */
  colors: Float32Array;
  xOfFrame(t: number): number;
  zOfHz(hz: number): number;
  /** axis spacing sliders (1 = default). t = time, f = frequency, a = amplitude */
  axis: { t: number; f: number; a: number };
  /** 0.1 .. 1, lower = fewer, bigger cells */
  res: number;
  theme: Theme;
  /** wrap every material you create with this, so the scene fog applies */
  fog<M extends THREE.Material>(m: M): M;
}

export interface PickCloud {
  /** display positions, xyz per point */
  pos: Float32Array;
  /** fractional frame and bin of each point */
  t: Float32Array;
  k: Float32Array;
  count: number;
}

export interface ModeView {
  readonly object: THREE.Object3D;
  /** geom = heights, layout or axis changed. Otherwise only colours changed (brush strokes). */
  update(ctx: ModeCtx, geom: boolean): void;
  /** canonical (x, y, z) -> display position, used for the brush cursor and other overlays */
  toDisplay(cx: number, cy: number, cz: number, out: THREE.Vector3): THREE.Vector3;
  /** points the pick ray is tested against */
  pickCloud(): PickCloud;
  /** a good orbit target and camera distance for this mode */
  frame(): { target: THREE.Vector3; distance: number };
  dispose(): void;
}
