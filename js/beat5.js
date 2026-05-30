/* ============================================================================
   BEAT 5 -- the payoff: secure workstation + message.txt
   ----------------------------------------------------------------------------
   The grid-collapse reveal lands on this desktop (it lives in the DOM behind the
   WebGL canvas). There is NO secret code on the machine: message.txt directs the
   kid to MOTHER (a parent playing the handler) for a PHYSICAL paper fragment, so
   the real clue never lives in the repo.

   Audio: the looped soundtrack bed continues from Beat 0. This scene adds only a
   short, DELIBERATELY NON-MELODIC Tone.js sting at the reveal (a white-noise
   riser slamming into a sub-bass impact) -- no extra audio assets.

   Tone is loaded globally via a <script> tag in index.html (window.Tone).
   ========================================================================== */

export function initBeat5({ root, onComplete, onRiser }) {
  const $ = sel => root.querySelector(sel);
  const msgIcon   = $('#b5-msgIcon');
  const win       = $('#b5-win');
  const winClose  = $('#b5-winClose');
  const decryptEl = $('#b5-decrypt');
  const messageEl = $('#b5-message');
  const clockEl   = $('#b5-clock');

  /* ---- live clock -------------------------------------------------------- */
  function tick() {
    const n = new Date();
    const p = x => String(x).padStart(2, '0');
    clockEl.textContent = p(n.getHours()) + ':' + p(n.getMinutes()) + ':' + p(n.getSeconds());
  }
  tick(); setInterval(tick, 1000);

  /* ---- Tone.js reveal sting (NON-melodic) -------------------------------
     A cinematic impact: a filtered white-noise riser builds tension, then
     slams into a pitch-dropping sub-bass boom. No pitches, no harmony. */
  let toneReady = false;
  async function ensureTone() {
    if (toneReady || !window.Tone) return;
    await window.Tone.start();
    toneReady = true;
  }
  function playSting() {
    if (!window.Tone) return;
    const Tone = window.Tone;
    const now = Tone.now();
    const RISE = 1.1;
    const hit  = now + RISE;

    // white-noise riser: filtered noise sweeping up + crescendo
    const noise = new Tone.Noise('white').start(now);
    const sweep = new Tone.Filter({ type: 'bandpass', Q: 1.2, frequency: 300 }).toDestination();
    const riseGain = new Tone.Gain(0).connect(sweep);
    noise.connect(riseGain);
    sweep.frequency.setValueAtTime(300, now);
    sweep.frequency.exponentialRampToValueAtTime(7000, hit);
    riseGain.gain.setValueAtTime(0.0001, now);
    riseGain.gain.exponentialRampToValueAtTime(0.5, hit);
    riseGain.gain.setValueAtTime(0.5, hit);
    riseGain.gain.exponentialRampToValueAtTime(0.0001, hit + 0.18);
    noise.stop(hit + 0.2);

    // sub-bass impact: a sine that pitch-drops (the "boom")
    const sub = new Tone.Oscillator(140, 'sine').start(hit);
    const subGain = new Tone.Gain(0).toDestination();
    sub.connect(subGain);
    sub.frequency.setValueAtTime(140, hit);
    sub.frequency.exponentialRampToValueAtTime(38, hit + 0.5);
    subGain.gain.setValueAtTime(0.0001, hit);
    subGain.gain.exponentialRampToValueAtTime(0.9, hit + 0.02);
    subGain.gain.exponentialRampToValueAtTime(0.0001, hit + 1.2);
    sub.stop(hit + 1.3);

    // short noise "slam" transient for punch
    const slam = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.16, sustain: 0 }
    }).toDestination();
    slam.volume.value = -10;
    slam.triggerAttackRelease('16n', hit);
  }

  /* ---- shockwave spark burst (visual partner to the impact) -------------- */
  function sparkBurst() {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const colors = ['#ff4d4d', '#ff4d4d', '#ffffff', '#8affc1'];
    for (let i = 0; i < 70; i++) {
      const s = document.createElement('span');
      s.className = 'b5-spark';
      s.style.background = colors[i % colors.length];
      s.style.left = cx + 'px';
      s.style.top  = cy + 'px';
      document.body.appendChild(s);
      const ang = Math.random() * Math.PI * 2;
      const dist = 180 + Math.random() * 460;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist;
      s.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.4)`, opacity: 0 }
      ], { duration: 600 + Math.random() * 400, easing: 'cubic-bezier(.1,.8,.2,1)' })
        .onfinish = () => s.remove();
    }
  }

  /* ---- the reveal: open message.txt -> decrypt -> message ---------------- */
  let opened = false;
  const DECRYPT_LINES = [
    '> opening message.txt ...',
    '> file is ENCRYPTED (cipher: SPYNET-256)',
    '> applying stolen key ...',
    '> decrypting ... [################] 100%',
    '> integrity verified.',
    ''
  ];

  const wait = ms => new Promise(r => setTimeout(r, ms));

  function typeLine(text) {
    return new Promise(res => {
      let i = 0;
      const span = document.createElement('div');
      decryptEl.appendChild(span);
      const id = setInterval(() => {
        span.textContent = text.slice(0, i++);
        if (i > text.length) { clearInterval(id); res(); }
      }, 16);
    });
  }

  async function openMessage() {
    if (opened) return;
    opened = true;
    msgIcon.classList.remove('hot');
    win.classList.add('show');
    decryptEl.textContent = '';
    messageEl.classList.remove('show');

    await ensureTone().catch(() => {});

    for (const line of DECRYPT_LINES) {
      await typeLine(line);
      await wait(220);
    }

    // riser starts now; its sub-bass impact lands ~1.1s later, on the reveal.
    // signal the orchestrator to duck the soundtrack to silence under it, so the
    // impact is the final sound.
    if (typeof onRiser === 'function') onRiser();
    playSting();
    await wait(1100);

    messageEl.classList.add('show');
    sparkBurst();
    if (typeof onComplete === 'function') onComplete();
  }

  msgIcon.addEventListener('click', openMessage);
  winClose.addEventListener('click', () => win.classList.remove('show'));

  /* ---- reset for kiosk auto-restart -------------------------------------- */
  function reset() {
    opened = false;
    win.classList.remove('show');
    decryptEl.textContent = '';
    messageEl.classList.remove('show');
    msgIcon.classList.add('hot');
  }

  return { reset };
}
