import React from 'react';
import {Audio, getStaticFiles, interpolate} from 'remotion';
import {TOTAL_FRAMES} from '../timing';

/** Finds public/footage/audio/<name>.<any extension>. `npm run media` links video/audio/ there. */
const find = (name: string) =>
  getStaticFiles().find((f) => f.name.startsWith(`footage/audio/${name}.`) && !f.name.endsWith('.txt'));

/**
 * Voice and music slots. Each one plays only if the file exists, so the video renders silent
 * until you drop video/audio/voice.mp3 (or .wav, .m4a) and video/audio/music.mp3 and run `npm run media`.
 * The music fades in and out and ducks a little while the voice is on.
 */
export const Soundtrack: React.FC<{musicVolume: number; voiceVolume: number}> = ({musicVolume, voiceVolume}) => {
  const voice = find('voice');
  const music = find('music');
  const duck = voice ? 0.6 : 1;
  return (
    <>
      {voice ? <Audio src={voice.src} volume={voiceVolume} /> : null}
      {music ? (
        <Audio
          src={music.src}
          volume={(f) =>
            musicVolume *
            duck *
            interpolate(f, [0, 30, TOTAL_FRAMES - 75, TOTAL_FRAMES], [0, 1, 1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      ) : null}
    </>
  );
};
