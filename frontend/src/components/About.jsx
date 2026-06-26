import { useScrollReveal } from '../hooks/useScrollReveal';
import { useStickyScroll } from '../hooks/useStickyScroll';
import './About.css';

export default function About() {
  const [ref, visible] = useScrollReveal();
  const [wrapperRef, progress] = useStickyScroll();

  const contentOpacity = 1 - Math.min(progress / 0.7, 1);
  const contentScale = 1 - progress * 0.08;
  const contentLift = progress * -40;

  return (
    <div ref={wrapperRef} className="about-sticky-wrapper">
      <section className="about" id="about">
        <div className="about__glow" aria-hidden="true" />
        <div
          className="container"
          style={{
            opacity: contentOpacity,
            transform: `scale(${contentScale}) translate3d(0, ${contentLift}px, 0)`,
          }}
        >
          <div ref={ref} className={`about__inner ${visible ? 'is-visible' : ''}`}>
            <p className="about__eyebrow">// about</p>
            <h2 className="about__heading">
              I'm not modest.<br />I'm just <span className="about__accent">accurate.</span>
            </h2>
            <div className="about__body">
              <p>
                I've spent years writing software that doesn't fall over the moment
                real traffic shows up. While other people are still debating tabs
                versus spaces, I'm shipping things that work the first time &mdash;
                and the hundredth.
              </p>
              <p>
                I don't say this to be difficult. I say it because every project
                below is proof, and the roast tool at the bottom of this page
                is a free audit of your own. Use it. I'll wait.
              </p>
            </div>
            <ul className="about__stats">
              <li>
                <span className="about__stat-number">404</span>
                <span className="about__stat-label">patience for bad code, not found</span>
              </li>
              <li>
                <span className="about__stat-number">0</span>
                <span className="about__stat-label">unnecessary dependencies tolerated</span>
              </li>
              <li>
                <span className="about__stat-number">100%</span>
                <span className="about__stat-label">confidence, even when wrong</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
