/* ============================================================================
   BEAT 0 -- silent in-universe idle / standby screen
   ----------------------------------------------------------------------------
   A calm, light-mode "kiosk asleep" state. The single TOUCH TO WAKE tap is the
   required user gesture: it starts the looped soundtrack (via onWake, owned by
   the orchestrator) and fires begin-activity to hand off to Beat 1.
   ========================================================================== */
export function initBeat0({ root, onWake }) {
  const $ = sel => root.querySelector(sel);
  const wake = $('#b0-wake');
  const clock = $('#b0-clock');
  const dateEl = $('#b0-date');

  /* ---- live standby clock ---------------------------------------------- */
  function tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    clock.textContent = hh + ':' + mm;
    dateEl.textContent = now
      .toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      .toUpperCase();
  }
  tick();
  setInterval(tick, 1000 * 20);

  /* ---- ambient drifting motes ------------------------------------------ */
  function spawnMotes(n) {
    for (let i = 0; i < n; i++) {
      const m = document.createElement('span');
      m.className = 'b0-mote';
      m.style.left = Math.random() * 100 + 'vw';
      m.style.bottom = '-10px';
      m.style.animationDuration = (14 + Math.random() * 12) + 's';
      m.style.animationDelay = (-Math.random() * 20) + 's';
      m.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px');
      root.appendChild(m);
    }
  }
  spawnMotes(14);

  /* ---- the wake gesture ------------------------------------------------- */
  let woke = false;
  function doWake() {
    if (woke) return;
    woke = true;
    if (typeof onWake === 'function') onWake();   // orchestrator starts audio
    document.dispatchEvent(new CustomEvent('begin-activity'));
  }
  wake.addEventListener('click', doWake);

  /* ---- reset for kiosk loop -------------------------------------------- */
  function reset() {
    woke = false;
  }
  return { reset };
}
