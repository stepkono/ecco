# BioSpectra pitch

This file collects everything for the pitch. It is updated whenever the team mentions something relevant.

- **Part 1** is the team's own framing, written down as it was said, only cleaned up.
- **Part 2** holds proposed additions and corrections. The team goes through them one by one and marks each one as accepted, changed or dropped.
- **Part 3** lists open questions.

Last updated: 2026-11-15

---

## Part 1: Our idea (the team's framing)

### The hero: edge AI on the Arduino
- The Arduino UNO Q is the hero of the story. We show why edge AI on the board is better than a normal microphone that streams everything to the cloud.
- **Decentralized, not in the cloud.** Many small listening posts ("agents") sit in forests and national parks. They record and categorize sounds on the spot.
- **The result is a living map of animals.** It shows which species can be found where and at what time of day. Over time it builds a large set of environmental data on endangered species.

### The human-in-the-loop system
- The edge AI is trained, but sometimes it is not certain.
- There is a certainty threshold. When a sound stays below it, the board sends a short audio snippet to our game.
- The game turns the snippet into a 3D landscape that players explore and label.
- The community is the peer review system. Players map the sounds to species.
- Their labels raise the certainty of the edge AI. The improvement goes back onto the board, so the system learns over time.

### Why a human and not just another algorithm
- Pattern recognition picks the most likely pattern, the one that sticks out the most.
- A human can actually hear the sound, so they have context. They don't just search for the obvious thing that sticks out.
- Instead they solve the problem step by step. For example: "Is the sound I'm looking for high or low in frequency?" Then they search there and switch between tools, like unfold, which opens up the whole landscape. (The recording said "Haiku tool". To be checked which tool was meant.)
- Different views suit different sounds. The voxel view is perfect for quick, repetitive sounds like crickets.
- That is the whole point of a rotatable 3D landscape. From the top view you see the pattern in time. From the side you see the shape of the peaks. Players can rotate freely until the sound "clicks".

### Community and awareness
- Players could see on the forest map where a sound came from. For example: "this is close to my house" or "this is the forest where I grew up".
- The game raises environmental awareness.
- The system is community-based. It is not owned by a huge AI company. The community itself improves it.

### Fingerprints and discoveries
- Every sound has a signature, like a fingerprint.
- A global database stores all fingerprints that players recognized. Every player sees their own fingerprints and those the community found.
- The first player to recognize a fingerprint that is not yet in the library gets a special credit in the app.
- This needs validation, because the machine can't know whether a sound is really new. Known animals are covered by existing databases. A possibly new sound gets a special level and goes to experts for verification.
- We need thresholds for how different a fingerprint must be from all others to count as new. (See A8 for a proposed method.)

### Collection and library
- Every solved puzzle becomes an abstract icon, a "sound stamp". It shows the puzzle's gradient in a less detailed way.
- Every puzzle has its own color gradient, so every stamp is unique.
- Players collect the stamps like badges in a personal library of solved puzzles and categorized animals.
- A map shows which sound came from which listening post in the national park.

### Game look and feel
- Playful and vibrant, but with a consistent design language that doesn't overstimulate.
- Each level has its own color theme, so it feels like a new environment every time. Inspiration for the palettes: the color puzzle game "I Love Hue".
- A soft colorful fog with columns rising out of it. Inspiration: the atmosphere of Monument Valley.
- Favorite directions so far: a middle ground between voxels and a smooth surface, with rounded hills and a solid base. The drop lines with glow are reserved for the video and transitions.
- Ideas to explore: walkable landscapes where players walk along pathways, hear the soundscape around them and paint areas. A water surface with waves and caustics.

### Outlook: a suite of games for high-quality AI data
- The core idea is general: games create high-quality machine learning data.
- Forest sounds are the first domain. The same approach can work for other domains, for example a game for visual intelligence.
- The outlook is a growing portfolio of games that each create high-quality AI data for a different domain.

---

## Part 2: Proposed additions and corrections (to review one by one)

Status values: **open**, **accepted**, **changed**, **dropped**.

### A1. Privacy by design · open
Visitors walk through national parks. The board recognizes human speech and never sends it. No recording of a person leaves the forest. A cloud pipeline that streams audio cannot promise that.

### A2. It works with a weak connection or none · open
- The board decides on its own in about 9 ms per sound window.
- Only uncertain events leave the board. In our soundscape test, 79 uncertain snippets became 7 events.
- When the connection drops, the board keeps listening and uploads later.
- This is the core argument for edge AI against "microphone plus cloud". It saves bandwidth and energy, works in remote areas and keeps privacy.

### A3. Correction: "learns" without retraining · open
The pitch says the board is "trained" and then improved. That is right in spirit. A jury may ask what exactly happens on the board, so it helps to be precise:
- The audio model on the board stays fixed.
- Each label adds an example to a small set of reference fingerprints (few-shot prototypes). No retraining is needed.
- So one label is enough. The board installs the update in about 2 s.

Suggested sentence: "One player's label teaches the board a new sound in seconds, without retraining."

### A4. Correction: what runs where on the UNO Q · open
The UNO Q has two processors. A Linux processor runs the audio model. A microcontroller handles the real-time hardware. Our model runs on the Linux side, as an int8 TensorFlow Lite model in about 95 MB of memory. If someone asks "does this run on a microcontroller?", the honest answer is: on the Linux side of a low-power board, not in the cloud.

### A5. Every forest has its own soundscape · open
Each region has its own species and its own background noise, like rain, wind or roads. The community teaches every post its local soundscape. Teaching a post what is only noise counts too, because it stops false alarms. Our demo shows both: a new species gets learned, and a rain false alarm goes quiet.

### A6. Trust in the data · open
- Players get test clips with a known answer ("gold clips"). Their accuracy on these clips sets a reliability score.
- Several players must agree before a label is accepted.
- That makes the labels good enough for science, not just for a game. The same mechanism is what makes the outlook (A9) credible.

### A7. Correction: protect endangered species on the map · open
Exact locations of endangered species on a public map can help poachers. Proposal:
- The public map shows only a rough area, like the park or a grid square of a few km, and possibly with a delay.
- Rangers and researchers see the exact post.
- Mentioning this shows the jury we thought it through.

### A8. How to decide that a fingerprint is new · open
**Recommended method.** Open-set recognition on embeddings.
- Every sound becomes an embedding, a vector of numbers. The board already computes one.
- A fingerprint is a candidate for "new" if its similarity to every known fingerprint in the library stays below a threshold. The board already uses such a threshold ("T_known", currently 0.80 cosine similarity).

**Setting the threshold.** Calibrate it on data with known answers.
- Pick it so that, for example, at most 5% of known sounds are wrongly flagged as new.
- Conformal prediction is a method that gives exactly this kind of guarantee.

**One odd clip is not a new species.** A single unknown clip may be wind, a broken recording or a known animal in a strange situation. A candidate becomes a "new fingerprint" only when several unknown clips form their own cluster. For example:
- at least 5 clips that are very similar to each other (similarity of 0.90 or more)
- from at least 2 listening posts or 3 different players
- all far from every known fingerprint

Clustering methods like HDBSCAN find such groups without knowing the number of groups in advance.

**Validation pipeline.**
1. A player marks a sound as "not in the library".
2. The system checks the thresholds.
3. Other players confirm the cluster.
4. An expert verifies it, for example a biologist or a citizen science community like xeno-canto.
5. Only then is it added to the global library. The "first discoverer" credit goes to the first player whose label was confirmed.

**Not the right tool.** Song-matching fingerprints like the ones music recognition apps use. They find copies of the exact same recording, not new recordings of the same species.

### A9. Outlook: there is strong precedent for "games create science data" · open
The idea has a name: games with a purpose, or citizen science games. Well-known examples:
- **Foldit.** Players helped solve a protein structure in 2011 that had puzzled scientists for over a decade.
- **EyeWire.** Players map neurons in the brain.
- **Zooniverse.** Millions of volunteers classify images, for example from wildlife camera traps.
- **reCAPTCHA.** Users helped digitize books while solving puzzles.

Naming them shows the jury that the model works. Our addition is the closed loop: the data goes straight back into an edge device in the field.

Concrete next games for the suite:
- camera trap images from the same listening posts
- satellite images for deforestation
- underwater sound for marine life

The reusable core: uncertainty-driven puzzles, gold clips, consensus and reliability scores.

### A10. Playful ways to show the data · open
These keep the core task of spotting the odd sound:
- **Sound islands.** Known sounds are calm hills in the island's colors. The unknown sound grows as a hill in a foreign color, and the player "digs it out".
- **Sound constellations.** The peaks of a call become stars. The repeating pattern of a species forms a constellation, which becomes its sign in the library.
- **Sound stamps.** Already adopted in Part 1. Extra idea: the gradient comes from the sound itself. The species sets the color family, and the clip shifts the exact shades. Similar animals look related, and every stamp is still unique.
- **Spot the broken rhythm.** Many calls repeat and form regular ridges. The anomaly is the ridge that breaks the pattern. This is easy to explain in 5 seconds at the booth.

### A11. Numbers we can show on stage · open
All measured with the real board and recordings.

| What | Value |
|---|---|
| Model time per sound window on the UNO Q | about 9 ms |
| Model memory on the UNO Q | about 95 MB |
| From "needs help" to "recognized", real board | 24 s |
| Label to board updated | 1.4 to 2.0 s |
| Demo runs in a row without restart | 3 of 3 |
| Accuracy with 5 examples per class (ESC-50) | 86% |
| Uncertain snippets merged into events (soundscape test) | 79 into 7 |

### A12. Humans and AI fail in different places, and that is the point · open
Framing for the "why a human" argument:
- The board only sends the sounds where its own pattern recognition failed.
- So these are exactly the cases where a second algorithm of the same kind would likely fail too.
- Humans bring what the model lacks: they listen, use context and test hypotheses with different views and tools. The two strategies complement each other.

Suggested sentence: "The AI sends us exactly what it can't solve, and people solve it differently than a machine would."

Extra idea: the game can log which view and tool solved which kind of sound, for example voxels and the top view for crickets. That data improves the game itself, because it can suggest the best starting view for each new puzzle.

---

## Part 3: Open questions

- Which three local species do we use? Which park tells the story?
- Who are the experts that verify new fingerprints?
- Who pays in the long run? Options: national parks, research institutes, nature NGOs, data licensing.
- What is the name of the game suite?
