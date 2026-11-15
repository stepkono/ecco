import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {fadeIn, fadeOut, lerp, riseStyle, springIn} from '../components/anim';
import {Glass, Kicker} from '../components/ui';
import {C, INTER, MONO} from '../theme';
import {sec} from '../timing';

type P = [number, number];
const POST: P = [560, 770];
const SERVER: P = [960, 380];
const PEOPLE: P = [1360, 770];

/** quadratic curve from a to b, bent away from the centre of the loop */
const CENTRE: P = [960, 650];
const curve = (a: P, b: P, bend = 0.35) => {
  const m: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const c: P = [m[0] + (m[0] - CENTRE[0]) * bend * 2, m[1] + (m[1] - CENTRE[1]) * bend * 2];
  const at = (t: number): P => [
    (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
    (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
  ];
  return {d: `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`, at};
};

const ARCS = [
  {c: curve(POST, SERVER), t0: 0.9, t1: 2.1, color: C.amber, label: '5 s snippet'},
  {c: curve(SERVER, PEOPLE), t0: 2.1, t1: 3.3, color: C.accent2, label: '3D landscape'},
  {c: curve(PEOPLE, POST, 0.22), t0: 3.9, t1: 5.7, color: C.accent, label: 'label: treefrog'},
];

const Icon: React.FC<{kind: 'post' | 'server' | 'people'; color: string}> = ({kind, color}) => (
  <svg width={44} height={44} viewBox="0 0 44 44" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    {kind === 'post' ? (
      <>
        <path d="M14 8h16l3 5v23a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V13z" />
        <path d="M11 13h22" />
        <circle cx={22} cy={28} r={3} />
      </>
    ) : kind === 'server' ? (
      <>
        <rect x={8} y={8} width={28} height={11} rx={2.5} />
        <rect x={8} y={25} width={28} height={11} rx={2.5} />
        <path d="M14 13.5h2M14 30.5h2" />
      </>
    ) : (
      <>
        <circle cx={16} cy={16} r={5} />
        <circle cx={30} cy={18} r={4} />
        <path d="M7 35c1-6 5-9 9-9s8 3 9 9M25 34c.8-4.5 3-6.5 6-6.5s5 2 6 6.5" />
      </>
    )}
  </svg>
);

const Node: React.FC<{at: P; kind: 'post' | 'server' | 'people'; title: string; status: string; statusColor: string; delay: number; glow?: number; intro: number}> = ({
  at,
  kind,
  title,
  status,
  statusColor,
  delay,
  glow = 0,
  intro,
}) => {
  const p = springIn(intro, delay);
  return (
    <div style={{position: 'absolute', left: at[0] - 170, top: at[1] - 62, width: 340, ...riseStyle(p)}}>
      <Glass
        strong
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '20px 22px',
          borderColor: glow > 0 ? `rgba(127, 220, 240, ${0.26 + glow * 0.6})` : C.edge,
          boxShadow: glow > 0 ? `0 0 ${40 * glow}px rgba(127, 220, 240, ${0.35 * glow})` : undefined,
        }}
      >
        <Icon kind={kind} color={C.text} />
        <div>
          <div style={{fontSize: 28, fontWeight: 600, letterSpacing: '-0.015em'}}>{title}</div>
          <div style={{fontSize: 19, color: statusColor, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8}}>
            <span style={{width: 8, height: 8, borderRadius: 2, background: statusColor}} />
            {status}
          </div>
        </div>
      </Glass>
    </div>
  );
};

const PHASES = {
  ask: {kicker: 'Human in the loop', title: 'It asks the community.'},
  learn: {kicker: 'Back to the forest', title: 'Every label tunes the post.'},
};

/**
 * The loop: post, server, people labeling, and the label back on the post in about 2 s.
 * One story timeline in seconds. Phase "ask" (script line 4) plays it up to the painting,
 * phase "learn" (script line 8) picks it up at the Send label press.
 */
export const Loop: React.FC<{phase: 'ask' | 'learn'}> = ({phase}) => {
  const real = useCurrentFrame();
  const t = phase === 'ask' ? Math.min(3.4, (real / 30) * 0.62) : 3.4 + (real / 30) * 1.1;
  const frame = t * 30; // story frames
  const intro = phase === 'ask' ? real : 1000; // the learn phase starts with everything in place
  const learned = springIn(frame, sec(5.8));
  const recognised = springIn(frame, sec(6.4));
  const timer = lerp(frame, [sec(3.9), sec(5.7)], [0, 1.8], (x) => x);
  const timerOn = phase === 'learn' ? fadeIn(frame, sec(3.7), 8) : 0;
  const pressed = t >= 3.55 && t < 3.75;
  const out = 1;
  const {kicker, title} = PHASES[phase];

  const postStatus = t < 0.9 ? 'listening' : t < 5.8 ? 'not sure, asks for help' : t < 7.0 ? 'learned treefrog' : 'recognized treefrog';
  const postColor = t < 0.9 ? C.muted : t < 5.8 ? C.amber : C.accent2;
  const peopleStatus = t < 3.3 ? 'waiting' : t < 3.6 ? 'painting the call' : 'sent: treefrog';

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 70% 60% at 50% 60%, ${C.plumFog} 0%, ${C.plumBg} 55%, ${C.bg} 100%)`,
        fontFamily: INTER,
        color: C.text,
        opacity: out,
      }}
    >
      <div style={{position: 'absolute', top: 96, width: '100%', textAlign: 'center'}}>
        <Kicker style={{...riseStyle(springIn(real, 0))}}>{kicker}</Kicker>
        <div style={{fontSize: 72, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 12, ...riseStyle(springIn(real, sec(0.3)))}}>
          {title}
        </div>
      </div>

      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        {ARCS.map((a, i) => {
          const base = fadeIn(intro, 10 + i * 6, 14);
          const p = lerp(t, [a.t0, a.t1], [0, 1], Easing.inOut(Easing.quad));
          const done = learned > 0.01 ? 1 : 0;
          return (
            <g key={i}>
              <path d={a.c.d} stroke="rgba(255,255,255,0.2)" strokeWidth={2} fill="none" strokeDasharray="2 10" strokeLinecap="round" opacity={base} />
              <path d={a.c.d} stroke={a.color} strokeWidth={2.5} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} opacity={0.9 - 0.3 * done} />
            </g>
          );
        })}
        {ARCS.map((a, i) => {
          const p = lerp(t, [a.t0, a.t1], [0, 1], Easing.inOut(Easing.quad));
          if (t < a.t0 || t > a.t1 + 0.15) return null;
          const [x, y] = a.c.at(p);
          return (
            <g key={`dot${i}`}>
              <circle cx={x} cy={y} r={14} fill={a.color} filter="url(#glow)" opacity={0.9} />
              <circle cx={x} cy={y} r={6} fill="#fff" />
            </g>
          );
        })}
      </svg>

      {/* packet labels */}
      {ARCS.map((a, i) => {
        if (t < a.t0 - 0.1 || t > a.t1 + 0.2) return null;
        const p = lerp(t, [a.t0, a.t1], [0, 1], Easing.inOut(Easing.quad));
        const [x, y] = a.c.at(p);
        const o = Math.min(fadeIn(frame, sec(a.t0), 6), fadeOut(frame, sec(a.t1), 6));
        return (
          <div key={`lab${i}`} style={{position: 'absolute', left: x + 22, top: y - 46, opacity: o, whiteSpace: 'nowrap'}}>
            <Glass strong style={{padding: '6px 12px', fontSize: 18, fontWeight: 600, color: a.color}}>
              {a.label}
            </Glass>
          </div>
        );
      })}

      <Node at={POST} kind="post" title="Listening post" status={postStatus} statusColor={postColor} delay={4} glow={learned} intro={intro} />
      <Node at={SERVER} kind="server" title="ecco server" status={t < 2.1 ? 'ready' : 'turns sound into 3D'} statusColor={C.muted} delay={10} intro={intro} />
      <Node at={PEOPLE} kind="people" title="People label" status={peopleStatus} statusColor={t < 3.3 ? C.muted : C.accent} delay={16} intro={intro} />

      {/* the Send label press */}
      <div
        style={{
          position: 'absolute',
          left: PEOPLE[0] - 90,
          top: PEOPLE[1] + 80,
          opacity: phase === 'learn' ? fadeOut(frame, sec(4.6), 10) : 0,
          transform: `scale(${pressed ? 0.94 : 1})`,
        }}
      >
        <div style={{background: C.blue, color: '#fff', fontSize: 20, fontWeight: 600, padding: '10px 26px', borderRadius: 5}}>Send label</div>
      </div>

      {/* label to post timer */}
      <div style={{position: 'absolute', left: CENTRE[0] - 160, top: CENTRE[1] - 40, width: 320, textAlign: 'center', opacity: timerOn}}>
        <div style={{fontFamily: MONO, fontSize: 64, fontWeight: 600, letterSpacing: '-0.02em', color: learned > 0.5 ? C.accent2 : C.text}}>
          {timer.toFixed(1)} s
        </div>
        <div style={{fontSize: 20, color: C.muted, marginTop: 4}}>from label to post</div>
      </div>

      {/* recognised on its own */}
      <div style={{position: 'absolute', left: POST[0] - 170, top: POST[1] + 90, width: 340, ...riseStyle(recognised)}}>
        <Glass style={{padding: '12px 18px', fontSize: 19, color: C.muted}}>
          Next recording: <span style={{color: C.accent2, fontWeight: 600}}>treefrog, recognized on the post</span>
        </Glass>
      </div>
    </AbsoluteFill>
  );
};
