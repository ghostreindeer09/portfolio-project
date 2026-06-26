import { useScrollReveal } from '../hooks/useScrollReveal';
import { useStickyScroll } from '../hooks/useStickyScroll';
import './Skills.css';

const SKILL_GROUPS = [
  {
    label: 'Languages & Frameworks',
    items: ['Python', 'TypeScript', 'Node.js', 'React', 'FastAPI'],
  },
  {
    label: 'ML / AI Engineering',
    items: ['PyTorch', 'scikit-learn', 'LightGBM', 'Sentence-BERT', 'FAISS', 'RAG Pipelines'],
  },
  {
    label: 'Offensive Security',
    items: ['Burp Suite', 'Metasploit', 'Nmap', 'Kali Linux', 'Wireshark'],
  },
  {
    label: 'Detection & Defense',
    items: ['MITRE ATT&CK', 'SIEM Pipelines', 'Anomaly Detection', 'Steganalysis'],
  },
  {
    label: 'Infrastructure',
    items: ['Docker', 'Kafka', 'MongoDB', 'PostgreSQL', 'AWS'],
  },
];

export default function Skills() {
  const [ref, visible] = useScrollReveal();
  const [wrapperRef, progress] = useStickyScroll();

  const contentOpacity = 1 - Math.min(progress / 0.7, 1);
  const contentScale = 1 - progress * 0.08;
  const contentLift = progress * -40;

  return (
    <div ref={wrapperRef} className="skills-sticky-wrapper">
      <section className="skills" id="skills">
        <div className="skills__glow" aria-hidden="true" />
        <div
          className="container"
          style={{
            opacity: contentOpacity,
            transform: `scale(${contentScale}) translate3d(0, ${contentLift}px, 0)`,
          }}
        >
          <p className="skills__eyebrow">// skills</p>
          <h2 className="skills__heading">
            The toolkit.<br />
            <span className="skills__accent">Use it however makes you uncomfortable.</span>
          </h2>

          <div ref={ref} className={`skills__groups ${visible ? 'is-visible' : ''}`}>
            {SKILL_GROUPS.map((group, i) => (
              <div className="skills__group" key={group.label} style={{ transitionDelay: `${i * 0.08}s` }}>
                <h3 className="skills__group-label">{group.label}</h3>
                <ul className="skills__tags">
                  {group.items.map((item) => (
                    <li key={item} className="skills__tag">{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
