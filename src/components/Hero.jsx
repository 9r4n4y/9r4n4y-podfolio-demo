import { useEffect, useRef, useState } from 'react';
import Dither from '../rb/Dither.jsx';
import TechText from '../rb/TechText.jsx';
import { person } from '../data.js';
import { useDataTheme, useViewportWidth } from '../hooks.js';

const THEME_COLORS = {
  dark: {
    wave: [0.49, 0.72, 0.17],
    bg: [0.031, 0.035, 0.043],
    palette: [[0.039, 0.047, 0.055], [0.14, 0.2, 0.075], [0.28, 0.42, 0.11], [0.49, 0.72, 0.17]],
  },
  light: {
    wave: [0.18, 0.24, 0.09],
    bg: [0.945, 0.941, 0.918],
    palette: [[0.302, 0.388, 0.125], [0.51, 0.573, 0.271], [0.741, 0.769, 0.6]],
  },
};

export default function Hero() {
  const theme = useDataTheme();
  const vw = useViewportWidth();
  const contentRef = useRef(null);
  const heroRef = useRef(null);
  // the dither field is the heaviest thing on the page — only keep it
  // mounted while the hero can be seen
  const [ditherOn, setDitherOn] = useState(true);

  // hero content drifts up + fades + softens as you scroll away
  useEffect(() => {
    const el = contentRef.current;
    const hero = heroRef.current;
    if (!el || !hero) return undefined;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        el.style.transform = `translate3d(0, ${(y * 0.32).toFixed(1)}px, 0)`;
        el.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.62)).toFixed(3);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const io = new IntersectionObserver(
      entries => setDitherOn(entries[0].isIntersecting),
      { rootMargin: '20% 0px' }
    );
    io.observe(hero);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  const nameSize = Math.round(Math.min(150, Math.max(50, vw * 0.098)));
  const colors = THEME_COLORS[theme === 'light' ? 'light' : 'dark'];
  const accent = theme === 'light' ? '#3f6212' : '#a3e635';
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <header className="hero" id="top" ref={heroRef}>
      <div className="hero-bg">
        {ditherOn && (
          <Dither
            waveColor={colors.wave}
            backgroundColor={colors.bg}
            palette={colors.palette}
            ditherMode="bayer"
            colorNum={4}
            pixelSize={vw < 760 ? 4 : 3}
            waveSpeed={0.045}
            waveFrequency={4.5}
            waveAmplitude={0.09}
            scale={1.5}
            contrast={0.9}
            mouseRadius={1}
            mouseEffect="erase"
            mouseStrength={0.8}
            clickRipple
            disableAnimation={reduced}
          />
        )}
      </div>

      <div className="hero-hud hero-hud--tl">
        pranaysingh.dev — est. 2016
        <br />
        <span className="dim">✓ 0 trackers · 0 cookies · just pixels</span>
      </div>
      <div className="hero-hud hero-hud--tr">
        build: passing
        <br />
        <span className="dim">uptime 8y · crash 2×</span>
      </div>

      <div className="hero-content" ref={contentRef}>
        <p className="kicker reveal">{'// ~/hello — i build fast things for slow networks'}</p>
        <h1 className="hero-name" aria-label={person.name}>
          <TechText
            text={person.name.toUpperCase()}
            fontSize={nameSize}
            fontWeight={700}
            letterSpacing={-0.04}
            accentColor={accent}
            reach={Math.round(nameSize * 1.35)}
            softness={0.7}
            lineStyle="dashed"
            reveal="letter"
            speed={1}
          />
        </h1>
      </div>

      <div className="scroll-hint mono" aria-hidden="true">
        scroll ↓
      </div>
    </header>
  );
}
