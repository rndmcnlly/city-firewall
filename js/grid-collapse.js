/* ============================================================================
   BEAT 4 -- GRID COLLAPSE reveal (Three.js)
   ----------------------------------------------------------------------------
   The login screen is drawn onto a 2D <canvas> and used as a CanvasTexture on a
   plane sliced into a grid of tiles. On trigger, lasers carve the grid line by
   line, then the tiles peel away in a diagonal domino cascade, revealing the
   REAL Beat 5 secure desktop sitting in the DOM behind the (alpha) WebGL canvas.

   In the standalone prototype this beat revealed its own placeholder desktop and
   ran on a timer. In the synthesis it is a module: the orchestrator calls
   startGridCollapse() when Beat 3 finishes, and we fire 'reveal-complete' when
   the last tile is gone so Beat 5 can take over.
   ========================================================================== */
import * as THREE from 'three';

export function initGridCollapse({ canvas, onComplete }) {
  // ---- Grid resolution. 10 columns x 7 rows = 70 tiles (crisp, rhythmic). ----
  const COLS = 10;
  const ROWS = 7;

  // ---- Login texture authoring resolution (the canvas we draw the UI on). ----
  const TEX_W = 1024;
  const TEX_H = 720;

  // =========================================================================
  // 1) DRAW THE LOGIN SCREEN ONTO A 2D CANVAS  -> CanvasTexture
  // =========================================================================
  const loginCanvas = document.createElement('canvas');
  loginCanvas.width = TEX_W;
  loginCanvas.height = TEX_H;
  const lctx = loginCanvas.getContext('2d');

  // Progressive "scorch" cuts carved by the lasers, redrawn each frame.
  const cuts = [];

  function drawLogin() {
    const ctx = lctx;
    const W = TEX_W, H = TEX_H;

    // background: matches #scene-login (radial dark blue-black)
    const bg = ctx.createRadialGradient(W/2, H*0.38, 80, W/2, H/2, W*0.7);
    bg.addColorStop(0, '#0e1622');
    bg.addColorStop(1, '#05070a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ---- the login card (Beat 1: SECURE PORTAL). Proportions echo the real
    //      340px-wide DOM card, scaled up for the 1024x720 texture. ----
    const cardW = 520, cardH = 400;
    const cx = (W - cardW) / 2, cy = (H - cardH) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
    roundRect(ctx, cx, cy, cardW, cardH, 12);
    ctx.fillStyle = '#0c1119';            // --panel of the login beat
    ctx.fill();
    ctx.restore();

    roundRect(ctx, cx, cy, cardW, cardH, 12);
    ctx.lineWidth = 2; ctx.strokeStyle = '#1d2735'; ctx.stroke();

    // brand header: "// CITY SPIES //"  +  "SECURE PORTAL"
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5f7d72';            // --dim
    ctx.font = '600 18px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText('// CITY SPIES //', W/2, cy + 56);
    ctx.fillStyle = '#d7e6df';            // --fg
    ctx.font = '600 26px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText('SECURE PORTAL', W/2, cy + 90);

    // ---- fields: AGENT ID / PASSCODE (matches the real login labels) ----
    const fieldX = cx + 50, fieldW = cardW - 100, fieldH = 50;
    drawField(ctx, fieldX, cy + 140, fieldW, fieldH, 'AGENT ID', 'agent_07');
    drawField(ctx, fieldX, cy + 214, fieldW, fieldH, 'PASSCODE', '••••••••••••');

    // ---- LOG IN button ----
    const btnY = cy + 284, btnH = 46;
    roundRect(ctx, fieldX, btnY, fieldW, btnH, 6);
    ctx.fillStyle = '#1a2632';
    ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#2a3a4d'; ctx.stroke();
    ctx.fillStyle = '#cdd9e5';
    ctx.font = '600 15px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('L O G   I N', W/2, btnY + btnH/2 + 5);

    // ---- the corner ">_ terminal" link (the real way through, now spent) ----
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(138,255,193,0.6)';   // --term, dimmed
    ctx.font = '15px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText('>_ terminal', W - 24, H - 24);

    // ---- "FIREWALL BREACHED" stamp (by now it IS breached) ----
    ctx.save();
    ctx.translate(W/2, cy + 354);
    ctx.rotate(-0.05);
    ctx.strokeStyle = '#ff3b4e';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.95;
    roundRect(ctx, -210, -32, 420, 64, 8);
    ctx.stroke();
    ctx.fillStyle = '#ff3b4e';
    ctx.font = '700 30px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FIREWALL BREACHED', 0, 2);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';

    for (const cut of cuts) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.shadowColor = '#ff4d4d';
      ctx.shadowBlur = 16;
      if (cut.axis === 'v') {
        const x = cut.pos * W;
        const y1 = 0, y2 = H * cut.t;
        ctx.strokeStyle = 'rgba(255,77,77,0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
        ctx.shadowBlur = 6;
        ctx.strokeStyle = 'rgba(255,235,235,0.95)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
      } else {
        const y = cut.pos * H;
        const x1 = 0, x2 = W * cut.t;
        ctx.strokeStyle = 'rgba(255,77,77,0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
        ctx.shadowBlur = 6;
        ctx.strokeStyle = 'rgba(255,235,235,0.95)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
  }

  function drawField(ctx, x, y, w, h, label, value) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#5f7d72';            // --dim (login beat)
    ctx.font = '13px ui-monospace, Menlo, monospace';
    ctx.fillText(label, x, y - 9);
    roundRect(ctx, x, y, w, h, 5);
    ctx.fillStyle = '#060a0f';            // input bg
    ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#2a3a4d'; ctx.stroke();
    ctx.fillStyle = '#d7e6df';            // --fg
    ctx.font = '18px ui-monospace, Menlo, monospace';
    ctx.fillText(value, x + 14, y + h/2 + 6);
  }

  drawLogin();
  const loginTexture = new THREE.CanvasTexture(loginCanvas);
  loginTexture.colorSpace = THREE.SRGBColorSpace;
  loginTexture.minFilter = THREE.LinearFilter;
  loginTexture.generateMipmaps = false;

  // =========================================================================
  // 2) THREE.JS SCENE SETUP
  // =========================================================================
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2, 3, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff4d4d, 0.4);
  rim.position.set(-4, -2, 3);
  scene.add(rim);

  // ---- Laser beam group --------------------------------------------------
  const laserGroup = new THREE.Group();
  laserGroup.visible = false;
  scene.add(laserGroup);

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xff5a5a, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthTest: false, side: THREE.DoubleSide
  });
  const beamMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), beamMat);
  beamMesh.renderOrder = 5;
  laserGroup.add(beamMesh);

  const sparkMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 1.0,
    blending: THREE.AdditiveBlending, depthTest: false
  });
  const spark = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), sparkMat);
  spark.renderOrder = 6;
  laserGroup.add(spark);

  const BEAM_Z = 0.05;

  const PLANE_H = 6;
  const PLANE_W = PLANE_H * (TEX_W / TEX_H);

  // =========================================================================
  // 3) BUILD THE TILE GRID
  // =========================================================================
  const tileW = PLANE_W / COLS;
  const tileH = PLANE_H / ROWS;

  function makeTileMaterial() {
    return new THREE.MeshStandardMaterial({
      map: loginTexture, roughness: 0.55, metalness: 0.15,
      side: THREE.DoubleSide, transparent: true, opacity: 1.0
    });
  }

  const tiles = [];
  const gridGroup = new THREE.Group();
  scene.add(gridGroup);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const geo = new THREE.PlaneGeometry(tileW, tileH);
      const u0 = c / COLS, u1 = (c + 1) / COLS;
      const vTop = 1 - r / ROWS;
      const vBot = 1 - (r + 1) / ROWS;
      const uv = geo.attributes.uv;
      uv.setXY(0, u0, vTop);
      uv.setXY(1, u1, vTop);
      uv.setXY(2, u0, vBot);
      uv.setXY(3, u1, vBot);
      uv.needsUpdate = true;

      const mat = makeTileMaterial();
      const mesh = new THREE.Mesh(geo, mat);

      const cxw = -PLANE_W/2 + (c + 0.5) * tileW;
      const cyw =  PLANE_H/2 - (r + 0.5) * tileH;

      const pivot = new THREE.Object3D();
      pivot.position.set(cxw, cyw - tileH/2, 0);
      mesh.position.set(0, tileH/2, 0);
      pivot.add(mesh);
      gridGroup.add(pivot);

      const edgeGeo = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0xff4d4d, transparent: true, opacity: 0.0 });
      const edges = new THREE.LineSegments(edgeGeo, edgeMat);
      edges.position.copy(mesh.position);
      pivot.add(edges);

      const diag = (c + r) / (COLS + ROWS - 2);
      const STAGGER_WINDOW = 0.45;
      const delay = diag * STAGGER_WINDOW;

      tiles.push({
        pivot, mesh, mat, edges, edgeMat,
        col: c, row: r, delay,
        spin: (Math.random() - 0.5) * 1.2,
        drift: (Math.random() - 0.5) * 0.8,
        homePos: pivot.position.clone(),
      });
    }
  }

  // =========================================================================
  // 4) ANIMATION STATE MACHINE
  // =========================================================================
  let phase = 'dormant';   // dormant -> idle -> slicing -> collapse -> done
  let phaseStart = 0;
  const SLICE_MS = 115;
  const SLICE_GAP_MS = 35;
  const GRAVITY = 19;
  const FALL_DURATION = 0.8;
  let completed = false;

  function buildCutSchedule() {
    const verticals = [];
    for (let c = 1; c < COLS; c++) verticals.push({ axis: 'v', pos: c / COLS });
    const horizontals = [];
    for (let r = 1; r < ROWS; r++) horizontals.push({ axis: 'h', pos: r / ROWS });
    const schedule = [];
    let i = 0, j = 0;
    while (i < verticals.length || j < horizontals.length) {
      if (i < verticals.length) schedule.push(verticals[i++]);
      if (j < horizontals.length) schedule.push(horizontals[j++]);
    }
    return schedule;
  }
  let cutSchedule = [];
  let cutIndex = 0;

  function resetTiles() {
    for (const t of tiles) {
      t.pivot.position.copy(t.homePos);
      t.pivot.rotation.set(0, 0, 0);
      t.mesh.rotation.set(0, 0, 0);
      t.mat.opacity = 1.0;
      t.edgeMat.opacity = 0.0;
      t.vy = 0; t.started = false; t.tElapsed = 0;
    }
  }

  function placeBeam(cut, t) {
    const halfW = PLANE_W / 2, halfH = PLANE_H / 2;
    if (cut.axis === 'v') {
      const x = -halfW + cut.pos * PLANE_W;
      const burnedLen = t * PLANE_H;
      beamMesh.position.set(x, halfH - burnedLen / 2, BEAM_Z);
      beamMesh.scale.set(0.05, burnedLen, 1);
      beamMesh.rotation.z = 0;
      spark.position.set(x, halfH - burnedLen, BEAM_Z);
    } else {
      const y = halfH - cut.pos * PLANE_H;
      const burnedLen = t * PLANE_W;
      beamMesh.position.set(-halfW + burnedLen / 2, y, BEAM_Z);
      beamMesh.scale.set(burnedLen, 0.05, 1);
      beamMesh.rotation.z = 0;
      spark.position.set(-halfW + burnedLen, y, BEAM_Z);
    }
  }

  function enterSlicing() {
    phase = 'slicing';
    cutIndex = 0;
    laserGroup.visible = true;
    cuts.push({ axis: cutSchedule[0].axis, pos: cutSchedule[0].pos, t: 0 });
    phaseStart = performance.now();
  }

  function enterCollapse() {
    laserGroup.visible = false;
    drawLogin();
    loginTexture.needsUpdate = true;
    phase = 'collapse';
    phaseStart = performance.now();
  }

  // =========================================================================
  // 5) RESIZE / CAMERA FIT (cover semantics)
  // =========================================================================
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    const distForH = (PLANE_H / 2) / Math.tan(vFOV / 2);
    const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * camera.aspect);
    const distForW = (PLANE_W / 2) / Math.tan(hFOV / 2);
    camera.position.z = Math.max(distForH, distForW);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // =========================================================================
  // 6) MAIN LOOP
  // =========================================================================
  let lastT = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;

    if (phase === 'slicing') {
      const SLOT = SLICE_MS + SLICE_GAP_MS;
      const sliceElapsed = now - phaseStart;
      const slot = Math.floor(sliceElapsed / SLOT);
      const within = sliceElapsed - slot * SLOT;

      while (slot > cutIndex && cutIndex < cutSchedule.length - 1) {
        if (cuts[cutIndex]) cuts[cutIndex].t = 1;
        cutIndex++;
        cuts.push({ axis: cutSchedule[cutIndex].axis, pos: cutSchedule[cutIndex].pos, t: 0 });
      }

      const active = cuts[Math.min(cutIndex, cuts.length - 1)];
      if (active) {
        const raw = Math.min(within / SLICE_MS, 1);
        active.t = 1 - Math.pow(1 - raw, 2);
        placeBeam(cutSchedule[cutIndex], active.t);
        const flick = 0.75 + 0.25 * Math.sin(now * 0.05);
        beamMat.opacity = (raw < 1 ? 0.9 : 0.0) * flick;
        sparkMat.opacity = raw < 1 ? flick : 0.0;
      }

      drawLogin();
      loginTexture.needsUpdate = true;

      if (cutIndex >= cutSchedule.length - 1 && within >= SLICE_MS) {
        if (cuts[cutIndex]) cuts[cutIndex].t = 1;
        drawLogin();
        loginTexture.needsUpdate = true;
        enterCollapse();
      }
    } else if (phase === 'collapse') {
      const tSeq = (now - phaseStart) / 1000;
      let anyAlive = false;

      for (const t of tiles) {
        if (tSeq < t.delay) { anyAlive = true; continue; }
        if (!t.started) { t.started = true; t.vy = -0.4; t.tElapsed = 0; }
        t.tElapsed += dt;

        const lifeFrac = Math.min(t.tElapsed / FALL_DURATION, 1);
        t.edgeMat.opacity = (1 - lifeFrac) * 0.9;

        const flip = Math.min(t.tElapsed * 6.4, Math.PI * 0.85);
        t.pivot.rotation.x = -flip;
        t.mesh.rotation.z = t.spin * lifeFrac;

        t.vy -= GRAVITY * dt;
        t.pivot.position.y += t.vy * dt;
        t.pivot.position.z -= 2.0 * dt;
        t.pivot.position.x += t.drift * dt;

        t.mat.opacity = 1 - Math.max(0, (lifeFrac - 0.5) / 0.5);

        if (lifeFrac < 1) anyAlive = true;
      }

      if (!anyAlive) {
        phase = 'done';
        gridGroup.visible = false;
        canvas.style.pointerEvents = 'none';
        if (!completed) {
          completed = true;
          if (typeof onComplete === 'function') onComplete();
        }
      }
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  // =========================================================================
  // 7) PUBLIC CONTROLS (driven by the orchestrator)
  // =========================================================================
  function start() {
    cuts.length = 0;
    cutSchedule = buildCutSchedule();
    cutIndex = 0;
    completed = false;
    drawLogin();
    loginTexture.needsUpdate = true;
    resetTiles();
    gridGroup.visible = true;
    laserGroup.visible = false;
    canvas.style.pointerEvents = 'none';   // kiosk: no click-to-skip
    // brief beat on the breached login, then the lasers begin
    phase = 'idle';
    phaseStart = performance.now();
    setTimeout(() => { if (phase === 'idle') enterSlicing(); }, 600);
  }

  function reset() {
    cuts.length = 0;
    resetTiles();
    gridGroup.visible = true;
    laserGroup.visible = false;
    phase = 'dormant';
    completed = false;
    drawLogin();
    loginTexture.needsUpdate = true;
  }

  return { start, reset };
}
