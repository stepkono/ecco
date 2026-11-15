import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {fadeIn} from './components/anim';
import {Soundtrack} from './components/Soundtrack';
import {Subtitles} from './components/Subtitles';
import {C} from './theme';
import {CROSSFADE, PLACED, SceneId} from './timing';
import {Opening} from './scenes/Opening';
import {Problem} from './scenes/Problem';
import {Board} from './scenes/Board';
import {Loop} from './scenes/Loop';
import {UnknownSound} from './scenes/UnknownSound';
import {TurningPoint} from './scenes/TurningPoint';
import {Landscape} from './scenes/Landscape';
import {Archive} from './scenes/Archive';
import {Community} from './scenes/Community';
import {Outro} from './scenes/Outro';

export type PitchProps = {
  /** draw the script as subtitles */
  subtitles: boolean;
  musicVolume: number;
  voiceVolume: number;
};

export const pitchSchemaDefaults: PitchProps = {subtitles: true, musicVolume: 0.35, voiceVolume: 1};

const SCENE_COMPONENTS: Record<SceneId, React.FC> = {
  opening: Opening,
  problem: () => <Problem part={1} />,
  board: Board,
  askCommunity: () => <Loop phase="ask" />,
  unknownSound: UnknownSound,
  hiss: () => <Problem part={2} />,
  turningPoint: TurningPoint,
  landscape: Landscape,
  archive: Archive,
  learn: () => <Loop phase="learn" />,
  community: Community,
  outro: Outro,
};

/** Fades a scene in over the previous one, which keeps playing underneath for CROSSFADE frames. */
const FadeInWrap: React.FC<{first: boolean; children: React.ReactNode}> = ({first, children}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{opacity: first ? 1 : fadeIn(frame, 0, CROSSFADE)}}>{children}</AbsoluteFill>;
};

export const Pitch: React.FC<PitchProps> = ({subtitles, musicVolume, voiceVolume}) => (
  <AbsoluteFill style={{background: C.bg}}>
    {PLACED.map((s, i) => {
      const Scene = SCENE_COMPONENTS[s.id];
      const last = i === PLACED.length - 1;
      return (
        <Sequence key={s.id} name={s.id} from={s.start} durationInFrames={s.frames + (last ? 0 : CROSSFADE)}>
          <FadeInWrap first={i === 0}>
            <Scene />
          </FadeInWrap>
        </Sequence>
      );
    })}
    {subtitles ? <Subtitles /> : null}
    <Soundtrack musicVolume={musicVolume} voiceVolume={voiceVolume} />
  </AbsoluteFill>
);
