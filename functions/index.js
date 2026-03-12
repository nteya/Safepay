// functions/index.js
const express = require("express");
const cors = require("cors");
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions, logger } = require("firebase-functions/v2");
const OpenAI = require("openai");
const admin = require("firebase-admin");
const pdfParse = require("pdf-parse");

// ---- Cloud Function config
setGlobalOptions({
  region: "us-central1",
  timeoutSeconds: 30,
  memory: "512MiB",
  secrets: ["OPENAI_API_KEY"],
});

// ---- Firebase Admin
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ---- Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "8mb" })); // allow base64 files

// ---- OpenAI client (lazy singleton)
let openaiClient = null;
function getOpenAI() {
  if (!openaiClient) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return null;
    openaiClient = new OpenAI({ apiKey: key });
  }
  return openaiClient;
}

// ---- Session helpers with 20-min TTL
const MINUTES_TO_LIVE = 20;
function ttlTimestamp(minutes) {
  return admin.firestore.Timestamp.fromDate(new Date(Date.now() + minutes * 60 * 1000));
}
async function loadSession(sessionId) {
  const ref = db.collection("ai_sessions").doc(sessionId);
  const snap = await ref.get();
  return snap.exists ? { ref, data: snap.data() } : { ref, data: null };
}
async function touchSession(ref, patch = {}) {
  await ref.set(
    {
      ...patch,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      expireAt: ttlTimestamp(MINUTES_TO_LIVE),
    },
    { merge: true }
  );
}
async function saveMessage(sessionRef, role, content, extra = {}) {
  const msgRef = sessionRef.collection("messages").doc();
  await msgRef.set({
    role,                                   // "user" | "assistant"
    content,                                // string
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expireAt: ttlTimestamp(MINUTES_TO_LIVE),
    ...extra,
  });
}
async function getRecentTranscript(sessionRef, limit = 10) {
  const snap = await sessionRef
    .collection("messages")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  const turns = [];
  snap.forEach((d) => turns.push(d.data()));
  turns.reverse(); // chronological

  return turns.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: typeof m.content === "string" ? m.content.slice(0, 3000) : JSON.stringify(m.content).slice(0, 3000),
  }));
}

// ---- Intent / Topic heuristics (same as yours)
function detectSafetyIntent(text) {
  const t = (text || "").toLowerCase();
  const hasUrl = /https?:\/\/\S+/i.test(t);
  const safetyWords = /(scam|safe|legit|fraud|phish|suspicious|verify|website|seller|payment|pay|eft|crypto|gift\s*card|otp|parcel|courier)/i.test(t);
  const patternNewCheck = /\bis\s+.+\b(scam|legit|safe|trustworthy)\b/i.test(t);
  return { isSafety: hasUrl || safetyWords || patternNewCheck, hasUrl, patternNewCheck };
}
function looksLikeNewTopic(text, prevTopic = "") {
  const t = (text || "").toLowerCase();
  const { patternNewCheck } = detectSafetyIntent(t);
  if (patternNewCheck) return true;
  const url = (t.match(/https?:\/\/\S+/i) || [null])[0];
  if (url && !prevTopic.includes(url)) return true;
  if (/\b(is|are)\b.+\b(scam|legit|safe|trustworthy)\b/i.test(t)) return true;
  return false;
}

// ---- Route: conversational safety assistant WITH file support
app.post("/ai-check", async (req, res) => {
  try {
    let { text = "", sessionId = null, uid = null, file = null } = req.body || {};
    text = String(text || "").trim();

    if (!sessionId) {
      sessionId = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    // Load or create session
    const { ref: sessionRef, data: sessionData } = await loadSession(sessionId);
    const state =
      sessionData?.state || {
        uid: uid || null,
        greeted: false,
        lastMode: "general",
        topic: "",
      };

    // Topic/intent routing
    const isGreeting = /\b(hi|hello|hey|morning|afternoon|evening)\b/i.test(text);
    const { isSafety } = detectSafetyIntent(text);
    const newTopic = looksLikeNewTopic(text, state.topic || "");

    if (newTopic) {
      state.topic = text.slice(0, 120);
      state.lastMode = "safety";
    } else if (isSafety) {
      state.lastMode = "safety";
    } else if (file) {
      state.lastMode = "safety";
      state.topic = "File analysis";
    } else {
      state.lastMode = "general";
    }

    await touchSession(sessionRef, {
      state,
      createdAt: sessionData?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      uid: state.uid || uid || null,
    });

    // Persist user/file turn
    if (file) {
      await saveMessage(sessionRef, "user", `[FILE:${file.kind} ${file.mime}]`, { mode: "file" });
    }
    if (text) {
      await saveMessage(sessionRef, "user", text, { mode: state.lastMode });
    }

    // Transcript
    const transcript = await getRecentTranscript(sessionRef, 10);

    const systemPrompt =
      "You are SafeScan, a professional assistant that helps users decide if a payment is safe. " +
      "If an image or PDF is provided, extract the most important facts (amounts, payment method, bank details, URLs, deadlines) and assess risk. " +
      "Be concise, practical, and give a clear next step. Avoid percentages. " +
      "Ask at most 2 focused follow-ups only if needed.";

    const topicHint = state.topic ? `\nCurrent subject: ${state.topic}` : "";
    const oa = getOpenAI();

    let reply =
      isGreeting && !file && !text
        ? "Hi there — how can I help you today?"
        : "I’m here. Share what you’re paying for and what concerns you.";

    // ---- Build OpenAI messages
    const messages = [{ role: "system", content: systemPrompt + topicHint }, ...transcript];

    // Attach file content if present
    if (file && oa) {
      if (file.kind === "image" && file.base64) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: text || "Please extract the key details from this screenshot and assess safety." },
            {
              type: "image_url",
              image_url: { url: `data:${file.mime};base64,${file.base64}` },
            },
          ],
        });
      } else if (file.kind === "pdf" && file.base64) {
        // Parse PDF to text (first ~2MB already in memory)
        const pdfBuffer = Buffer.from(file.base64, "base64");
        const parsed = await pdfParse(pdfBuffer).catch(() => ({ text: "" }));
        const pdfText = (parsed.text || "").slice(0, 12000) || "(no readable text)";
        messages.push({
          role: "user",
          content: `Extract critical details from this PDF and assess safety:\n\n${pdfText}`,
        });
      }
    } else if (!file && text) {
      // Nothing to change — transcript already carries latest text input
    }

    try {
      if (oa) {
        const model = file?.kind === "image" ? "gpt-4o-mini" : "gpt-4o-mini";
        const r = await oa.chat.completions.create({
          model,
          temperature: 0.35,
          max_tokens: 600,
          messages,
        });
        reply = r.choices?.[0]?.message?.content?.trim() || reply;
      }
    } catch (err) {
      logger.error("OpenAI error", err);
    }

    await saveMessage(sessionRef, "assistant", reply, { mode: file ? "file" : "chat" });
    await touchSession(sessionRef, { state });

    return res.json({ mode: file ? "file" : "chat", sessionId, message: reply });
  } catch (e) {
    logger.error(e);
    return res.status(500).json({ error: "AI_CHECK_FAILED" });
  }
});

// Export HTTPS function
exports.api = onRequest(app);


//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//