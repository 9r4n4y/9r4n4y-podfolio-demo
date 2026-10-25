import { useEffect, useRef, useState } from 'react';

/* ---- theme ---------------------------------------------------------- */

export function useDataTheme() {
  const [theme, setTheme] = useState(
    typeof document !== 'undefined' ? document.documentElement.dataset.theme || 'dark' : 'dark'
  );
  useEffect(() => {
    const onChange = e =>
      setTheme(e.detail?.theme || document.documentElement.dataset.theme || 'dark');
    window.addEventListener('am-theme', onChange);
    return () => window.removeEventListener('am-theme', onChange);
  }, []);
  return theme;
}

export function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem('am-theme', next);
  } catch {}
  window.dispatchEvent(new CustomEvent('am-theme', { detail: { theme: next } }));
}

/* ---- viewport -------------------------------------------------------- */

export function useViewportWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setW(window.innerWidth));
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return w;
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- in-view ---------------------------------------------------------- */

export function useInView(ref, { threshold = 0.3, once = true, rootMargin = '0px' } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) io.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once, rootMargin]);
  return inView;
}

/* ---- parallax ----------------------------------------------------------
   One shared rAF-throttled pass over every [data-parallax] element:
     data-parallax      = drift strength in px across the viewport pass (e.g. 60)
     data-parallax-rot  = extra rotation in deg at full drift (e.g. 1.5)
   Strictly linear: position is a pure function of scroll offset — no
   smoothing lag, no velocity skew, no time-based easing anywhere.
------------------------------------------------------------------------- */

export function useParallaxRoot() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const items = Array.from(document.querySelectorAll('[data-parallax]')).map(el => ({
      el,
      speed: parseFloat(el.dataset.parallax) || 40,
      rot: parseFloat(el.dataset.parallaxRot) || 0,
      cur: 0,
    }));
    if (!items.length) return undefined;

    const apply = () => {
      const vh = window.innerHeight || 1;
      for (const item of items) {
        // subtract the already-applied translate so the measured box is the
        // element's untransformed position (avoids a feedback loop)
        const r = item.el.getBoundingClientRect();
        const top = r.top - item.cur;
        const progress = (vh / 2 - (top + r.height / 2)) / (vh / 2 + r.height / 2);
        item.cur = progress * item.speed;
        const rot = item.rot ? ` rotate(${(item.cur / (item.speed || 1)) * item.rot}deg)` : '';
        item.el.style.transform = `translate3d(0, ${item.cur.toFixed(2)}px, 0)${rot}`;
      }
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        apply();
      });
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
}

/* ---- reveal -------------------------------------------------------------
   One-shot "develop into focus" entrance: opacity + a motion-blur filter
   that resolves to sharp. Elements opt in with the .reveal class.
------------------------------------------------------------------------- */

export function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'));
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      for (const el of els) el.classList.add('in');
      return undefined;
    }
    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, []);
}
