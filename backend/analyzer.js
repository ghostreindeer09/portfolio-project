import * as cheerio from 'cheerio';

/**
 * Performs real, mechanical checks against a page's HTML and response metadata.
 * No AI involved here — these are deterministic, defensible findings.
 * The AI roast layer (roastWriter.js) writes commentary ON TOP of this data,
 * so the snark stays grounded in something true.
 */

const MAX_HTML_BYTES = 5 * 1024 * 1024; // 5MB cap, also enforced at fetch time

export function analyzeHtml({ html, headers, fetchTimeMs, finalUrl }) {
  const $ = cheerio.load(html);
  const findings = [];
  let score = 100;

  const deduct = (points, message, severity = 'minor') => {
    score -= points;
    findings.push({ message, severity, points });
  };

  // --- Title tag ---
  const title = $('title').first().text().trim();
  if (!title) {
    deduct(12, 'No <title> tag. Search engines and browser tabs both have no idea what this page is.', 'major');
  } else if (title.length > 60) {
    deduct(4, `Title tag is ${title.length} characters. Anything past ~60 gets truncated in search results.`, 'minor');
  } else if (title.length < 10) {
    deduct(4, 'Title tag is so short it says nothing useful.', 'minor');
  }

  // --- Meta description ---
  const metaDesc = $('meta[name="description"]').attr('content')?.trim();
  if (!metaDesc) {
    deduct(8, 'No meta description. Google will just make one up, badly.', 'major');
  } else if (metaDesc.length > 160) {
    deduct(3, 'Meta description is too long and will get cut off in search results.', 'minor');
  }

  // --- Viewport / mobile ---
  const viewport = $('meta[name="viewport"]').attr('content');
  if (!viewport) {
    deduct(10, 'No viewport meta tag. This site probably looks broken on every phone.', 'major');
  }

  // --- Headings structure ---
  const h1s = $('h1');
  if (h1s.length === 0) {
    deduct(8, 'Zero <h1> tags. No clear statement of what this page is even about.', 'major');
  } else if (h1s.length > 1) {
    deduct(3, `${h1s.length} <h1> tags on one page. Pick one headline, this isn't a ransom note.`, 'minor');
  }

  // --- Images without alt text ---
  const images = $('img');
  const imagesWithoutAlt = images.filter((_, el) => !$(el).attr('alt')?.trim()).length;
  if (images.length > 0 && imagesWithoutAlt > 0) {
    const ratio = imagesWithoutAlt / images.length;
    const pts = Math.min(15, Math.round(ratio * 20));
    deduct(
      pts,
      `${imagesWithoutAlt} of ${images.length} images have no alt text. Screen reader users get nothing.`,
      ratio > 0.5 ? 'major' : 'minor'
    );
  }

  // --- Inline styles (maintainability smell, not a hard rule but worth a jab) ---
  const inlineStyleCount = $('[style]').length;
  if (inlineStyleCount > 15) {
    deduct(5, `${inlineStyleCount} elements with inline styles. Someone's never heard of a stylesheet.`, 'minor');
  }

  // --- Render-blocking scripts in <head> without defer/async ---
  const blockingScripts = $('head script[src]').filter((_, el) => {
    const attrs = $(el).attr();
    return !('defer' in attrs) && !('async' in attrs) && attrs.type !== 'module';
  }).length;
  if (blockingScripts > 0) {
    deduct(
      Math.min(10, blockingScripts * 3),
      `${blockingScripts} render-blocking script${blockingScripts > 1 ? 's' : ''} in <head> with no defer/async. The page is waiting around for no reason.`,
      'major'
    );
  }

  // --- HTML payload size ---
  const htmlBytes = Buffer.byteLength(html, 'utf-8');
  if (htmlBytes > 500_000) {
    deduct(8, `HTML document is ${(htmlBytes / 1024).toFixed(0)}KB before a single asset loads. That's a lot of markup to ship.`, 'major');
  } else if (htmlBytes > 200_000) {
    deduct(3, `HTML document is ${(htmlBytes / 1024).toFixed(0)}KB. Getting chunky.`, 'minor');
  }

  // --- Response time ---
  if (fetchTimeMs > 3000) {
    deduct(10, `Server took ${(fetchTimeMs / 1000).toFixed(1)}s just to respond. Visitors left before this finished loading.`, 'major');
  } else if (fetchTimeMs > 1500) {
    deduct(4, `Server took ${(fetchTimeMs / 1000).toFixed(1)}s to respond. Not great.`, 'minor');
  }

  // --- HTTPS check ---
  if (finalUrl.startsWith('http://')) {
    deduct(10, "Site is served over plain HTTP, not HTTPS. It's 2026.", 'major');
  }

  // --- Security headers (informational, mild jabs) ---
  const csp = headers.get?.('content-security-policy');
  if (!csp) {
    deduct(3, 'No Content-Security-Policy header. Not fatal, but no extra protection against injected content either.', 'minor');
  }

  // --- Favicon ---
  const favicon = $('link[rel*="icon"]').length;
  if (favicon === 0) {
    deduct(2, 'No favicon. Default grey tab icon, very memorable.', 'minor');
  }

  // --- Open Graph tags (social preview) ---
  const ogTitle = $('meta[property="og:title"]').length;
  if (ogTitle === 0) {
    deduct(4, "No Open Graph tags. Share this link on social media and it'll look like a broken link card.", 'minor');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Sort findings worst-first so the roast leads with the biggest problems.
  findings.sort((a, b) => b.points - a.points);

  return {
    score,
    grade: scoreToGrade(score),
    findings,
    meta: {
      title: title || null,
      htmlBytes,
      fetchTimeMs,
      imageCount: images.length,
      imagesWithoutAlt,
      h1Count: h1s.length,
    },
  };
}

function scoreToGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export { MAX_HTML_BYTES };
