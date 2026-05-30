# Phase 2: Shatter Reveal Prototype — Shared Context

Read this whole file before writing any code. Your top-level task message will
tell you WHICH shatter flavor to build and WHICH subdirectory to work in. This
file is the shared context all three flavors share.

## The project

We are building a multimedia "hack the firewall" activity station for a kid's
10th birthday party, themed on the *City Spies* book universe. Kids complete a
sequence to retrieve a 4-letter clue feeding a larger puzzle. Final deployment
is GitHub Pages (static hosting, no server, no build step).

The chosen overall concept is "Classic Heist": straight-faced spy-movie cool,
dark UI, red accents. It is self-aware and over the top. Parents watching
should recognize movie-VFX tropes; kids should feel like elite hackers.

The full experience has five beats: (1) boring login, (2) secret terminal
button, (3) hackertyper-style typing frenzy, (4) CINEMATIC 3D SHATTER REVEAL,
(5) secure desktop with an obvious clue.txt. THIS PHASE IS ONLY BEAT 4: the
shatter reveal. We are prototyping the single riskiest, most impressive moment
in isolation so a 10-year-old can pick her favorite flavor.

## What your demo must do

Build a single self-contained `index.html` (plus any local asset files you
generate) that plays this micro-sequence on load and on a "Replay" button:

1. Show a convincing but simple fake LOGIN SCREEN, full viewport. Dark
   background, a centered login card with title "SECURE ACCESS", a username
   and password field (can be static/fake), a red "ACCESS DENIED" style stamp,
   monospace/terminal vibe. This is the "glass" that will break.
2. After ~1.2s (or on a click), the login screen FREEZES and SHATTERS into 3D
   shards that fly away with depth, lighting, and gravity, UNCOVERING a
   "secure desktop" behind it.
3. The revealed SECURE DESKTOP is a placeholder: a different darker background,
   a window-manager feel, and one obvious desktop icon labeled "clue.txt".
   Clicking clue.txt opens a little window showing the placeholder code
   "WXYZ" (this is a stand-in; real code comes later). Keep it simple.
4. Provide an on-screen "Replay" button to re-run the shatter.

## The shatter technique (decided)

Use Three.js / WebGL. The login screen is rendered as a TEXTURE on a 3D plane
(or many sub-meshes), then physically fractured with real depth, lighting, and
simulated gravity/velocity. This is the most cinematic option and is the whole
point: the parents should notice the VFX.

How to get the login as a texture: the cleanest GitHub-Pages-friendly approach
is to draw the login UI yourself onto an HTML <canvas> (2D canvas drawing of
the card, fields, text, stamp) and use that canvas as a THREE.CanvasTexture.
Do NOT rely on html2canvas or screenshotting the DOM. Draw it on a canvas so
you fully control the texture. The real DOM login can sit behind/around for
framing, but the THING THAT SHATTERS is the canvas-textured 3D geometry.

## Hard technical constraints

- Single self-contained `index.html`. Inline CSS and JS. No build step, no npm.
- Load Three.js from a CDN via an ES module import map, e.g. import maps
  pointing at https://cdn.jsdelivr.net/npm/three@<version>/build/three.module.js
  and the examples/jsm path for any addons. Pin a specific version.
- Must work by simply opening the file in a browser AND when served as a static
  file from a subdirectory on GitHub Pages. Use relative paths only.
- Keep total external dependencies to just Three.js (+ its jsm addons if
  needed). No other libraries.
- Target a modern desktop browser (the party station is a laptop). 60fps-ish.
- Comment the code clearly; this is a pedagogical single-file design that a
  human will later read and synthesize with the other flavors.

## Visual style guide (Classic Heist)

- Background near-black: #0a0e14. Panels: #121822. Borders: #1d2735.
- Ink/text: #e6edf3. Dim text: #8b98a5. Accent RED: #ff4d4d.
- Monospace for terminal/code; clean sans for UI chrome.
- Tasteful glow/shadow. It should look like a movie, not a corporate form.

## Deliverable

When done, your final message must report: the exact file(s) you created with
their paths, the Three.js version you pinned, what makes YOUR flavor visually
distinct, and any rough edges or TODOs for the later synthesis step. Do not
touch any files outside your assigned subdirectory.
