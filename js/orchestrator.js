/* ============================================================================
   ORCHESTRATOR
   ----------------------------------------------------------------------------
   Stitches the six beats into one continuous experience on a single page. Each
   beat is a full-screen <section class="scene"> stacked in the DOM. Only the
   active scene is shown; the orchestrator advances along the handoff chain:

     begin-activity        (Beat 0 wake)        -> show Beat 1+2 (login)
     login-bypassed        (terminal link)      -> show Beat 3 (typing)
     typing-frenzy-complete(transcript done)    -> start Beat 4 (grid collapse)
     reveal-complete       (grid gone)          -> Beat 5 desktop is live
     mission-complete      (message shown)      -> schedule kiosk auto-reset

   The looped soundtrack is owned here (one <audio>), started on the Beat 0 wake
   gesture and never recreated, so it persists across the whole flow.
   ========================================================================== */
import { initGridCollapse } from './grid-collapse.js';
import { initBeat0 } from './beat0.js';
import { initLogin } from './login.js';
import { initTyping } from './typing.js';
import { initBeat5 } from './beat5.js';

const stage   = document.getElementById('stage');
const scenes  = {
  idle:   document.getElementById('scene-idle'),
  login:  document.getElementById('scene-login'),
  typing: document.getElementById('scene-typing'),
  reveal: document.getElementById('scene-reveal'),
};
const track   = document.getElementById('track');
const sweepFx = document.getElementById('powersweep');

/* ---- show exactly one scene, fading the others out --------------------- */
function showScene(name) {
  for (const [key, el] of Object.entries(scenes)) {
    if (key === name) {
      el.classList.add('active');
      el.removeAttribute('aria-hidden');
    } else {
      el.classList.remove('active');
      el.setAttribute('aria-hidden', 'true');
    }
  }
}

/* ---- soundtrack: start once; fades are managed via a single interval ----
   trackFade holds the active fade interval so a new fade cancels the old one
   (prevents fights between fade-in and fade-down, and survives the kiosk loop
   since a full reload re-creates this module from scratch). */
let trackStarted = false;
let trackFade = null;

function fadeTrackTo(target, stepMs = 90, stepSize = 0.05, onDone) {
  if (trackFade) { clearInterval(trackFade); trackFade = null; }
  const up = target > track.volume;
  trackFade = setInterval(() => {
    const v = up
      ? Math.min(target, track.volume + stepSize)
      : Math.max(target, track.volume - stepSize);
    track.volume = v;
    if (v === target) {
      clearInterval(trackFade);
      trackFade = null;
      if (typeof onDone === 'function') onDone();
    }
  }, stepMs);
}

function startSoundtrack() {
  if (trackStarted) return;
  trackStarted = true;
  track.volume = 0.0;
  track.play().then(() => {
    fadeTrackTo(0.7);                     // gentle fade-in to the cruising level
  }).catch(() => { trackStarted = false; /* a later gesture can retry */ });
}

// Fade the music all the way out so the reveal stinger is the final sound.
// ~1.2s glide, timed to be near-silent by the time the bass impact lands.
function duckTrackForFinale() {
  fadeTrackTo(0.0, 60, 0.03);
}

/* ---- the light->dark power sweep between Beat 0 and Beat 1 ------------- */
function powerSweep(after) {
  sweepFx.classList.add('run');
  // hand off to the login at the midpoint of the wipe, while it covers screen
  setTimeout(after, 520);
  setTimeout(() => sweepFx.classList.remove('run'), 1300);
}

/* ============================================================================
   WIRE UP EACH BEAT
   ========================================================================== */

// show the idle scene immediately, before any beat that could throw at init.
showScene('idle');

// Beat 0 -- idle/standby. Its wake gesture starts audio + fires begin-activity.
initBeat0({ root: scenes.idle, onWake: startSoundtrack });

// Beats 1+2 -- login + terminal door. Fires login-bypassed.
initLogin({ root: scenes.login });

// Beat 3 -- typing frenzy. Fires typing-frenzy-complete.
const typing = initTyping({ root: scenes.typing });

// Beat 5 -- desktop + message. onRiser fires when the riser starts (so we duck
// the soundtrack to silence under it); onComplete fires on the final reveal.
const beat5 = initBeat5({
  root: scenes.reveal,
  onRiser: duckTrackForFinale,
  onComplete: () => document.dispatchEvent(new CustomEvent('mission-complete')),
});

// Beat 4 -- grid collapse (WebGL). Initialized LAZILY on first use so a GPU-less
// environment (or any Three.js failure) can never block Beats 0/1/3/5. If the
// renderer can't be created, we fall back to revealing the desktop directly.
let grid = null;
function ensureGrid() {
  if (grid) return grid;
  try {
    grid = initGridCollapse({
      canvas: document.getElementById('gl'),
      onComplete: () => document.dispatchEvent(new CustomEvent('reveal-complete')),
    });
  } catch (err) {
    console.warn('[orchestrator] grid-collapse unavailable, falling back:', err);
    grid = {
      start: () => {
        // no WebGL: hide the glass canvas and reveal the desktop directly
        const c = document.getElementById('gl');
        if (c) c.style.display = 'none';
        document.dispatchEvent(new CustomEvent('reveal-complete'));
      },
      reset: () => {},
    };
  }
  return grid;
}

/* ============================================================================
   THE HANDOFF CHAIN
   ========================================================================== */

document.addEventListener('begin-activity', () => {
  powerSweep(() => showScene('login'));
});

document.addEventListener('login-bypassed', () => {
  showScene('typing');
  typing.start();
});

document.addEventListener('typing-frenzy-complete', () => {
  // brief beat so the kid registers "FIREWALL DEFEATED" before the shatter
  setTimeout(() => {
    showScene('reveal');     // both the WebGL canvas and the desktop live here
    ensureGrid().start();    // lazy-init the WebGL beat (with fallback)
  }, 900);
});

document.addEventListener('reveal-complete', () => {
  // desktop is now fully visible behind the spent canvas; message.txt is live.
});

/* ---- kiosk auto-reset ---------------------------------------------------
   Let the final FIND MOTHER screen hang around so the kid (and the parent
   handler) have plenty of time to read it and fetch the paper fragment. After
   the dwell, hard-reload the page: a full reload is the most robust reset --
   it re-creates the audio element, fade state, Tone context, and every beat
   from scratch, so loop 2 behaves identically to loop 1 (no lost music, no
   stale state). */
const DWELL_MS = 2.5 * 60 * 1000;   // 2.5 minutes on the final screen
let resetTimer = null;
document.addEventListener('mission-complete', () => {
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => location.reload(), DWELL_MS);
});

/* ============================================================================
   KIOSK HARDENING
   ========================================================================== */

// swallow right-click context menu (kids poking around)
window.addEventListener('contextmenu', e => e.preventDefault());

// prevent text selection drags that break the illusion
document.addEventListener('selectstart', e => {
  // allow selection inside the message body (so a curious adult can read it)
  if (e.target.closest('#b5-message')) return;
  e.preventDefault();
});

// best-effort fullscreen on first interaction (browsers require a gesture)
function goFullscreen() {
  const el = document.documentElement;
  if (!document.fullscreenElement && el.requestFullscreen) {
    el.requestFullscreen().catch(() => {});
  }
}
document.addEventListener('begin-activity', goFullscreen, { once: true });
