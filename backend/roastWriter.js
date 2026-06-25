/**
 * Takes real, mechanically-derived findings from analyzer.js and asks
 * an LLM (via Groq's free API) to write the snarky roast copy ON TOP of them.
 * The model is explicitly constrained to only talk about findings we actually
 * detected — this keeps the roast funny but honest instead of making up flaws.
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

  const prompt = `You are a brutally funny, arrogant senior web developer roasting someone's website.
You will ONLY roast the specific technical findings listed below — do not invent issues that
aren't in this list, and do not comment on visual design, colors, or content you cannot see.

Site being roasted: ${url}
Score: ${score}/100 (Grade ${grade})

Real findings detected on this site:
${findingsList || '- No major issues detected. This is rare.'}

Write a roast with this exact structure:
1. One savage opening line (max 20 words) reacting to the overall score.
2. For EACH finding above, one short, punchy, sarcastic sentence (max 25 words) about that specific issue. Stay grounded in the actual finding, just make it funny and cutting.
3. One closing line (max 20 words) that's somehow even more condescending.

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
    A: "Fine. It's good. I'm as surprised as you are.",
    B: "Decent. Not embarrassing. That's the nicest thing I'll say.",
    C: "Mid. Painfully, aggressively mid.",
    D: "Rough. I've seen Geocities pages with more self-respect.",
    F: "I've reviewed crime scenes with less damage than this.",
  };

  return {
    opener: openers[grade] || `Scored a ${score}/100. Let's talk about why.`,
    lines: findings.length
      ? findings.map((f) => f.message)
      : ['Somehow nothing obvious is broken. Suspicious.'],
    closer: 'Anyway. I could fix all of this in an afternoon.',
  };
}
