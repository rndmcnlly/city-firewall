# Process notes

Running log of how assets and key decisions were made, so the choices are
reproducible and reviewable.

## Audio

### `Concrete Thunder.mp3` — persistent soundtrack

- **Tool:** Suno
- **Type:** instrumental
- **Prompt:** `action movie, pulsing soundtrack, intense`
- **Use:** looped, persistent background track for the whole activity. Starts on
  the Beat 0 "TOUCH TO WAKE" gesture (the required user interaction that unlocks
  browser audio autoplay) and continues looping through Beats 1–5.
- **Playback:** fades in gently from silent to ~0.7 volume on wake, so the music
  does not pounce on the kid.

### Beat 5 reveal sting — Tone.js (no extra mp3)

- We had no time for additional Suno work, so the cue at the message.txt reveal
  is synthesized live with **Tone.js** (CDN).
- **Deliberately non-melodic** (an earlier arpeggio+chord version read as cheesy
  cartoon victory). It is a cinematic impact instead:
  - a filtered **white-noise riser** (bandpass 300Hz→7kHz, volume crescendo)
    builds tension for ~1.1s, then cuts sharply,
  - slamming into a **sub-bass impact** (sine pitch-dropping 140Hz→38Hz, fast
    attack / long decay) plus a short noise "slam" transient for punch.
- No pitches, no harmony: just texture and weight.
- The reveal is timed so the message snaps in exactly on the bass hit; the
  on-screen burst is a red/white concussive shockwave, not party confetti.
- Tone's audio context is started lazily on the message.txt click (a user
  gesture), so it never fights the autoplay policy.

## Puzzle mechanic

### The clue is physical (late redesign)

- Originally a 4-letter code shown on screen (`clue.txt` → `WXYZ` placeholder).
- **Changed to:** `message.txt` carries no code at all. It congratulates the
  agent and directs them to **MOTHER** (a parent playing the in-universe
  handler) to receive a **physical paper fragment** from the hacking kiosk.
- Benefit: the real clue lives only on paper, so it cannot be spoiled by anyone
  browsing this repo or inspecting the page source.
