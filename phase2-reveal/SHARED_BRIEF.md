# Phase 2 Reveal: Shared Context Brief

You are building ONE of three competing prototypes of a "cinematic 3D
shatter reveal" for a kids' birthday party activity. Read this whole brief,
then follow the per-agent instructions appended at the end of your task
prompt. The three prototypes will be shown side-by-side so a 10-year-old can
pick a favorite, so each must feel DISTINCT while sharing the same skeleton.

## The bigger project (context only, do not build the rest)

A City Spies themed "hack the firewall" station. Full sequence is:
1. Boring login page.
2. Secret terminal button.
3. Hackertyper-style typing frenzy.
4. **Cinematic 3D shatter reveal** <- THIS is the only thing you build.
5. Secure desktop with a clue.txt holding the final code.

The chosen aesthetic is "Classic Heist": straight-faced spy-movie cool,
dark, neon-green-on-black terminal energy with red ACCESS DENIED accents.
Self-aware and over the top, but played deadpan. Parents should recognize
movie VFX tropes; kids should feel awesome.

## What your prototype must do (the shared skeleton)

A single self-contained HTML file that, on load (or on a click of a big
"INITIATE BREACH" button), does this sequence:

1. Shows a faux "login / locked" screen filling the viewport. Style it
   Classic Heist: black background, monospace green text, a fake login box
   or "FIREWALL ACTIVE" banner. This is the "glass" that will break.
2. A brief beat (~1s), maybe a flash / "FIREWALL BREACHED" stamp.
3. The login screen FRACTURES into 3D shards and flies away under your
   flavor's physics, revealing the secure desktop BEHIND it.
4. The revealed "secure desktop" is a placeholder: dark teal/blue desktop,
   a window title bar reading "SECURE NODE", and a clearly visible file
   icon labeled "clue.txt". (Do not implement opening it; just show it.)
5. A small "Replay" button so the kid can watch the shatter again.

## Hard technical constraints

- Three.js loaded from CDN via ES module import map (jsDelivr). Example:
  ```html
  <script type="importmap">
  { "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js" } }
  </script>
  <script type="module"> import * as THREE from 'three'; ... </script>
  ```
- NO build step, NO npm, NO local file dependencies. Must work opened
  directly from disk AND when served by GitHub Pages.
- Everything inline in the single HTML file (CSS + JS).
- The "glass" texture should be the login screen rendered to a texture.
  Recommended approach: build the login look as an HTML/SVG/canvas drawing
  and draw it into a CanvasTexture, OR render colored geometry that reads as
  the login. Whatever is simplest and looks crisp. Text must be legible
  before the shatter.
- Target 60fps on a MacBook Pro M3; degrade gracefully on a phone.
- Keep total shard count reasonable (tens to low hundreds, not thousands).

## Audio hooks (DO NOT add audio, just leave clean seams)

Music and SFX will be layered later. Leave clearly-commented stub functions
so they are trivial to wire up later:
```js
function sfxBreach() { /* TODO: impact/shatter sound */ }
function sfxReveal() { /* TODO: whoosh/reveal sound */ }
function musicStart() { /* TODO: loop bg music */ }
```
Call these at the right moments (commented out or no-op) so timing is ready.

## Quality bar

- Smooth easing, no janky pops. Shards should have depth (z-motion),
  rotation, and a sense of gravity or force appropriate to your flavor.
- Real lighting: at least one directional + ambient so shards catch light.
- Comment the key tunable constants (durations, shard count, force) at the
  top so we can tweak fast during synthesis.
- A 10-year-old should gasp. Lean into the cinematic moment.

## Deliverable

Write exactly ONE file to the path given in your per-agent instructions.
Report back: the file path, the flavor name, key tunable constants, and any
caveats. Do not build the chooser page or other flavors.
