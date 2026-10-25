import { useEffect, useRef, useState } from 'react';
import TextLoop from '../rb/TextLoop.jsx';
import VariableProximity from '../rb/VariableProximity.jsx';
import ParticleText from '../rb/ParticleText.jsx';
import DiffusionPortrait from './DiffusionPortrait.jsx';
import { person, roles, skillsLoop, bio, facts, stats, projects, experience, socials } from '../data.js';
import { toggleTheme, useDataTheme, useInView, useViewportWidth } from '../hooks.js';

/* ---- nav ------------------------------------------------------------- */

export function Nav() {
  const theme = useDataTheme();
  const links = [
    ['01', 'about', '#about'],
    ['02', 'work', '#work'],
    ['03', 'xp', '#xp'],
    ['04', 'contact', '#contact'],
  ];
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a className="brand mono" href="#top">
          <span className="brand-prompt">voidptr@root</span>:~$<span className="brand-caret">▊</span>
        </a>
        <div className="nav-links mono">
          {links.map(([n, label, href]) => (
            <a key={href} href={href}>
              <span className="dim">{n}.</span>
              {label}
            </a>
          ))}
        </div>
        <button
          type="button"
          className="theme-btn mono"
          onClick={toggleTheme}
          aria-label={`switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀ light' : '☾ dark'}
        </button>
      </div>
    </nav>
  );
}

/* ---- shared section heading (VariableProximity) ------------------------ */

export function SectionHead({ index, title, id }) {
  const sectionRef = useRef(null);
  const vw = useViewportWidth();
  const size = Math.round(Math.min(64, Math.max(34, vw * 0.052)));
  return (
    <div className="sec-head" ref={sectionRef}>
      <span className="sec-index mono dim" data-parallax={-26}>
        {index}
      </span>
      <h2 className="sec-title">
        <VariableProximity
          label={title}
          containerRef={sectionRef}
          fromFontVariationSettings="'wght' 500"
          toFontVariationSettings="'wght' 900"
          radius={170}
          falloff="gaussian"
          smoothing={0.16}
          idleWave
          scale={1.02}
          fontSize={`${size}px`}
        />
      </h2>
    </div>
  );
}

/* ---- ribbon loops (TextLoop) ------------------------------------------- */

export function Ribbon({ text, shape = 'wave', ribbon = true, id }) {
  const theme = useDataTheme();
  const vw = useViewportWidth();
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  const size = Math.round(Math.min(34, Math.max(20, vw * 0.022)));
  const ink = theme === 'light' ? '#14170b' : '#0d1006';

  // the marquee is a per-frame GSAP loop — only run it near the viewport
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(entries => setNear(entries[0].isIntersecting), {
      rootMargin: '30% 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="ribbon" id={id} ref={ref} aria-hidden="true">
      {near && (
        <TextLoop
          text={text}
          separator="✦"
          shape={shape}
          speed={80}
          curviness={shape === 'wave' ? 45 : 0}
          fontSize={size}
          fontWeight={800}
          letterSpacing={3}
          uppercase
          color={ribbon ? ink : 'currentColor'}
          ribbon={ribbon}
          ribbonColor="#a3e635"
          ribbonWidth={size * 1.5}
          pauseOnHover
          scrollBoost={0}
        />
      )}
    </div>
  );
}

/* ---- about ------------------------------------------------------------- */

export function About() {
  return (
    <section className="section" id="about">
      <div className="container">
        <SectionHead index="01" title="ABOUT" />
        <div className="about-grid">
          <div className="about-photo" data-parallax={34}>
            <DiffusionPortrait src="assets/portrait.jpg" alt={`${person.name} portrait`} />
            <p className="privacy-note mono">this is a fake photo used for privacy reasons</p>
          </div>
          <div className="about-copy">
            {bio.map(p => (
              <p key={p.slice(0, 16)}>{p}</p>
            ))}
            <div className="facts mono">
              {facts.map(([k, v]) => (
                <div key={k} className="fact-row">
                  <span className="dim">$ {k}</span>
                  <span>{v}</span>
                </div>
              ))}
              <div className="fact-row">
                <span className="dim">$ loc</span>
                <span>{person.location}</span>
              </div>
            </div>
            <div className="stats-row">
              {stats.map(([n, label]) => (
                <div key={label} className="stat reveal" data-parallax={-14}>
                  <span className="stat-n">{n}</span>
                  <span className="mono dim stat-l">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---- projects ------------------------------------------------------------ */

export function Projects() {
  return (
    <section className="section" id="work">
      <div className="container">
        <SectionHead index="02" title="SELECTED WORK" />
        <p className="sec-note mono dim reveal">
          {'// six things i\'m not tired of talking about — full list on github'}
        </p>
        <div className="proj-grid">
          {projects.map((p, i) => (
            <a
              key={p.name}
              className="proj-card reveal"
              href={p.href}
              data-parallax={i % 2 === 0 ? 26 : -26}
              data-parallax-rot={i % 2 === 0 ? 0.6 : -0.6}
            >
              <div className="proj-top mono">
                <span className="proj-repo">⌥ {p.name}</span>
                <span className="proj-stars dim">★ {p.stars}</span>
              </div>
              <p className="proj-desc">{p.desc}</p>
              <div className="proj-meta mono">
                <span className="tags">
                  {p.tags.map(t => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </span>
                <span className="proj-lang dim">
                  <i className="lang-dot" style={{ background: p.dot }} />
                  {p.lang}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- experience ------------------------------------------------------------ */

export function Experience() {
  return (
    <section className="section" id="xp">
      <div className="container">
        <SectionHead index="03" title="EXPERIENCE" />
        <div className="xp-list">
          {experience.map((x, i) => (
            <div
              key={x.org}
              className="xp-item reveal"
              data-parallax={i % 2 === 0 ? 18 : -18}
            >
              <span className="xp-dot" aria-hidden="true" />
              <span className="xp-period mono dim">{x.period}</span>
              <div className="xp-body">
                <h3>
                  {x.role} <span className="xp-org">@ {x.org}</span>
                </h3>
                <p className="dim">{x.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- contact (ParticleText) ------------------------------------------------- */

export function Contact() {
  const wrapRef = useRef(null);
  const inView = useInView(wrapRef, { threshold: 0.35, rootMargin: '0px 0px -10% 0px' });
  return (
    <section className="section contact" id="contact">
      <div className="container">
        <span className="sec-index mono dim">04</span>
        <div className="pt-wrap" ref={wrapRef}>
          {inView ? (
            <ParticleText
              text="LET'S TALK"
              particleSize={2.6}
              density={4}
              highlightColor="#a3e635"
              highlightMode="motion"
              intro="gather"
              clickBurst
              burstStrength={1}
              pointerRepel={46}
              repelRadius={130}
              idleDrift={0.7}
              glow
              className="pt-main"
            />
          ) : (
            <div className="pt-placeholder mono dim" aria-hidden="true">
              LET'S TALK
            </div>
          )}
        </div>
        <p className="contact-line mono dim">{'// have an idea that needs to exist? my inbox compiles.'}</p>
        <div className="contact-ctas">
          <a className="btn" href={`mailto:${person.email}`}>
            {person.email}
          </a>
        </div>
        <div className="socials mono">
          {socials.map(([label, text, href]) => (
            <a key={label} href={href} className="social">
              <span className="dim">[{label}]</span> {text}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---- footer ------------------------------------------------------------------ */

export function Footer() {
  return (
    <footer className="footer mono dim">
      <span>© 2026 {person.name.toLowerCase()} · {person.handle}.dev</span>
      <span>no cookies, no trackers, just pixels — react + canvas + too much coffee</span>
      <span className="footer-disclaimer">this is just a fake demo site — nothing here is real</span>
      <a href="#top">cd ~ ↑</a>
    </footer>
  );
}
