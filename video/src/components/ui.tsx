import React from 'react';
import {AbsoluteFill, OffthreadVideo, getStaticFiles, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, INTER, RADIUS} from '../theme';
import {FPS, FootageSpec} from '../timing';
import {lerp} from './anim';

export const hasStatic = (path: string) => getStaticFiles().some((f) => f.name === path);

/** Frosted glass with the thin bright border, like every panel in ecco. */
export const Glass: React.FC<{style?: React.CSSProperties; strong?: boolean; children?: React.ReactNode}> = ({
  style,
  strong,
  children,
}) => (
  <div
    style={{
      background: strong ? C.glassStrong : C.glass,
      border: `1px solid ${C.edge}`,
      borderRadius: RADIUS,
      backdropFilter: 'blur(22px)',
      WebkitBackdropFilter: 'blur(22px)',
      color: C.text,
      fontFamily: INTER,
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * A footage shot that fills the frame, with a slow push (zoom from, zoom to over the shot).
 * If the file is missing, a quiet placeholder with the file name is drawn, so the timing still works.
 */
export const Footage: React.FC<{
  spec: FootageSpec;
  zoom?: [number, number];
  origin?: string;
  dim?: number;
  blur?: number;
  style?: React.CSSProperties;
}> = ({spec, zoom = [1, 1.06], origin = '50% 50%', dim = 0, blur = 0, style}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const scale = lerp(frame, [0, durationInFrames], zoom, (t) => t);
  if (!hasStatic(spec.src)) {
    return (
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 60%, ${C.plumFog}, ${C.plumBg} 70%)`,
          alignItems: 'center',
          justifyContent: 'center',
          color: C.faint,
          fontFamily: INTER,
          fontSize: 22,
        }}
      >
        missing: {spec.src}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{overflow: 'hidden', ...style}}>
      <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: origin, filter: blur ? `blur(${blur}px)` : undefined}}>
        <OffthreadVideo
          src={staticFile(spec.src)}
          trimBefore={Math.round(spec.from * FPS)}
          playbackRate={spec.rate}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>
      {dim > 0 ? <AbsoluteFill style={{background: `rgba(7, 8, 15, ${dim})`}} /> : null}
    </AbsoluteFill>
  );
};

/** Darkens the edges so white text stays readable on bright footage. */
export const Vignette: React.FC<{strength?: number; bottom?: number}> = ({strength = 0.55, bottom = 0}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 70% at 50% 45%, rgba(7,8,15,0) 40%, rgba(7,8,15,${strength}) 100%)${
        bottom ? `, linear-gradient(to top, rgba(7,8,15,${bottom}) 0%, rgba(7,8,15,0) 40%)` : ''
      }`,
    }}
  />
);

/** Small uppercase label above a headline. */
export const Kicker: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({
  children,
  color = C.accent,
  style,
}) => (
  <div
    style={{
      fontFamily: INTER,
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

/** A small glass chip with a coloured dot, like the status chips in the app. */
export const Chip: React.FC<{dot?: string; children: React.ReactNode; style?: React.CSSProperties; pulse?: number}> = ({
  dot,
  children,
  style,
  pulse = 1,
}) => (
  <Glass style={{display: 'inline-flex', alignItems: 'center', gap: 12, padding: '12px 18px', fontSize: 22, fontWeight: 500, ...style}}>
    {dot ? (
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          background: dot,
          boxShadow: `0 0 ${12 * pulse}px ${dot}`,
          opacity: 0.6 + 0.4 * pulse,
        }}
      />
    ) : null}
    {children}
  </Glass>
);
