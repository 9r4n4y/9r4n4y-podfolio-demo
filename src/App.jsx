import { useEffect, useState } from 'react';
import Hero from './components/Hero.jsx';
import { Nav, Ribbon, About, Projects, Experience, Contact, Footer } from './components/Sections.jsx';
import GlobeStrip from './components/GlobeStrip.jsx';
import Galaxy from './rb/Galaxy.jsx';
import { skillsLoop, roles } from './data.js';
import { useDataTheme, useParallaxRoot, useReveal } from './hooks.js';

export default function App() {
  useParallaxRoot();
  useReveal();
  const theme = useDataTheme();

  // the starfield lives below the hero — only pay for it once it can be seen
  const [bgOn, setBgOn] = useState(false);
  useEffect(() => {
    let raf = 0;
    let on = false;
    const check = () => {
      raf = 0;
      const next = window.scrollY > window.innerHeight * 0.35;
      if (next !== on) {
        on = next;
        setBgOn(next);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <div className="after-hero">
          {bgOn && (
            <div className="bg-galaxy" aria-hidden="true">
              <Galaxy
                starColors={
                  theme === 'light'
                    ? ['#33500e', '#101318', '#4e5344']
                    : ['#e8ecf1', '#a3e635', '#8f97a1']
                }
                lightMode={theme === 'light'}
                transparent
                hueShift={0}
                saturation={0}
                density={0.9}
                layers={3}
                starSpeed={0.35}
                speed={1}
                rotationSpeed={0.08}
                twinkleIntensity={0.35}
                glowIntensity={theme === 'light' ? 0.12 : 0.25}
                starSize={theme === 'light' ? 1.25 : 1.1}
                opacity={theme === 'light' ? 0.95 : 0.75}
                mouseInteraction={false}
                mouseRepulsion={false}
                clickWarp={false}
                disableAnimation={reduced}
                dpr={1}
              />
            </div>
          )}
          <Ribbon text={roles} shape="wave" />
          <About />
          <Ribbon text={skillsLoop} shape="line" ribbon={false} id="skills" />
          <Projects />
          <Experience />
          <GlobeStrip />
          <Contact />
          <Footer />
        </div>
      </main>
    </>
  );
}
