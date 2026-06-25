import './Contact.css';

const GMAIL_COMPOSE_URL =
  'https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=sharmarishit89@gmail.com';

export default function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="container contact__inner">
        <p className="contact__eyebrow">// get in touch</p>
        <h2 className="contact__heading">
          Found something broken?<br />
          <span className="contact__accent">Let's fix it.</span>
        </h2>
        <p className="contact__sub">
          Whether it's your roast results or just a project you need built right
          the first time &mdash; reach out.
        </p>

        <div className="contact__icons">
          <a
            href="https://github.com/ghostreindeer09"
            target="_blank"
            rel="noreferrer"
            className="contact__icon-link"
            aria-label="GitHub"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.27 5.7.42.36.78 1.07.78 2.16 0 1.56-.01 2.81-.01 3.19 0 .31.21.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
            </svg>
          </a>

          <a
            href="https://www.linkedin.com/in/rishitsharma1/"
            target="_blank"
            rel="noreferrer"
            className="contact__icon-link"
            aria-label="LinkedIn"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
              <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
            </svg>
          </a>

          <a
            href={GMAIL_COMPOSE_URL}
            target="_blank"
            rel="noreferrer"
            className="contact__icon-link"
            aria-label="Email me on Gmail"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
              <path d="M22 5.5v13a1.5 1.5 0 0 1-1.5 1.5H19V8.2l-7 5.4-7-5.4V20H3.5A1.5 1.5 0 0 1 2 18.5v-13A1.5 1.5 0 0 1 3.5 4h.7L12 10.2 19.8 4h.7A1.5 1.5 0 0 1 22 5.5Z" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
