export function showIntro() {
  const box = document.getElementById('intro')!;
  box.innerHTML = `<div class="sheet" style="width:min(860px,94vw)">
    <h2>BioSpectra</h2>
    <p class="lead">Arduino sensors in forests and wetlands record 5-second clips, but frogs, hornets and chainsaws drown in rain and wind. Neural nets on the node fail at this signal-to-noise ratio. You can hear the difference. Untangle the sound, and your separation teaches the sensor.</p>
    <div class="intro-steps">
      <div><b>1 · Read the sculpture</b>Time runs left to right, pitch runs back, loudness is height. Calls are ridges and combs. Rain is vertical streaks. Wind is a low swell.</div>
      <div><b>2 · Carve it apart</b><kbd>B</kbd> brush, <kbd>E</kbd> echo, <kbd>F</kbd> fork, <kbd>X</kbd> eraser. <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or Shift+drag to move, right-drag to orbit, <kbd>Space</kbd> to listen.</div>
      <div><b>3 · Teach the sensor</b>Score against the hidden clean stems, unlock species, contribute your masks, then retrain and push the int8 model in the Edge AI Lab.</div>
    </div>
    <button class="btn primary" id="intro-go">Start at node W-03</button>
  </div>`;
  box.hidden = false;
  document.getElementById('intro-go')!.onclick = () => (box.hidden = true);
}
