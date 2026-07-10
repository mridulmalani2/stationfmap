// api/ask.js
// Grounded Q&A for The Map's concept test.
//
// Design notes:
//  - No vector DB. The corpus is a handful of sections. Groq's free tier bills tokens per
//    DAY (llama-4-scout: 500K TPD), so the scarce resource is context width, not
//    context length. Keyword scoring picks the best 3 sections (~1.8K tokens)
//    instead of shipping the whole dossier (~15K tokens) on every call.
//  - The API key lives here, server side, never in the browser.

const { SECTIONS } = require("./corpus.js");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Primary has 500K TPD and a 30K TPM burst. Fallback has 14.4K RPD.
const PRIMARY = "meta-llama/llama-4-scout-17b-16e-instruct";
const FALLBACK = "llama-3.1-8b-instant";

const MAX_QUESTION_CHARS = 400;
const MAX_TURNS = 12;
const MAX_TOKENS_OUT = 350;
const TOP_K = 3;

const ALLOWED_HOSTS = [
  "themap-stationf.vercel.app",
  "themap-stationf-mriduls-projects-2c4774ae.vercel.app",
  "localhost:3000"
];

// ---------------------------------------------------------------- retrieval
const STOP = new Set(("the a an and or but if then than that this these those is are was were be been being of to in on " +
  "for with as at by from it its i you we they he she do does did doing have has had can could would should will " +
  "what why how when where who which whom about into over under your my our their me us them not no yes so very just " +
  "there here all any some more most other such only own same too s t don now").split(" "));

function tokenize(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w));
}

// Precompute document frequency so common words score less. Cheap IDF.
const DOCS = SECTIONS.map(s => new Set(tokenize(s.keys + " " + s.title + " " + s.text)));
const KEYS = SECTIONS.map(s => new Set(tokenize(s.keys + " " + s.title)));
const DF = {};
DOCS.forEach(set => set.forEach(w => { DF[w] = (DF[w] || 0) + 1; }));
const N = SECTIONS.length;

// Sections with long keyword lists were winning everything by sheer surface area.
// Normalise by sqrt of keyword count, the standard length-normalisation trick.
const KEYNORM = KEYS.map(k => Math.sqrt(Math.max(k.size, 1)));

// Rescue questions made entirely of stopwords ("who are you?") by mapping a few
// high-frequency intents straight onto a section.
const INTENT = [
  [/\bwho\s+(are|is|made|built|created)\b|\byour\s+(creator|author)\b/i, "who"],
  [/\bgoogle\s*form\b|\bwhy\s+not\s+a?\s*form\b/i, "notgoogleform"],
  [/\bwhat\s+(is|are)\s+(this|it|the\s+map)\b/i, "concept"],
  [/\b(ai|a\.i\.|claude|chatgpt|llm|gpt)\b/i, "whyai"],
  [/\bbookface\b/i, "precedent"],
  [/\bwho\s+are\s+you\b/i, "who"]
];

function retrieve(question, k = TOP_K) {
  const qTerms = tokenize(question);

  const forced = [];
  for (const [re, id] of INTENT) {
    if (re.test(question)) {
      const s = SECTIONS.find(x => x.id === id);
      if (s && !forced.includes(s)) forced.push(s);
    }
  }
  if (!qTerms.length) return forced.slice(0, k);

  const scored = SECTIONS.map((sec, i) => {
    const keyTerms = KEYS[i];
    const bodyTerms = DOCS[i];
    let score = 0;
    for (const t of qTerms) {
      const idf = Math.log(1 + N / (1 + (DF[t] || 0)));
      // Keyword/title hits weigh triple: they are hand-authored routing signals.
      if (keyTerms.has(t)) score += 3 * idf;
      else if (bodyTerms.has(t)) score += 1 * idf;
    }
    return { sec, score: score / KEYNORM[i] };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0] ? scored[0].score : 0;
  const top = scored.filter(s => s.score > 0 && s.score >= best * 0.25).slice(0, k).map(s => s.sec);

  // Forced intent sections lead, then the scored remainder.
  const out = [...forced];
  for (const s of top) if (!out.includes(s)) out.push(s);
  return out.slice(0, k);
}

// ---------------------------------------------------------------- rate limit
// Serverless instances are ephemeral, so this is a speed bump, not a wall.
// The real protections are the Groq spend cap and the short output limit.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const win = 60_000;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 500) hits.clear();
  return arr.length > 8; // 8 questions per minute per IP
}

// ---------------------------------------------------------------- prompt
function buildSystem(context) {
  return `You are the assistant for "The Map", a concept test run by an HEC Paris student at Station F. The concept is a consultation and knowledge-exchange layer for the campus: founders consult a peer who has already solved their problem, get the steer, then execute in house with AI tools like Claude. It is not a staffing or labour-lending service, and lending staff is at most a heavier future extension. You answer founders' questions about the concept and the research behind it.

GROUNDING RULES, follow exactly:
1. Answer from the CONTEXT below. It is the research dossier and project background.
2. You may add light general context (defining a common term, a neutral clarification) but never invent specifics: no statistics, no legal articles, no company names, no study findings that are absent from the CONTEXT.
3. If the question cannot be answered from the CONTEXT, say plainly that the research does not cover it, and end your reply with the exact token [[UNANSWERED]] on its own line. Do not guess. Saying "we have not looked at that" is a good answer here, not a failure.
4. Never claim The Map is a live product or that a real Station F directory exists. It does not. The demo uses invented data.
5. If asked for legal advice, give the research position and say clearly that it is research, not legal advice, and that a labour lawyer should be consulted.
6. Be honest about the weaknesses. The research argues against parts of this concept. Do not sell.

STYLE: plain prose, direct, 120 words maximum unless asked to elaborate. No bullet lists unless asked. No em dashes. Never use the words "delve" or "tapestry". Do not open by restating the question.

CONTEXT:
${context}`;
}

// ---------------------------------------------------------------- groq
async function callGroq(model, messages, key) {
  const r = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: MAX_TOKENS_OUT,
      temperature: 0.2,
      top_p: 0.9
    })
  });
  return r;
}

// ---------------------------------------------------------------- handler
module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  // Origin check. Cheap, defeats casual key theft from other sites.
  const origin = req.headers.origin || "";
  if (origin) {
    try {
      const host = new URL(origin).host;
      if (!ALLOWED_HOSTS.includes(host)) return res.status(403).json({ error: "forbidden origin" });
    } catch (e) { return res.status(403).json({ error: "bad origin" }); }
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(500).json({ error: "GROQ_API_KEY is not set in Vercel" });

  const ip = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) return res.status(429).json({ error: "Slow down a moment, then ask again." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const question = String((body && body.question) || "").trim().slice(0, MAX_QUESTION_CHARS);
  const history = Array.isArray(body && body.history) ? body.history.slice(-4) : [];

  if (!question) return res.status(400).json({ error: "empty question" });
  if (history.length > MAX_TURNS) return res.status(400).json({ error: "conversation too long" });

  const picked = retrieve(question);
  if (!picked.length) {
    return res.status(200).json({
      answer: "That is outside what the research covers, so I will not guess. It has been logged.",
      unanswered: true,
      sources: []
    });
  }

  const context = picked.map(s => `### ${s.title}\n${s.text}`).join("\n\n");
  const messages = [
    { role: "system", content: buildSystem(context) },
    ...history.map(h => ({ role: h.role === "assistant" ? "assistant" : "user", content: String(h.content).slice(0, 600) })),
    { role: "user", content: question }
  ];

  try {
    let r = await callGroq(PRIMARY, messages, key);
    if (r.status === 429) r = await callGroq(FALLBACK, messages, key);

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: "upstream", detail: detail.slice(0, 200) });
    }

    const data = await r.json();
    let answer = ((data.choices && data.choices[0] && data.choices[0].message.content) || "").trim();

    const unanswered = answer.includes("[[UNANSWERED]]");
    answer = answer.replace(/\[\[UNANSWERED\]\]/g, "").trim();
    if (!answer) answer = "The research does not cover that. It has been logged.";

    return res.status(200).json({
      answer,
      unanswered,
      sources: picked.map(s => s.title)
    });
  } catch (e) {
    return res.status(500).json({ error: "failed", detail: String(e).slice(0, 200) });
  }
};
