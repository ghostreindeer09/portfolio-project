import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import fetch from 'node-fetch';

import { validateAndResolveUrl, UrlValidationError } from './ssrfGuard.js';
import { analyzeHtml, MAX_HTML_BYTES } from './analyzer.js';
import { writeRoast } from './roastWriter.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust the first proxy hop only (needed for correct rate-limit IP detection
// behind a reverse proxy / load balancer). Set to actual hop count in prod.
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// 1. CORS LOCKDOWN — only your own frontend origin(s) may call this API.
// ---------------------------------------------------------------------------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Allow no-origin requests (e.g. curl, server-to-server health checks)
      // but lock down anything with a browser Origin header to the allowlist.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
  })
);

// ---------------------------------------------------------------------------
// 2. Security headers
// ---------------------------------------------------------------------------
app.use(helmet());

// Body size limit — prevents huge payload DoS on the JSON parser itself.
app.use(express.json({ limit: '10kb' }));

// ---------------------------------------------------------------------------
// 3. RATE LIMITING
// ---------------------------------------------------------------------------
// General limiter for all API traffic.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You're hitting this harder than your website hits its performance budget. Slow down." },
});

// Stricter limiter specifically on the expensive roast endpoint
// (it does a network fetch + an LLM call — both cost money and time).
const roastLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Five roasts per 10 minutes. Even I need a breather.' },
});

app.use('/api/', generalLimiter);

// ---------------------------------------------------------------------------
// 4. ROAST ENDPOINT
// ---------------------------------------------------------------------------
app.post(
  '/api/roast',
  roastLimiter,
  [
    // INPUT VALIDATION / SANITIZATION
    body('url')
      .trim()
      .notEmpty()
      .withMessage('URL is required.')
      .isLength({ max: 2048 })
      .withMessage('URL is too long.')
      // Strip anything that isn't plausible URL content; defense in depth
      // beyond the stricter parsing done in ssrfGuard.
      .matches(/^[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/)
      .withMessage('URL contains invalid characters.'),

    // HONEYPOT FIELD — real users/browsers never fill this in because it's
    // hidden from view via CSS in the frontend. Bots that auto-fill every
    // form field will populate it, so a non-empty value flags a bot.
    body('company_website').custom((value) => {
      if (value && value.trim() !== '') {
        throw new Error('Bot detected.');
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // For honeypot trips specifically, pretend success to not tip off bots
      // about what tripped — but don't actually do any work.
      const isHoneypot = errors.array().some((e) => e.path === 'company_website');
      if (isHoneypot) {
        return res.status(200).json({ score: 0, grade: 'F', opener: 'Nice try, bot.', lines: [], closer: '' });
      }
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { url: rawUrl } = req.body;

    let targetUrl;
    try {
      targetUrl = await validateAndResolveUrl(rawUrl);
    } catch (err) {
      if (err instanceof UrlValidationError) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: 'Invalid URL.' });
    }

    // Fetch the target site server-side, with strict limits.
    let html, headers, fetchTimeMs, finalUrl;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const start = Date.now();

      const response = await fetch(targetUrl.toString(), {
        signal: controller.signal,
        redirect: 'follow',
        follow: 3,
        headers: { 'User-Agent': 'RoastBot/1.0 (+portfolio-roast-tool)' },
        size: MAX_HTML_BYTES,
      });

      clearTimeout(timeout);
      fetchTimeMs = Date.now() - start;
      finalUrl = response.url || targetUrl.toString();
      headers = response.headers;

      if (!response.ok) {
        return res.status(400).json({ error: `Target site responded with ${response.status}. Can't roast what won't load.` });
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        return res.status(400).json({ error: "That URL doesn't return an HTML page." });
      }

      html = await response.text();
    } catch (err) {
      if (err.name === 'AbortError') {
        return res.status(400).json({ error: 'Target site took too long to respond.' });
      }
      console.error('Fetch error:', err.message);
      return res.status(400).json({ error: "Couldn't reach that URL." });
    }

    // Real technical analysis.
    const analysis = analyzeHtml({ html, headers, fetchTimeMs, finalUrl });

    // AI-written roast commentary on top of the real findings.
    const roastCopy = await writeRoast({
      url: finalUrl,
      score: analysis.score,
      grade: analysis.grade,
      findings: analysis.findings,
      meta: analysis.meta,
    });

    res.json({
      url: finalUrl,
      score: analysis.score,
      grade: analysis.grade,
      findings: analysis.findings,
      ...roastCopy,
    });
  }
);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Generic error handler (also catches CORS rejection errors thrown above)
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something broke. Probably not as badly as your website though.' });
});

app.listen(PORT, () => {
  console.log(`Roast API listening on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});
