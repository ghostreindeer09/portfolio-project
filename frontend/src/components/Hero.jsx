import { useEffect, useState } from 'react';
import { useStickyScroll } from '../hooks/useStickyScroll';
import './Hero.css';

const TEXT_A = 'I build things\nthat actually\nwork.';
const TEXT_B = "Hi, I'm Rishit.\nYes, that good.\nLet's get to it.";
const MAX_LEN = Math.max(TEXT_A.length, TEXT_B.length);
const PADDED_A = TEXT_A.padEnd(MAX_LEN, ' ');
const PADDED_B = TEXT_B.padEnd(MAX_LEN, ' ');

export default function Hero() {
  const [loaded, setLoaded] = useState(false);
  const [wrapperRef, progress] = useStickyScroll();

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Character-by-character reveal: as progress moves through the transition
  // window, revealIndex climbs from 0 to MAX_LEN. Every character before
  // that index shows text B (the greeting); every character at or after it
  // still shows text A (the original headline). This is a hard swap per
  // character, not a fade — the "morph" comes from many small swaps
  // happening in sequence as you scroll, left to right, top to bottom.
  const transitionStart = 0.3;
  const transitionEnd = 0.75;
  const rawReveal = (progress - transitionStart) / (transitionEnd - transitionStart);
  const revealProgress = Math.max(0, Math.min(1, rawReveal));
  const revealIndex = Math.floor(revealProgress * MAX_LEN);

  const displayChars = [];
  for (let i = 0; i < MAX_LEN; i++) {
    displayChars.push(i < revealIndex ? PADDED_B[i] : PADDED_A[i]);
  }

  // Subtext and buttons still just fade out as the transition begins —
  // they're not part of the character-swap, they just clear the way.
  const restOpacity = 1 - Math.max(0, Math.min(1, (progress - 0.15) / 0.2));

  const morphedText = displayChars.join('');
  const morphedLines = morphedText.split('\n');

  return (
    <div ref={wrapperRef} className="hero-sticky-wrapper">
      <section className={`hero ${loaded ? 'hero--loaded' : ''}`}>
        <div className="hero__noise" aria-hidden="true" />
        <div className="container hero__inner">
          <p className="hero__eyebrow" style={{ opacity: restOpacity }}>PORTFOLIO &mdash; v2026</p>
          <h1 className="hero__headline hero__headline--morph">
            {morphedLines.map((line, i) => (
              <span
                className={`hero__line ${i === morphedLines.length - 1 ? 'hero__line--accent' : ''}`}
                key={i}
              >
                {line}
              </span>
            ))}
          </h1>
          <p className="hero__sub" style={{ opacity: restOpacity }}>
            Most developers ship bugs with a changelog attached. I ship software.
            Scroll down to see proof &mdash; or hand me your website and I'll show you
            exactly where it falls apart.
          </p>
          <div className="hero__actions" style={{ opacity: restOpacity }}>
            <a href="#projects" className="hero__btn hero__btn--primary">See the work</a>
            <a href="#roast" className="hero__btn hero__btn--ghost">Get roasted</a>
          </div>
        </div>
        <div
          className="hero__scroll-cue"
          aria-hidden="true"
          style={{ opacity: 1 - Math.min(progress / 0.15, 1) }}
        >
          <span />
        </div>
      </section>
    </div>
  );
}
