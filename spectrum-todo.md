# Spectrum to-do

Things to do later, collected while reworking the interface. New perspective: Spectrum is a gamified, easy-to-use tool for people with no expertise to label audio data and find patterns in it.

Status: **open**, **in progress**, **done**.

## Onboarding and instructions

- **open** · Instructions for newcomers. They don't belong in the right panel. Show them in a dedicated place, for example a short first-visit walkthrough.
- **open** · Dynamic instructions that follow the cursor. Hovering a tool, a panel or a part of the landscape explains what it is and what you can do with it, especially on the first visit.

## User flow

- **open** · Landing page: greet the user with the mission and what they take part in, then invite them to participate.
- **open** · Challenge selection with four categories:
  - **Newest**: the latest recordings
  - **Hottest**: recordings where users disagree more than usual on what they hear
  - **Most viewed**
  - **Least viewed**
- **open** · Challenge cards show where the recording was made (location on a map) and the date and time of the recording. These are the facts the user picks a challenge by.
- **open** · Grade challenges by difficulty. First idea:
  - **Easy**: a steady, even background with a few distinct peaks.
  - **Hard**: an uneven, changing background where many things happen at once.

  Possible measures: how much the background level changes over time, how flat the spectrum is (spectral flatness), and how many peaks stand out clearly above the background.

## Tools

- **open** · Echo: matching is sometimes too strict. You have to box a call very precisely before Echo finds the repeats. Tune the threshold or make the match more tolerant (second revision).
- **open** · Fork: decide whether it stays. It selects the lowest line of a call plus its harmonics, which are evenly spaced above it.
- **open** · Decide whether "Hide background" (formerly "Whiten") is the right name.

## Panels

- **open** · Separation score: decide whether it stays and how to explain it. It only works for the built-in practice clips, because real recordings have no clean reference.
- **open** · "Send label" and "Contribute to training set" now sit together in the Labeling card. Decide after the first iteration whether to merge them into one action.
- **open** · Rename "Labeling" once the final wording is clear.

## Player

- **open** · DJ timeline: adjust to the reference images once they arrive. The jog direction can be flipped with one constant (`JOG_DIRECTION` in `src/ui/timeline.ts`).

## Done in the UI overhaul, round 1

- **done** · Navigate while any tool is active: W A S D move, arrows orbit, Shift+drag slides, Shift+Cmd+drag moves up and down, Alt+drag or right-drag orbits, wheel zooms.
- **done** · Eraser tool: brings painted cells back to the untouched recording, in every layer.
- **done** · Isometric camera as default, still switchable in the View lab.
- **done** · One play/pause button with three modes (Full, Layer, Rest), a back-to-start button and the DJ timeline with hold, push and throw.
- **done** · Tools reordered: Brush, Echo, Fork, Eraser. Knife removed. "Unfold" renamed to "Boost", "Whiten" renamed to "Hide background".
- **done** · Removed the top-left info panel, the mouse hints, the backend status, event IDs, debug lines, the instructions box and the classic DSP assist.
- **done** · Layers moved to a compact filter in the top-left corner, with a listen button per layer.
- **done** · View lab trimmed: only Voxels, Drop lines, Spiral and Symmetry. No time, frequency, fog, roundness, spacing, terrace, material, reset or square-tile controls. No walk mode.
