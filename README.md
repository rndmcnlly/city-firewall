# City Firewall

A multimedia "hack the firewall" activity station for a City Spies themed
10th birthday party. Kids complete the sequence to retrieve a 4-letter clue
that feeds into a larger puzzle. Deploys to GitHub Pages.

## Story beats (shared by all concepts)

1. A modest, boring login page.
2. A (not-so) secret terminal-access button.
3. A hackertyper-style typing frenzy (any keys -> cool code).
4. A cinematic 3D reveal: the screen chunks fall away.
5. A secure desktop with an obvious `clue.txt` holding the final code.

## Phases

We are building this in phases, not one-shot. Each phase develops a few
options for the kid to react to, then we synthesize.

- **Beat 0 (done): Silent idle / standby screen.** In-universe light-mode
  "kiosk asleep" state in `beat0-idle/`. The single "TOUCH TO WAKE" tap is the
  user gesture that starts the looping soundtrack and wakes the terminal into
  Beat 1. Fires `begin-activity`. See `PROCESS.md` for the soundtrack.

- **Phase 1 (done): Storyboards.** Three sequence concepts as kid-friendly
  comic strips. See `storyboards.html`. **Chosen: A, Classic Heist.**
    - **A: Classic Heist** — straight-faced spy-movie cool, shatter reveal.
    - **B: Glitch Gremlin** — silly, sassy, melt/dissolve reveal.
    - **C: Mission Control** — slick HQ console, 3D fold-away reveal.
- **Phase 2 (done): Shatter reveal prototypes (beat 4).** Three WebGL/Three.js
  flavors built in parallel under `phase2-reveal/`. Shared brief in
  `phase2-reveal/SHARED_CONTEXT.md`. **Chosen: Grid Collapse (`flavor2-grid`).**
    - **flavor1-glass** — radial glass shatter from an impact point.
    - **flavor2-grid** — clean tile grid, domino cascade. CHOSEN. Enhanced so
      lasers slice across one line at a time to *assemble* the grid before the
      tiles peel away.
    - **flavor3-voronoi** — organic Voronoi chunks blasting outward.
- **Phase 3 (done): Typing frenzy (beat 3).** Keystroke-driven hacker transcript
  in `phase3-typing/`. Built around a real Starlette Host-header bypass
  (CVE-2026-48710), with woven-in missteps and an accelerating, high-visibility
  HUD. Fires `typing-frenzy-complete` to hand off to beat 4.
- **Phase 4 (done): Opening beats 1+2.** Options storyboard in
  `beats-1-2-options.html`; chosen build in `beats-1-2-login/`.
  **Chosen: 1A + 2A.**
    - **Beat 1A: Dead Serious Denial** — cold secure portal that always stamps
      ACCESS DENIED and shakes. Never lets you in the front door.
    - **Beat 2A: Tiny corner `>_ terminal` link** — the real way through.
      Emits radial pulses to draw the eye: occasional ambient rings, plus
      escalating bursts on each failed login (more/faster/brighter/farther,
      red -> green), going permanently "hot" after 3 fails. Fires
      `login-bypassed` to hand off to beat 3.

## Viewing

Everything is self-contained static HTML. Just open the file or serve the
directory. No build step.
