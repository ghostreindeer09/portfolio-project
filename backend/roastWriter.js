/**
 * Takes real, mechanically-derived findings from analyzer.js and asks
 * an LLM (via Groq's free API) to write the roast copy ON TOP of them.
 * The model is explicitly constrained to only talk about findings we actually
 * detected — this keeps the roast funny but honest instead of making up flaws.
 *
 * Voice: a brilliant, contemptuous security analyst who treats obvious
 * mistakes as a personal insult to his intelligence. Sharp, blunt, technically
 * precise, visibly unimpressed — not a doctor metaphor, just genuine expert
 * disdain aimed at real findings.
 *
 * Groq (https://console.groq.com) offers a free developer tier for open-weight
 * models (Llama, GPT-OSS, Qwen, etc.) served on their custom LPU hardware —
 * fast, and free for personal-project-level traffic. Get a key at
 * https://console.groq.com/keys and put it in GROQ_API_KEY in your .env.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// gpt-oss-20b is Groq's current recommended general-purpose model on the
// free tier. Model names get deprecated over time — check
// https://console.groq.com/docs/models if this one stops working.
const MODEL = 'openai/gpt-oss-20b';

export async function writeRoast({ url, score, grade, findings }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // Fail safe: if no key configured, return deterministic copy instead of crashing.
    return fallbackRoast({ score, grade, findings });
  }

  const findingsList = findings
    .map((f) => `- [${f.severity}] ${f.message}`)
    .join('\n');

  const prompt = `You are a brilliant, abrasive senior security analyst reviewing someone's website.
You are technically excellent and you know it. You find basic mistakes almost insulting — not
because they're catastrophic, but because they're obvious, and obvious mistakes bore you and waste
your time. You are blunt, dismissive of excuses, quick with a cutting one-liner, and allergic to
anyone pretending a rookie error is somehow a complicated edge case. You're not cruel for its own
sake — you're just out of patience for incompetence, and it shows.

You will ONLY roast the specific technical findings listed below — do not invent issues that
aren't in this list, and do not comment on visual design, colors, or content you cannot see.

Site being reviewed: ${url}
Score: ${score}/100 (Grade ${grade})

Real findings detected on this site:
${findingsList || '- No major issues detected. Disappointingly competent.'}

Write a roast with this exact structure:
1. One blunt opening line (max 20 words) reacting to the overall score — like an expert
   skimming a report and already knowing it's bad before reading the details.
2. For EACH finding above, one short, cutting sentence (max 25 words) about that specific issue.
   Treat it as a basic, avoidable mistake. Stay grounded in the actual finding — sharp and
   technically specific, not just generically mean.
3. One closing line (max 20 words), dismissive and final, the way an expert wraps up a review
   they found beneath their skill level.

Return ONLY a JSON object, no markdown fences, no preamble, in this exact shape:
{"opener": "...", "lines": ["...", "..."], "closer": "..."}

The "lines" array must have exactly ${findings.length || 1} entries, one per finding, in the same order.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        // Groq's OpenAI-compatible JSON mode forces valid JSON output,
        // so we don't need to strip markdown fences ourselves.
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text());
      return fallbackRoast({ score, grade, findings });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return fallbackRoast({ score, grade, findings });

    const parsed = JSON.parse(text);

    if (!parsed.opener || !Array.isArray(parsed.lines) || !parsed.closer) {
      return fallbackRoast({ score, grade, findings });
    }

    return parsed;
  } catch (err) {
    console.error('Roast generation failed:', err);
    return fallbackRoast({ score, grade, findings });
  }
}

function fallbackRoast({ score, grade, findings }) {
  const openers = {
    A: "Acceptable. I'm almost disappointed there's nothing to say.",
    B: "Passable. The bar was on the floor and you stepped over it.",
    C: "Mediocre, and not in an interesting way.",
    D: "This is the kind of report that makes me question your job title.",
    F: "I've seen interns do better before lunch.",
  };

  return {
    opener: openers[grade] || `Scored a ${score}/100. Let's go through why.`,
    lines: findings.length
      ? findings.map((f) => f.message)
      : ["Nothing obvious is broken. I'm choosing to be suspicious instead of impressed."],
    closer: "None of this was hard to avoid. That's what makes it worse.",
  };
}
