import { useEffect, useRef, useState } from 'react';
import RotatingText from '../rb/RotatingText.jsx';
import './GlobeStrip.css';

const COUNTRIES = ['USA', 'UK', 'INDIA', 'CHINA', 'JAPAN', 'GERMANY', 'DUBAI', 'BRAZIL'];

const clamp01 = v => Math.min(1, Math.max(0, v));

function themeColors() {
  const css = getComputedStyle(document.documentElement);
  return {
    dot: css.getPropertyValue('--fg-dim').trim() || '#98a1ab',
    hot: css.getPropertyValue('--accent').trim() || '#a3e635',
  };
}

export default function GlobeStrip() {
  const secRef = useRef(null);
  const trackRef = useRef(null);
  const canvasRef = useRef(null);
  const copyRef = useRef(null);
  const [near, setNear] = useState(false);

  // spin + draw the globe only while the strip can be seen
  useEffect(() => {
    const sec = secRef.current;
    const canvas = canvasRef.current;
    if (!sec || !canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let theta = 0;
    let last = 0;
    let colors = themeColors();
    const onTheme = () => {
      colors = themeColors();
    };
    window.addEventListener('am-theme', onTheme);

    const resize = () => {
      const px = Math.round(Math.min(window.innerHeight * 0.62, 560));
      sec.style.setProperty('--globe-h', `${px}px`);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = px * dpr;
      canvas.height = px * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(sec);

    // latitude rings of dots on a sphere, drawn with a fixed light tilt
    const TILT = -0.38;
    const points = [];
    for (let latDeg = -82.5; latDeg <= 82.5; latDeg += 7.5) {
      const lat = (latDeg * Math.PI) / 180;
      const ring = Math.max(8, Math.round(46 * Math.cos(lat)));
      for (let k = 0; k < ring; k++) {
        const lon = (k / ring) * Math.PI * 2;
        points.push({ lat, lon, hot: (latDeg * 131 + k * 37) % 29 === 0 });
      }
    }

    const draw = now => {
      const size = canvas.width / Math.min(2, window.devicePixelRatio || 1);
      const cx = size / 2;
      const cy = size / 2;
      const R = size * 0.42;
      ctx.clearRect(0, 0, size, size);

      if (!reduced && last) theta += Math.min(64, now - last) * 0.00028;
      last = now;

      // faint limb
      ctx.beginPath();
      ctx.arc(cx, cy, R + 4, 0, Math.PI * 2);
      ctx.strokeStyle = colors.dot;
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;

      const sinT = Math.sin(TILT);
      const cosT = Math.cos(TILT);
      for (const p of points) {
        const cl = Math.cos(p.lat);
        const x = cl * Math.sin(p.lon + theta);
        const y = Math.sin(p.lat);
        const z = cl * Math.cos(p.lon + theta);
        const y2 = y * cosT - z * sinT;
        const z2 = y * sinT + z * cosT;
        if (z2 <= 0.02) continue; // back hemisphere
        const depth = z2;
        ctx.globalAlpha = 0.28 + 0.7 * depth;
        ctx.fillStyle = p.hot ? colors.hot : colors.dot;
        const r = 1.4 + 2.1 * depth;
        ctx.beginPath();
        ctx.arc(cx + x * R, cy - y2 * R, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    if (reduced) {
      draw(performance.now());
      return () => {
        window.removeEventListener('am-theme', onTheme);
        ro.disconnect();
      };
    }

    const loop = now => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    if (near) {
      raf = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(raf);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('am-theme', onTheme);
      ro.disconnect();
    };
  }, [near]);

  // scroll pass: the globe enters from the right and exits left while the
  // sticky pin holds; the copy develops into focus as it crosses the middle
  useEffect(() => {
    const sec = secRef.current;
    const track = trackRef.current;
    const copy = copyRef.current;
    if (!sec || !track || !copy) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const apply = () => {
      const vh = window.innerHeight || 1;
      const vw = window.innerWidth || 1;
      const rect = sec.getBoundingClientRect();
      if (reduced) {
        track.style.transform = `translate3d(${(vw - parseFloat(getComputedStyle(track).width)) * 0.62}px, 0, 0)`;
        copy.classList.add('in');
        return;
      }
      const total = rect.height - vh;
      const p = clamp01(-rect.top / (total || 1));
      const w = parseFloat(getComputedStyle(track).width) || vw * 0.5;
      // enter from the left, cross the screen, park at the right edge —
      // constant speed, and it stops (and just keeps rotating) at p ≈ 0.8
      const startX = -(w + vw * 0.02);
      const endX = vw - w - vw * 0.04;
      const travel = clamp01(p / 0.8);
      const x = startX + (endX - startX) * travel;
      track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
      // the copy renders out behind the globe while it crosses
      copy.classList.toggle('in', p > 0.12);
    };

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // mount the rotating country text only when the strip is near the viewport
  useEffect(() => {
    const sec = secRef.current;
    if (!sec) return undefined;
    const io = new IntersectionObserver(entries => setNear(entries[0].isIntersecting), {
      rootMargin: '30% 0px',
    });
    io.observe(sec);
    return () => io.disconnect();
  }, []);

  return (
    <section className="globe-sec" id="globe" ref={secRef}>
      <div className="globe-sticky">
        <div className="globe-track" ref={trackRef}>
          <canvas ref={canvasRef} aria-hidden="true" />
        </div>
        <div className="globe-copy" ref={copyRef}>
          <span className="globe-kicker mono dim">available in</span>
          <span className="globe-line">
            {near && (
              <RotatingText
                texts={COUNTRIES}
                rotationInterval={2200}
                staggerDuration={0.028}
                splitBy="characters"
                auto
                loop
                mainClassName="globe-roll"
              />
            )}
          </span>
        </div>
      </div>
    </section>
  );
}
