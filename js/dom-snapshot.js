/* ============================================================================
   DOM SNAPSHOT  -- rasterize a live DOM subtree to a <canvas>
   ----------------------------------------------------------------------------
   Used by Beat 4 (grid collapse) to get a *true* picture of the Beat 1 login
   exactly as the kid saw it, instead of a hand-painted replica. The slicing
   beat then uses that image as its texture.

   Technique: clone the target node, copy every element's *computed* style
   inline (so the clone needs no external stylesheet), serialize it into an
   <svg><foreignObject>, and draw that SVG into a canvas via an Image. No
   external libraries. This is the only built-in DOM->raster path, and it can
   fail (tainted canvas, unsupported CSS, web-font timing), so the caller is
   expected to fall back to the painted texture if this rejects.
   ========================================================================== */

// Properties we copy from getComputedStyle. A curated list keeps the inline
// style strings small (full computed style is ~350 props per node and blows up
// the SVG size); these cover everything the login screen actually uses.
const COPIED_PROPS = [
  'box-sizing', 'display', 'position', 'top', 'right', 'bottom', 'left',
  'width', 'height', 'min-height', 'max-width',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border', 'border-width', 'border-style', 'border-color', 'border-radius',
  'background', 'background-color', 'background-image',
  'color', 'opacity', 'box-shadow', 'text-shadow',
  'font', 'font-family', 'font-size', 'font-weight', 'font-style',
  'line-height', 'letter-spacing', 'text-align', 'text-decoration',
  'white-space', 'overflow', 'transform', 'transform-origin',
  'flex', 'flex-direction', 'align-items', 'justify-content', 'gap',
  'visibility',
];

function inlineStyles(srcRoot, cloneRoot) {
  const srcNodes = [srcRoot, ...srcRoot.querySelectorAll('*')];
  const cloneNodes = [cloneRoot, ...cloneRoot.querySelectorAll('*')];
  for (let i = 0; i < srcNodes.length; i++) {
    const cs = getComputedStyle(srcNodes[i]);
    const decl = cloneNodes[i].style;
    for (const prop of COPIED_PROPS) {
      const v = cs.getPropertyValue(prop);
      if (v) decl.setProperty(prop, v);
    }
    // never let a child stay hidden/animated mid-shake in the snapshot
    decl.setProperty('animation', 'none');
    decl.setProperty('transition', 'none');
  }
}

/* Capture `el` (e.g. #scene-login) into a fresh canvas of width x height
   device-independent pixels, multiplied by `scale` for crispness.
   Returns Promise<HTMLCanvasElement>. Rejects if rasterization fails. */
export function snapshotElement(el, { width, height, scale = 2, background = '#05070a' } = {}) {
  const w = width  || el.offsetWidth  || window.innerWidth;
  const h = height || el.offsetHeight || window.innerHeight;

  // 1) deep clone + inline computed styles so the SVG is self-contained
  const clone = el.cloneNode(true);
  inlineStyles(el, clone);
  // the clone is a .scene that may carry opacity:0 / visibility:hidden from
  // its inactive state; force it fully visible inside the snapshot.
  clone.style.setProperty('opacity', '1');
  clone.style.setProperty('visibility', 'visible');
  clone.style.setProperty('position', 'absolute');
  clone.style.setProperty('top', '0');
  clone.style.setProperty('left', '0');
  clone.style.setProperty('width', w + 'px');
  clone.style.setProperty('height', h + 'px');
  clone.style.setProperty('margin', '0');

  const xml = new XMLSerializer().serializeToString(clone);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
      `<rect width="100%" height="100%" fill="${background}"/>` +
      `<foreignObject width="100%" height="100%">` +
        `<div xmlns="http://www.w3.org/1999/xhtml">${xml}</div>` +
      `</foreignObject>` +
    `</svg>`;

  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // touch the data once to surface any taint/security error early
        ctx.getImageData(0, 0, 1, 1);
        resolve(canvas);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => reject(e instanceof Error ? e : new Error('svg image load failed'));
    img.src = url;
  });
}
