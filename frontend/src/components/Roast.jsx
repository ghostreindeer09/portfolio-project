import { useState, useRef } from 'react';
import './Roast.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function gradeColor(grade) {
  if (grade === 'A' || grade === 'B') return 'var(--good)';
  if (grade === 'C') return '#e8c547';
  return 'var(--danger)';
}

export default function Roast() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  // Honeypot field value — real users never touch this.
  const honeypotRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus('loading');
    setErrorMsg('');
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/roast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          company_website: honeypotRef.current?.value || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Something went wrong.');
        setStatus('error');
        return;
      }

      setResult(data);
      setStatus('done');
    } catch (err) {
      setErrorMsg("Couldn't reach the roast engine. Try again in a moment.");
      setStatus('error');
    }
  }

  return (
    <section className="roast" id="roast">
      <div className="container">
        <p className="roast__eyebrow">// the roast</p>
        <h2 className="roast__heading">
          Drop your URL.<br />
          <span className="roast__accent">I'll tell you what's wrong with it.</span>
        </h2>
        <p className="roast__sub">
          Real technical audit, zero sugar-coating. Free to find out what's broken &mdash;
          you only pay if you want it fixed.
        </p>

        <form className="roast__form" onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="url"
            placeholder="yourshamefulwebsite.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="roast__input"
            aria-label="Website URL to roast"
            required
          />

          {/* Honeypot field: hidden from real users via CSS, but present in the DOM.
              Bots that auto-fill all fields will populate this; humans never see it. */}
          <input
            type="text"
            name="company_website"
            ref={honeypotRef}
            className="roast__honeypot"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <button type="submit" className="roast__submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Analyzing...' : 'Roast me'}
          </button>
        </form>

        {status === 'error' && (
          <p className="roast__error">{errorMsg}</p>
        )}

        {status === 'loading' && (
          <div className="roast__terminal roast__terminal--loading">
            <TerminalLines lines={['Fetching target...', 'Parsing markup...', 'Running checks...', 'Writing commentary...']} />
          </div>
        )}

        {status === 'done' && result && (
          <div className="roast__terminal roast__report">
            <div className="roast__stamp" style={{ '--stamp-color': gradeColor(result.grade) }}>
              <span className="roast__stamp-grade">{result.grade}</span>
              <span className="roast__stamp-score">{result.score}/100</span>
            </div>

            <p className="roast__url">$ roast {result.url}</p>
            <p className="roast__opener">{result.opener}</p>

            <ul className="roast__findings">
              {(result.lines || []).map((line, i) => (
                <li key={i} className="roast__finding" style={{ animationDelay: `${0.3 + i * 0.12}s` }}>
                  <span className="roast__finding-marker">&gt;</span> {line}
                </li>
              ))}
            </ul>

            {result.closer && <p className="roast__closer">{result.closer}</p>}

            <div className="roast__cta">
              <p>Roasting is free. Fixing them isn't.</p>
              <a href="#contact" className="roast__cta-btn">Contact me to fix these issues</a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TerminalLines({ lines }) {
  return (
    <ul className="roast__loading-lines">
      {lines.map((line, i) => (
        <li key={line} style={{ animationDelay: `${i * 0.5}s` }}>
          <span className="roast__finding-marker">&gt;</span> {line}
        </li>
      ))}
    </ul>
  );
}
