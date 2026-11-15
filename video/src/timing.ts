/**
 * The one place to change the timing of the video.
 *
 * - `seconds` is the length of each scene. The scenes play in this order.
 *   The total must stay 90 s for the 1:30 cut (TOTAL_SECONDS below).
 * - `voice` holds the script lines (final script, about 210 words, about 2.3 words per second).
 *   `at` is the second inside the scene where the line starts.
 *   The lines drive the optional subtitles. Move `at` to match a recorded voiceover.
 * - `onScreen: true` means the line is already shown as big text, so no subtitle is drawn.
 * - `FOOTAGE` says which clip each shot uses, where in the clip it starts (seconds) and its speed.
 *
 * Smaller beats inside a scene (when a callout appears) are set with sec(...) in the scene files.
 */

export const FPS = 30;
/** frames the next scene needs to fade in over the previous one */
export const CROSSFADE = 12;

export type VoiceLine = {text: string; at: number; onScreen?: boolean};

export type SceneId =
  | 'opening'
  | 'problem'
  | 'board'
  | 'askCommunity'
  | 'unknownSound'
  | 'hiss'
  | 'turningPoint'
  | 'landscape'
  | 'archive'
  | 'learn'
  | 'community'
  | 'outro';

export type SceneSpec = {id: SceneId; seconds: number; voice: VoiceLine[]};

export const SCENES: SceneSpec[] = [
  {
    // script line 1
    id: 'opening',
    seconds: 7.5,
    voice: [
      {text: 'Forests are full of voices.', at: 0.5, onScreen: true},
      {text: 'Frogs, birds, insects.', at: 2.4, onScreen: true},
      {text: 'Some of them are disappearing, and almost nobody is listening.', at: 3.9, onScreen: true},
    ],
  },
  {
    // script line 2
    id: 'problem',
    seconds: 7.5,
    voice: [
      {text: 'Fixing that hits a massive bottleneck:', at: 0.3},
      {text: 'high-quality data labeling is slow, exhausting, and locked behind centralized AI.', at: 2.4},
    ],
  },
  {
    // script line 3
    id: 'board',
    seconds: 17.5,
    voice: [
      {text: 'Meet ecco.', at: 0.4, onScreen: true},
      {text: 'Small listening posts, built on the Arduino UNO Q.', at: 1.5},
      {text: 'They recognize animal calls on the spot, in milliseconds,', at: 4.9},
      {text: 'to map habitats and track endangered species.', at: 7.9},
      {text: 'Human speech is removed right on the device,', at: 10.8},
      {text: 'so posts can listen even in busy places like national parks.', at: 13.4},
    ],
  },
  {
    // script line 4
    id: 'askCommunity',
    seconds: 6.5,
    voice: [{text: 'When a post hears a sound it cannot name, it asks the community for help.', at: 0.3}],
  },
  {
    // script line 5, first sentence
    id: 'unknownSound',
    seconds: 5.5,
    voice: [{text: "Because the sounds machines can't name are the ones that matter most.", at: 0.3}],
  },
  {
    // script line 5, second sentence
    id: 'hiss',
    seconds: 7.5,
    voice: [
      {text: 'But labeling them is one of the most tedious jobs in AI:', at: 0.2},
      {text: 'hours of hiss, one call hidden somewhere inside.', at: 3.8},
    ],
  },
  {
    // script line 6
    id: 'turningPoint',
    seconds: 5,
    voice: [{text: 'Our solution: ecco turns sound into space for everyone to explore.', at: 0.3}],
  },
  {
    // script line 7
    id: 'landscape',
    seconds: 9,
    voice: [
      {text: 'Play with every recording inside our interactive web environment.', at: 0.2},
      {text: 'Follow the trace, paint the call,', at: 4.3},
      {text: 'then give your finding a name.', at: 6.6},
    ],
  },
  {
    // script line 8, first sentence
    id: 'archive',
    seconds: 6,
    voice: [{text: 'Every solved sound becomes verified training data and a unique Sound Stamp in your archive.', at: 0.3}],
  },
  {
    // script line 8, second sentence
    id: 'learn',
    seconds: 3.5,
    voice: [{text: 'Every label helps tune the on-device models.', at: 0.2}],
  },
  {
    // script line 9
    id: 'community',
    seconds: 6.5,
    voice: [
      {text: 'Result? A community that teaches the forest to listen.', at: 0.3, onScreen: true},
      {text: 'Owned by people, not by big tech.', at: 3.8, onScreen: true},
    ],
  },
  {
    // script line 10 and the end card
    id: 'outro',
    seconds: 8,
    voice: [
      {text: 'Forests are full of voices.', at: 0.2, onScreen: true},
      {text: 'Now everyone can help them be heard.', at: 1.9, onScreen: true},
      {text: 'ecco. Help the forest listen.', at: 4.6, onScreen: true},
    ],
  },
];

/** The end card line under the logo */
export const PUNCHLINE = ['Hear it on the edge.', 'See it in 3D.', 'Teach it together.'];

/**
 * Footage per shot. `src` is relative to public/ (run `npm run media` first).
 * `from` is the second in the source clip where the shot starts, `rate` the playback speed.
 * Swap a clip here, for example to a new file you dropped into clips/.
 */
export const FOOTAGE = {
  openingSpiral: {src: 'footage/14-spiral-orbit-resolutions-clean.mp4', from: 0.5, rate: 0.85},
  postOnTree: {src: 'footage/sketch/post-on-tree.mp4', from: 0, rate: 1},
  postOnTreeClose: {src: 'footage/sketch/post-on-tree.mp4', from: 1.6, rate: 0.7},
  postStudio: {src: 'footage/sketch/post-studio.mp4', from: 0.3, rate: 1},
  liveRecording: {src: 'footage/11-live-recording-from-the-board-parts.mp4', from: 1.0, rate: 1},
  reveal: {src: 'footage/02-open-challenge-landscape-reveal.mp4', from: 2.0, rate: 1},
  playback: {src: 'footage/03-playback-and-dj-timeline.mp4', from: 1.0, rate: 1},
  brush: {src: 'footage/05-brush-painting-frog-calls.mp4', from: 3.0, rate: 1.3},
  labeling: {src: 'footage/11-live-recording-from-the-board-parts.mp4', from: 9.0, rate: 1},
  themes: {src: 'footage/10-view-lab-themes.mp4', from: 0, rate: 1},
  networkTopo: {src: 'footage/sketch/network-topo.mp4', from: 0.3, rate: 1},
  outro: {src: 'footage/12-outro-junction-2026.mp4', from: 0, rate: 1.15},
} as const;

export type FootageSpec = {src: string; from: number; rate: number};

// derived values, no need to edit below
export const sec = (s: number) => Math.round(s * FPS);

export type PlacedScene = SceneSpec & {start: number; frames: number};

export const PLACED: PlacedScene[] = (() => {
  let t = 0;
  return SCENES.map((s) => {
    const p = {...s, start: t, frames: sec(s.seconds)};
    t += p.frames;
    return p;
  });
})();

export const TOTAL_FRAMES = PLACED.reduce((n, s) => n + s.frames, 0);
export const TOTAL_SECONDS = TOTAL_FRAMES / FPS;
