import { useScrollReveal } from '../hooks/useScrollReveal';
import './Projects.css';

const PROJECTS = [
  {
    name: 'Semantic Log Detector',
    tag: 'AI-Augmented SOC Engine',
    desc: 'A hybrid intrusion detection pipeline — LightGBM flow classifier, Sentence-BERT for semantic log understanding, Isolation Forest for anomaly scoring, plus a rule engine, all mapped straight to MITRE ATT&CK. 0.999 ROC-AUC on CIC-IDS2017. Your firewall logs wish they were this well understood.',
    stack: ['Python', 'FastAPI', 'LightGBM', 'Sentence-BERT'],
    url: 'https://github.com/ghostreindeer09/semantic-log-detector',
  },
  {
    name: 'Stego Detector',
    tag: 'Steganalysis / Deep Learning',
    desc: 'A leakage-free SRNet pipeline that catches LSB steganography hidden in images across 4 embedding algorithms. 98.4% accuracy, 0.9994 AUC, trained on 131K OpenImages — and it still got 90% right on images it had never seen. That photo is hiding something, and so is whatever you uploaded.',
    stack: ['PyTorch', 'SRNet', 'CUDA', 'Streamlit'],
    url: 'https://github.com/ghostreindeer09/stego-detector',
  },
  {
    name: 'NetSage ML',
    tag: 'Network Anomaly Detection',
    desc: 'Real-time network anomaly detection with zero IDS or packet capture involved — just Kafka streaming flow telemetry into Isolation Forest, DBSCAN, and an optional AutoEncoder, with MongoDB persistence and a live React dashboard. Built as part of a hackathon team effort.',
    stack: ['Kafka', 'FastAPI', 'MongoDB', 'scikit-learn'],
    url: 'https://github.com/ghostreindeer09/netsage-ml',
  },
  {
    name: 'Ecom Support Resolution Agent',
    tag: 'Multi-Agent RAG System',
    desc: "Six agents, one job: resolve e-commerce support tickets without making things up. Hybrid BM25 + FAISS retrieval over a 28-document policy corpus, cross-encoder reranking, and evidence-only generation — every claim traces back to a real policy chunk. Fraud signals and regional law always escalate, no exceptions, no agent override.",
    stack: ['Python', 'FAISS', 'RAG', 'Multi-Agent'],
    url: 'https://github.com/ghostreindeer09/ecom-support-resolution-agent',
  },
];

export default function Projects() {
  const [ref, visible] = useScrollReveal();

  return (
    <section className="projects" id="projects">
      <div className="container">
        <p className="projects__eyebrow">// projects</p>
        <h2 className="projects__heading">Proof, since you<br />probably want some.</h2>

        <div ref={ref} className={`projects__grid ${visible ? 'is-visible' : ''}`}>
          {PROJECTS.map((p, i) => (
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="project-card"
              key={p.name}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="project-card__top">
                <span className="project-card__tag">{p.tag}</span>
                <span className="project-card__index">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="project-card__name">{p.name}</h3>
              <p className="project-card__desc">{p.desc}</p>
              <ul className="project-card__stack">
                {p.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <span className="project-card__link">View source &rarr;</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
