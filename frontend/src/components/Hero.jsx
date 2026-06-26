import { useEffect, useState } from 'react';
import { useStickyScroll } from '../hooks/useStickyScroll';
import './Hero.css';

export default function Hero() {
  const [loaded, setLoaded] = useState(false);
  const [wrapperRef, progress] = useStickyScroll();

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const contentOpacity = 1 - Math.min(progress / 0.7, 1);
  const contentScale = 1 - progress * 0.12;
  const contentLift = progress * -60;

  return (
    <div ref={wrapperRef} className="hero-sticky-wrapper">
      <section className={`hero ${loaded ? 'hero--loaded' : ''}`}>
        <div className="hero__noise" aria-hidden="true" />
        <div
          className="container hero__inner"
          style={{
            opacity: contentOpacity,
            transform: `scale(${contentScale}) translate3d(0, ${contentLift}px, 0)`,
          }}
        >
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
        <div
          className="hero__scroll-cue"
          aria-hidden="true"
          style={{ opacity: 1 - Math.min(progress / 0.3, 1) }}
        >
          <span />
        </div>
      </section>
    </div>
  );
}
