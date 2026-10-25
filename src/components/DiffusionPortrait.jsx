import { useEffect, useRef } from 'react';
import './DiffusionPortrait.css';

/*
 * DiffusionPortrait — the photo starts as a live ASCII "latent" and
 * denoises into the real photograph, cell by cell, like a reverse
 * diffusion process.
 *
 * - Each grid cell gets a resolve threshold τ built from clumpy value
 *   noise (so denoising fronts travel in patches, not confetti) with a
 *   mild radial bias from the center.
 * - While a cell waits, its character keeps re-rolling around its
 *   luminance-mapped glyph; the further the process is along, the less
 *   it boils (noise decreasing).
 * - Inside the resolve band the cell crossfades from glyph to the real
 *   photo pixels; a thin grain field rides the front and fades out.
 * - Hover/click re-diffuses with a fresh noise seed. Reduced-motion
 *   users get the photo directly.
 */

const RAMP = ' .`:,;~=+*x#%@';
const BAND = 0.11; // width of the resolve window in τ units
const IDLE_BOIL_CELLS_PER_TICK = 26;
const DURATION = 4200;

const hash2 = (x, y, seed) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const smooth = t => t * t * (3 - 2 * t);

// cheap clumpy value noise in [0,1]
const valueNoise = (x, y, seed) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  const u = smooth(xf);
  const v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function readThemeColors() {
  const css = getComputedStyle(document.documentElement);
  const bg = css.getPropertyValue('--bg').trim() || '#0a0b0d';
  const fg = css.getPropertyValue('--fg').trim() || '#e8ecf1';
  const accent = css.getPropertyValue('--accent').trim() || '#a3e635';
  const light = document.documentElement.dataset.theme === 'light';
  return { bg, fg, accent, light };
}

export default function DiffusionPortrait({ src, alt, seed = 7 }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const sigRef = useRef(null);
  const stateRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const img = new Image();
    img.src = src;
    let disposed = false;
    let raf = 0;

    const fail = () => {
      if (disposed) return;
      const err = document.createElement('div');
      err.className = 'diffusion-error';
      err.textContent = 'img 404 — portrait still compiling';
      wrap.appendChild(err);
    };
    img.onerror = fail;

    const build = () => {
      if (disposed) return;
      const rect = wrap.getBoundingClientRect();
      const cssW = Math.max(80, rect.width);
      const cssH = Math.max(100, rect.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = Math.round(cssW * dpr);
      const H = Math.round(cssH * dpr);
      canvas.width = W;
      canvas.height = H;

      const theme = readThemeColors();

      // ---- photo layer (cover-cropped) --------------------------------
      const photo = document.createElement('canvas');
      photo.width = W;
      photo.height = H;
      const pctx = photo.getContext('2d');
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = W / H;
      let sw = img.naturalWidth;
      let sh = img.naturalHeight;
      if (ir > cr) {
        sw = img.naturalHeight * cr;
      } else {
        sh = img.naturalWidth / cr;
      }
      pctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, W, H);

      // ---- grid ---------------------------------------------------------
      const cols = Math.min(104, Math.max(56, Math.round(cssW / 9)));
      const cell = W / cols;
      const rows = Math.ceil(H / cell);
      const data = pctx.getImageData(0, 0, W, H).data;

      const lum = new Float32Array(cols * rows);
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const x0 = Math.floor(gx * cell);
          const y0 = Math.floor(gy * cell);
          const x1 = Math.min(W, Math.floor((gx + 1) * cell));
          const y1 = Math.min(H, Math.floor((gy + 1) * cell));
          let sum = 0;
          let n = 0;
          for (let y = y0; y < y1; y += 2) {
            for (let x = x0; x < x1; x += 2) {
              const i = (y * W + x) * 4;
              sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
              n++;
            }
          }
          const l = n ? sum / n : 0;
          // contrast boost around the midtones
          lum[gy * cols + gx] = Math.min(1, Math.max(0, (l / 255 - 0.5) * 1.35 + 0.52));
        }
      }

      // ---- resolve thresholds (clumpy + radial) --------------------------
      const noiseSeed = seed + Math.floor(Math.random() * 1000);
      const tau = new Float32Array(cols * rows);
      const order = [];
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const idx = gy * cols + gx;
          const clump = valueNoise(gx * 0.14, gy * 0.14, noiseSeed);
          const speck = hash2(gx, gy, noiseSeed + 99);
          const nx = (gx / cols - 0.5) * 2;
          const ny = (gy / rows - 0.5) * 2;
          const radial = Math.min(1, Math.hypot(nx, ny) / 1.25);
          const t = 0.62 * clump + 0.22 * speck + 0.16 * radial;
          tau[idx] = 0.05 + 0.9 * Math.min(1, Math.max(0, t));
        }
      }
      for (let i = 0; i < tau.length; i++) order.push(i);
      order.sort((a, b) => tau[a] - tau[b]);

      const charFor = idx => {
        const l = lum[idx];
        // dark theme: bright pixels → dense glyphs; light theme: inverted
        const t = theme.light ? 1 - l : l;
        return RAMP[Math.min(RAMP.length - 1, Math.floor(t * RAMP.length))];
      };

      // ---- ASCII cache layer --------------------------------------------
      const ascii = document.createElement('canvas');
      ascii.width = W;
      ascii.height = H;
      const actx = ascii.getContext('2d');
      const fontSize = cell * 1.72;
      const paintAsciiCell = (idx, chOverride) => {
        const gx = idx % cols;
        const gy = (idx / cols) | 0;
        const x = gx * cell;
        const y = gy * cell;
        actx.fillStyle = theme.bg;
        actx.fillRect(x, y, cell + 1, cell + 1);
        const ch = chOverride ?? charFor(idx);
        if (ch !== ' ') {
          const l = lum[idx];
          actx.globalAlpha = 0.45 + 0.55 * l;
          actx.fillStyle = theme.fg;
          actx.font = `${fontSize}px "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace`;
          actx.textAlign = 'center';
          actx.textBaseline = 'middle';
          actx.fillText(ch, x + cell / 2, y + cell / 2 + fontSize * 0.04);
          actx.globalAlpha = 1;
        }
      };
      for (let i = 0; i < cols * rows; i++) paintAsciiCell(i);

      // per-cell boil schedules
      const nextMut = new Float32Array(cols * rows);
      const resetMut = (idx, now) => {
        nextMut[idx] = now + 40 + Math.random() * 260;
      };
      const now0 = performance.now();
      for (let i = 0; i < cols * rows; i++) resetMut(i, now0);

      const st = {
        cols, rows, cell, dpr, W, H, theme,
        photo, ascii, actx, ctx,
        tau, order, paintAsciiCell, charFor,
        nextMut, resetMut,
        cursor: 0, // index into `order`: cells before it are (mostly) resolved
        p: 0,
        phase: reduced ? 'done' : 'ascii', // ascii | diffusing | done
        lastFrame: 0,
        lastBoil: 0,
      };
      stateRef.current = st;

      const sig = sigRef.current;
      if (sig) sig.textContent = '1.00';

      const t0 = performance.now();
      render(t0);
      st.lastFrame = t0;

      const loop = now => {
        if (disposed || !stateRef.current) return;
        const s = stateRef.current;
        if (s.phase === 'diffusing') {
          const dt = Math.min(64, now - s.lastFrame);
          s.p = Math.min(1, s.p + dt / DURATION);
          if (s.p >= 1) {
            s.phase = 'done';
            if (sigRef.current) sigRef.current.textContent = '0.00';
          } else if (sigRef.current) {
            sigRef.current.textContent = (1 - s.p).toFixed(2);
          }
        }
        render(now);
        s.lastFrame = now;
        if (s.phase === 'done') {
          raf = 0; // fully resolved: stop drawing until re-diffused
          return;
        }
        raf = requestAnimationFrame(loop);
      };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };

    // ---- render (returns true when it drew something new) ---------------
    const render = (now = performance.now()) => {
      const s = stateRef.current;
      if (!s) return false;
      const { ctx, W, H, cell, dpr, cols, photo, ascii, tau, order } = s;

      if (s.phase === 'done') {
        s.ctx.fillStyle = s.theme.bg;
        s.ctx.fillRect(0, 0, W, H);
        s.ctx.drawImage(photo, 0, 0);
        return true;
      }

      // ASCII latent base, with boiling glyphs. While idle the boil runs at
      // ~14 Hz and the composite is skipped entirely on no-change frames.
      if (s.phase === 'ascii' && now - s.lastBoil < 70) return false;
      s.lastBoil = now;
      const boiling = s.phase === 'ascii' || s.p < 0.995;
      if (boiling) {
        const rate = s.phase === 'ascii' ? 1 : 1 - s.p * 0.55;
        let boiled = 0;
        for (let k = 0; k < IDLE_BOIL_CELLS_PER_TICK * (s.phase === 'ascii' ? 1 : 3) && boiled < 90; k++) {
          const idx = (Math.random() * tau.length) | 0;
          if (s.phase === 'diffusing' && tau[idx] <= s.p - BAND) continue; // already resolved
          if (now < s.nextMut[idx]) continue;
          s.resetMut(idx, now + (s.phase === 'ascii' ? 0 : 90 + Math.random() * 240 * rate + 160 * s.p));
          const base = s.charFor(idx);
          const bi = RAMP.indexOf(base);
          const jitter = bi <= 0 ? bi : Math.min(RAMP.length - 1, Math.max(0, bi + ((Math.random() * 5) | 0) - 2));
          s.paintAsciiCell(idx, RAMP[jitter]);
          boiled++;
        }
      }
      s.ctx.fillStyle = s.theme.bg;
      s.ctx.fillRect(0, 0, W, H);
      s.ctx.drawImage(ascii, 0, 0);

      if (s.phase !== 'diffusing') {
        drawGrain(s, 1, now);
        return true;
      }

      const p = s.p;
      // advance the resolve cursor past fully-resolved cells
      while (s.cursor < order.length && tau[order[s.cursor]] <= p - BAND) s.cursor++;

      // paint resolved cells first (opaque photo), then the crossfade band
      for (let i = 0; i < s.cursor; i++) {
        const idx = order[i];
        drawPhotoCell(s, idx);
      }
      for (let i = s.cursor; i < order.length; i++) {
        const idx = order[i];
        const t = tau[idx];
        if (t > p) break;
        const k = smooth((p - t) / BAND);
        if (k > 0.02) {
          s.ctx.globalAlpha = k;
          drawPhotoCell(s, idx);
          s.ctx.globalAlpha = 1;
        }
      }

      drawGrain(s, 1 - p, now);

      if (p >= 1) {
        s.ctx.drawImage(photo, 0, 0);
      }
      return true;
    };

    const drawPhotoCell = (s, idx) => {
      const { cols, cell, photo, ctx } = s;
      const gx = idx % cols;
      const gy = (idx / cols) | 0;
      const px = Math.floor(gx * cell);
      const py = Math.floor(gy * cell);
      const pw = Math.ceil(cell) + 1;
      ctx.drawImage(photo, px, py, pw, pw, px, py, pw, pw);
    };

    const drawGrain = (s, strength, now) => {
      if (strength <= 0.02) return;
      const { ctx, W, H, dpr } = s;
      const count = Math.round(110 * strength);
      ctx.fillStyle = s.theme.fg;
      for (let i = 0; i < count; i++) {
        ctx.globalAlpha = (0.05 + Math.random() * 0.22) * strength;
        const x = Math.random() * W;
        const y = Math.random() * H;
        ctx.fillRect(x, y, dpr, dpr);
      }
      ctx.globalAlpha = 1;
    };

    // ---- lifecycle ------------------------------------------------------
    const startDiffusion = () => {
      const s = stateRef.current;
      if (!s || s.phase !== 'ascii') return;
      s.phase = 'diffusing';
      if (!raf) raf = requestAnimationFrame(function tickLoop(now) {
        // the main loop was parked after a previous resolve; rebuild it here
        if (disposed || !stateRef.current) return;
        const st = stateRef.current;
        if (st.phase === 'diffusing') {
          const dt = Math.min(64, now - st.lastFrame);
          st.p = Math.min(1, st.p + dt / DURATION);
          if (st.p >= 1) {
            st.phase = 'done';
            if (sigRef.current) sigRef.current.textContent = '0.00';
          } else if (sigRef.current) {
            sigRef.current.textContent = (1 - st.p).toFixed(2);
          }
        }
        render(now);
        st.lastFrame = now;
        if (st.phase === 'done') {
          raf = 0;
          return;
        }
        raf = requestAnimationFrame(tickLoop);
      });
    };

    const rediffuse = () => {
      const s = stateRef.current;
      if (!s || s.phase !== 'done') return;
      // fresh noise seed → a different denoise pattern every pass
      const saved = { tau: s.tau, order: s.order, cursor: s.cursor, p: s.p };
      build();
      const ns = stateRef.current;
      if (ns && saved) {
        ns.phase = 'diffusing';
        ns.p = 0;
        ns.cursor = 0;
      }
    };

    const onEnter = () => {
      const s = stateRef.current;
      if (!s) return;
      if (s.phase === 'done') rediffuse();
      else startDiffusion();
    };

    let io;
    const onImgLoad = () => {
      if (disposed) return;
      try {
        document.fonts.ready.then(() => {
          if (!disposed) build();
        });
      } catch {
        build();
      }
      if (reduced) return;
      io = new IntersectionObserver(
        entries => {
          if (entries.some(e => e.isIntersecting)) {
            io.disconnect();
            io = null;
            setTimeout(() => startDiffusion(), 350);
          }
        },
        { threshold: 0.3 }
      );
      io.observe(wrap);
    };
    img.onload = onImgLoad;

    wrap.addEventListener('pointerenter', onEnter);
    wrap.addEventListener('click', onEnter);

    let resizeT = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        const s = stateRef.current;
        const wasDone = s && (s.phase === 'done' || s.p > 0);
        build();
        if (wasDone && stateRef.current) stateRef.current.phase = 'done';
      }, 180);
    });
    ro.observe(wrap);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(resizeT);
      if (io) io.disconnect();
      ro.disconnect();
      wrap.removeEventListener('pointerenter', onEnter);
      wrap.removeEventListener('click', onEnter);
      stateRef.current = null;
    };
  }, [src, seed]);

  return (
    <div className="diffusion" ref={wrapRef}>
      <canvas ref={canvasRef} aria-label={alt} role="img" />
      <div className="diffusion-hud">
        <span>
          noise σ: <span className="sig" ref={sigRef}>1.00</span>
        </span>
      </div>
    </div>
  );
}
