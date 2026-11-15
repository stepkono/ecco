# ecco pitch video (1:30)

A Remotion project that cuts the screen recordings together with motion graphics in the ecco design language.
1920 x 1080, 30 fps, 90 s.

## Quick start

```bash
cd video
npm install
npm run media      # links footage, clips and audio into public/footage, cuts the generated shots
npm run studio     # live preview in the browser, scrub and tweak
npm run render     # writes out/ecco-pitch.mp4
```

Media files are never committed. `public/footage`, `clips/`, `audio/` and `out/` are ignored by git.

## Change the timing

Everything lives in **`src/timing.ts`**.

- `SCENES` is the timing table. Each scene has a length in seconds and its script lines.
  The total must stay 90 s.
- Each script line has `at`, the second inside its scene where the line starts.
  Shift these to match a recorded voiceover, the subtitles follow.
- `onScreen: true` marks a line that is already big text in the picture, so no subtitle is drawn for it.
- `FOOTAGE` lists the clip for every shot, the second where it starts (`from`) and the speed (`rate`).
- `CROSSFADE` is the length of the fade between scenes in frames.

Smaller beats inside a scene (when a callout appears, for example) are set with `sec(...)` in the scene file in `src/scenes/`.

The script is the final team script (10 lines, about 210 words, about 2.3 words per second).

| Time | Scene id | File | Script line | Picture |
|---|---|---|---|---|
| 0:00 | opening | `Opening.tsx` | 1 | Spiral B-roll (14), "Forests are full of voices." |
| 0:07.5 | problem | `Problem.tsx` (part 1) | 2 | Generated spectrogram full of hiss, the bottleneck |
| 0:15 | board | `Board.tsx` | 3 | Post on a tree, the open post with callouts, back to the forest (sketch video) |
| 0:32.5 | askCommunity | `Loop.tsx` (phase ask) | 4 | Loop diagram: post, server, people |
| 0:39 | unknownSound | `UnknownSound.tsx` | 5 | Live recordings the post could not name (11) |
| 0:44.5 | hiss | `Problem.tsx` (part 2) | 5 | The hidden call is found, "Hard to hear." |
| 0:52 | turningPoint | `TurningPoint.tsx` | 6 | "Easy to see.", the landscape builds (02) |
| 0:57 | landscape | `Landscape.tsx` | 7 | Play (03), paint (05), name (11, labeling card) |
| 1:06 | archive | `Archive.tsx` | 8 | Sound Stamps over the blurred themes clip (10) |
| 1:12 | learn | `Loop.tsx` (phase learn) | 8 | The label goes back to the post in 1.8 s |
| 1:15.5 | community | `Community.tsx` | 9 | Network over a topo map (sketch video) |
| 1:22 | outro | `Outro.tsx` | 10 | Voxel outro (12), then the logo, "Help the forest listen." and the punchline |

The end card punchline is `PUNCHLINE` in `src/timing.ts`.

## Voice and music

Drop the files here and run `npm run media` again:

- `video/audio/voice.mp3` (or `.wav`, `.m4a`)
- `video/audio/music.mp3` (or `.wav`, `.m4a`)

Each one is used only if it exists. The music fades in and out and gets quieter while a voice is present.
Volumes are props: `musicVolume` (default 0.35) and `voiceVolume` (default 1).

## Subtitles

The script is drawn as subtitles by default. Switch them off with a prop:

```bash
npx remotion render EccoPitch out/ecco-pitch-clean.mp4 --props='{"subtitles":false,"musicVolume":0.35,"voiceVolume":1}'
```

In the studio, the same props can be edited in the right panel.

## New clips

1. Put the file into `video/clips/` (mp4 or mov).
2. Run `npm run media`. The clip is linked as `footage/<file name>`.
3. Point a shot in `FOOTAGE` (in `src/timing.ts`) to it, for example
   `postStudio: {src: 'footage/my-board-shot.mp4', from: 0, rate: 1}`.

If a file is missing, the video still renders and shows a quiet placeholder with the missing file name.

The generated shots (network, post on a tree, open post) are cut out of `clips/sketch-0618.mp4` by `scripts/prepare-media.sh`.
Change the start and length there if the sketch video changes.
