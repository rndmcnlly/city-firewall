/* ============================================================================
   BEATS 1 + 2 -- the calm before the storm
   ----------------------------------------------------------------------------
   Beat 1A: a dead-serious login that NEVER lets you in the front door.
   Beat 2A: a tiny corner ">_ terminal" link -- the real way through. It emits
   radial pulses (ambient + escalating failure bursts) to pull a frustrated kid
   toward the secret door. Clicking it fires login-bypassed.
   ========================================================================== */
export function initLogin({ root }) {
  const $ = sel => root.querySelector(sel);
  const loginEl  = $('#b1-login');
  const deniedEl = $('#b1-denied');
  const triesEl  = $('#b1-tries');
  const doorEl   = $('#b1-termdoor');
  const linkEl   = $('#b1-termlink');
  const handoff  = $('#b1-handoff');

  let fails = 0;
  let ambientTimer = null;
  let bypassed = false;

  function spawnRing({ dur = 1.6, max = 14, peak = 0.5, color = null, thick = 2 } = {}) {
    const ring = document.createElement('span');
    ring.className = 'b1-pulse';
    ring.style.setProperty('--dur', dur + 's');
    ring.style.setProperty('--max', max);
    ring.style.setProperty('--peak', peak);
    ring.style.borderWidth = thick + 'px';
    if (color) ring.style.borderColor = color;
    doorEl.appendChild(ring);
    ring.addEventListener('animationend', () => ring.remove());
  }

  function burst(rings, opts, gap = 120) {
    for (let i = 0; i < rings; i++) setTimeout(() => spawnRing(opts), i * gap);
  }

  function scheduleAmbient() {
    const base = Math.max(2200, 9000 - fails * 1100);
    const jitter = Math.random() * 3000;
    ambientTimer = setTimeout(() => {
      spawnRing({ dur: 2.0, max: 10 + fails * 1.5, peak: 0.25 + Math.min(fails, 5) * 0.05, thick: 2 });
      scheduleAmbient();
    }, base + jitter);
  }

  function failureBurst() {
    fails++;
    const rings = Math.min(2 + fails, 8);
    const dur   = Math.max(0.7, 1.6 - fails * 0.1);
    const max   = 12 + fails * 3;
    const peak  = Math.min(0.85, 0.45 + fails * 0.08);
    const thick = Math.min(5, 2 + Math.floor(fails / 2));
    const color = fails >= 3 ? null : '#ff7b88';
    burst(rings, { dur, max, peak, color, thick }, 90);
    if (fails >= 3) doorEl.classList.add('hot');
    if (fails === 4) {
      triesEl.innerHTML = 'LOCKOUT IMMINENT &middot; <span style="color:#8affc1">is there another way in?</span>';
    }
  }

  loginEl.addEventListener('submit', (e) => {
    e.preventDefault();
    loginEl.classList.remove('shake');
    void loginEl.offsetWidth;
    loginEl.classList.add('shake');
    deniedEl.classList.add('show');
    if (fails < 3) triesEl.textContent = 'ATTEMPTS LOGGED: ' + (fails + 1);
    failureBurst();
  });

  linkEl.addEventListener('click', (e) => {
    e.preventDefault();
    if (bypassed) return;
    bypassed = true;
    clearTimeout(ambientTimer);
    handoff.classList.add('show');
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('login-bypassed'));
    }, 900);
  });

  scheduleAmbient();

  /* ---- reset for kiosk loop -------------------------------------------- */
  function reset() {
    fails = 0;
    bypassed = false;
    deniedEl.classList.remove('show');
    triesEl.textContent = '';
    doorEl.classList.remove('hot');
    handoff.classList.remove('show');
    [...root.querySelectorAll('.b1-pulse')].forEach(p => p.remove());
    clearTimeout(ambientTimer);
    scheduleAmbient();
  }
  return { reset };
}
