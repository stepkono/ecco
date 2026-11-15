import {Composition} from 'remotion';
import {Pitch, pitchSchemaDefaults} from './Pitch';
import {FPS, TOTAL_FRAMES} from './timing';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="EccoPitch"
    component={Pitch}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1920}
    height={1080}
    defaultProps={pitchSchemaDefaults}
  />
);
