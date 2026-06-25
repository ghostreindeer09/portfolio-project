import { useEffect, useState } from 'react';
import './Hero.css';

export default function Hero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className={`hero ${loaded ? 'hero--loaded' : ''}`}>
      <div className="hero__noise" aria-hidden="true" />
      <div className="container hero__inner">
        <p className="hero__eyebrow">PORTFOLIO &mdash; v2026</p>
        <h1 className="hero__headline">
          <span className="hero__line">I build things</span>
          <span className="hero__line">that actually</span>
          <span className="hero__line hero__line--accent">work.</span>
        </h1>
        <p className="hero__sub">
          Most developers ship bugs with a changelog attached. I ship software.
          Scroll down to see proof &mdash; or hand me your website and I'll show you
          exactly where it falls apart.
        </p>
        <div className="hero__actions">
          <a href="#projects" className="hero__btn hero__btn--primary">See the work</a>
          <a href="#roast" className="hero__btn hero__btn--ghost">Get roasted</a>
        </div>
      </div>
      <div className="hero__scroll-cue" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
