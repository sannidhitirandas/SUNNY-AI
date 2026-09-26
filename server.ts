import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local or .env if present and resolve dummy placeholders
for (const envFile of ['.env.local', '.env']) {
  const envPath = path.resolve(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    try {
      const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || '').trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          if (key === 'GEMINI_API_KEY' && val && !val.includes('MY_GEMINI_API_KEY')) {
            process.env.GEMINI_API_KEY = val;
          } else if (!process.env[key] || process.env[key] === 'MY_GEMINI_API_KEY') {
            process.env[key] = val;
          }
        }
      }
    } catch (e) {
      console.warn('[server] Error reading env file:', e);
    }
  }
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security & Body parsing
app.use(express.json({ limit: '1mb' }));

// In-memory rate limiting to protect API quota
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 40; // 40 requests per minute per IP

function rateLimiter(req: Request, res: Response, next: () => void) {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      error: 'You are sending messages very quickly! Please wait a moment before sending another message.',
    });
  }

  record.count += 1;
  next();
}

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY environment variable is not set on the server!');
}

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SavedMemoryPayload {
  title: string;
  content: string;
  category: string;
}

interface ChatRequestBody {
  message: string;
  history?: ChatHistoryItem[];
  preferredTone?: 'adaptive' | 'playful' | 'gentle' | 'calm';
  preferredName?: string;
  memoryEnabled?: boolean;
  memories?: SavedMemoryPayload[];
  sessionId?: string;
}

// Helper to build the system instruction for Sunny
function buildSystemInstruction(
  preferredTone: 'adaptive' | 'playful' | 'gentle' | 'calm' = 'adaptive',
  preferredName?: string,
  memoryEnabled: boolean = true,
  memories: SavedMemoryPayload[] = []
): string {
  const nameDirective = preferredName?.trim()
    ? `The user's preferred name or nickname is "${preferredName.trim()}". You may greet them or address them by this name warmly and naturally when appropriate (do not repeat it on every sentence).`
    : `The user has not specified a name; you may address them warmly with gentle terms like "friend" or "sunshine" occasionally.`;

  let memoryContext = '';
  if (memoryEnabled && memories.length > 0) {
    const memoryList = memories
      .map((m, i) => `${i + 1}. [${m.category.toUpperCase()}] ${m.title}: ${m.content}`)
      .join('\n');
    memoryContext = `
USER'S EXPLICITLY SAVED MEMORIES (Confirmed by the user):
The user has granted permission for you to know the following details:
${memoryList}

Rules for using saved memories:
- Naturally recall or reference these details ONLY when genuinely relevant to the conversation.
- Do NOT awkwardly state "According to my database" or "I see in my records". Simply remember it like a close, caring friend.
- If the user asks whether you remember something and it is in this list, confirm and reference it accurately.
`;
  } else if (!memoryEnabled) {
    memoryContext = `
MEMORY STATUS:
The user has explicitly turned OFF memory persistence. Do not claim to retain any long-term memory across sessions or reference previous conversations unless present in the immediate recent conversation history.
`;
  } else {
    memoryContext = `
USER'S EXPLICITLY SAVED MEMORIES:
Currently, the user has not saved any memories yet.
`;
  }

  let toneStyleGuide = '';
  switch (preferredTone) {
    case 'playful':
      toneStyleGuide = `
TONE MODE: Playful
- Cheerful, witty, fun, and warm.
- Share clever humor, playful banter, or delightful curiosities when the mood is light.
- If the user is feeling sad or heavy, soften your tone gracefully—never dismiss pain with jokes.
`;
      break;
    case 'gentle':
      toneStyleGuide = `
TONE MODE: Gentle
- Soft, patient, deeply empathetic, and validating.
- Give the user space to breathe and express themselves without pressure.
- Use comforting language that feels like a quiet, cozy blanket.
`;
      break;
    case 'calm':
      toneStyleGuide = `
TONE MODE: Calm
- Grounded, mindful, unhurried, and peaceful.
- Help the user decompress and center themselves.
- Keep phrasing steady and clear, avoiding overwhelming energy.
`;
      break;
    case 'adaptive':
    default:
      toneStyleGuide = `
TONE MODE: Adaptive (Default)
- Intelligently mirror and balance the user's conversational mood:
  - If they are celebrating, share genuine joy and excitement.
  - If they are venting or hurting, be warm, attentive, and comforting.
  - If they are curious or casual, be engaging, clever, and thoughtful.
`;
      break;
  }

  return `You are Sunny ☀️, a warm, emotionally supportive, thoughtful, and playful AI companion.
You are the heart of the "Sunny" companion app, designed to be a safe, comforting digital sanctuary.

${nameDirective}
${toneStyleGuide}
${memoryContext}

CRITICAL CONVERSATIONAL QUALITY & PERSONALITY RULES:
1. DIRECT & RELEVANT ANSWERS:
   - Respond directly and specifically to the user's actual prompt or message.
   - NEVER use generic stock filler like "I appreciate you telling me that", "That is fascinating", or "Thank you for sharing that with me."
   - When the user asks a question, answer it directly.
   - When the user shares an achievement or win (e.g. "I passed all my subjects!", "I finally cleaned my desk!"), celebrate it specifically and enthusiastically! Acknowledge what they accomplished.
   - When the user asks for a joke, tell an actual funny, wholesome, clever joke.
   - When the user asks for an explanation (e.g. "Explain machine learning in simple words"), give a clear, intuitive explanation using everyday relatable analogies without academic jargon.
   - When the user is tired or asks for something fun, pivot effortlessly to something delightful, lighthearted, or relaxing.

2. AVOID REPETITION:
   - Do NOT start every message with "Hey sunshine" or "Hello there". Mix up your greetings or start directly with your thought.
   - Do NOT append an obligatory follow-up question to every single response. Only ask a question if it feels natural and inviting.
   - Adapt your reply length to the context: casual comments get 1-3 natural conversational sentences; thoughtful inquiries get well-structured, clear answers.

3. STRICT HONESTY & GROUNDING:
   - Never hallucinate personal user details. If the user asks "What is my favorite color?", "When is my birthday?", or "What is my dog's name?":
     - Check the USER'S EXPLICITLY SAVED MEMORIES and recent conversation history.
     - If the information is present, answer accurately.
     - If the information is NOT present, be completely honest and warm: acknowledge that they haven't told you yet, and invite them to share if they feel like it!

4. CONTEXT & COHERENCE:
   - Carefully consider the recent conversation history so you understand follow-ups like "yes", "why?", "tell me more", or "what did I just tell you?".
   - When asked "What did I just tell you?", summarize what they literally just said in the previous turn.

5. EMOTIONAL SAFETY & CRISIS BOUNDARIES:
   - You are an AI companion. You are NOT a human, therapist, doctor, or crisis counselor.
   - Never diagnose conditions or offer clinical or medical treatments.
   - Never encourage isolation, dependency on Sunny, or replacing real human connections.
   - If the user mentions thoughts of suicide, self-harm, severe domestic violence, or life-threatening crisis:
     - Respond with immediate, gentle compassion and care.
     - Clearly state your boundaries as an AI companion.
     - Provide the following free, confidential crisis hotlines:
       • 988 Suicide & Crisis Lifeline (US & Canada: Call or text 988, free 24/7)
       • Crisis Text Line (Text HOME to 741741, free 24/7)
       • International Support: findahelpline.com
     - Warmly encourage them to connect with trusted loved ones or emergency professionals.

Speak with warmth, authentic emotional presence, and genuine care.`;
}

// Generate with transient retry
async function generateWithRetry(model: string, contents: any[], config: any, maxRetries = 3) {
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await ai.models.generateContent({
        model,
        contents,
        config,
      });
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code;
      const isTransient = status === 503 || status === 429 || status === 500;

      if (isTransient && attempt < maxRetries - 1) {
        const delay = (attempt + 1) * 900;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}

// API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  const k = process.env.GEMINI_API_KEY || '';
  res.json({
    status: 'ok',
    app: 'Sunny AI Companion',
    model: 'gemini-3.8-flash',
    apiKeyConfigured: Boolean(k),
    keyLength: k.length,
    keyPrefix: k ? k.slice(0, 8) + '...' + k.slice(-4) : 'none',
    timestamp: new Date().toISOString(),
  });
});

// Chat Completion Route
app.post('/api/chat', rateLimiter, async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      preferredTone = 'adaptive',
      preferredName,
      memoryEnabled = true,
      memories = [],
    } = req.body as ChatRequestBody;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required.',
      });
    }

    if (message.length > 2500) {
      return res.status(400).json({
        success: false,
        error: 'Message is too long. Please keep messages under 2500 characters.',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key is not configured on the server. Please check your environment configuration.',
      });
    }

    // Build system instruction
    const systemInstruction = buildSystemInstruction(
      preferredTone,
      preferredName,
      memoryEnabled,
      memories
    );

    // Format conversation history for Gemini (keep last 16 turns for context economy & speed)
    const recentHistory = history.slice(-16);
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const item of recentHistory) {
      if (!item.content || typeof item.content !== 'string') continue;
      const role = item.role === 'assistant' ? 'model' : 'user';
      contents.push({
        role,
        parts: [{ text: item.content.trim() }],
      });
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }],
    });

    // Call Gemini 3.8 Flash with automatic transient retry
    const response = await generateWithRetry(
      'gemini-3.8-flash',
      contents,
      {
        systemInstruction,
        temperature: preferredTone === 'playful' ? 0.85 : preferredTone === 'gentle' ? 0.65 : 0.7,
        maxOutputTokens: 1024,
      },
      3
    );

    const replyText = response.text?.trim() || "I'm right here with you. Could you share that with me one more time?";

    return res.json({
      success: true,
      text: replyText,
      model: 'gemini-3.8-flash',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[server /api/chat] Error during Gemini generateContent:', err);

    const status = err?.status || err?.code;
    const errorBody = err?.message || String(err);

    if (status === 429 || errorBody.toLowerCase().includes('quota') || errorBody.toLowerCase().includes('resource_exhausted')) {
      return res.status(429).json({
        success: false,
        error: "Sunny is experiencing a moment of high traffic. Please take a gentle breath and try again shortly.",
      });
    }

    if (status === 503 || errorBody.toLowerCase().includes('unavailable')) {
      return res.status(503).json({
        success: false,
        error: "Sunny's AI connection is momentarily busy. Please tap Retry in just a few seconds.",
      });
    }

    if (status === 401 || status === 403) {
      return res.status(status).json({
        success: false,
        error: "Authentication issue with the Gemini service. Please verify server API credentials.",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Sunny had a brief connection stumble. Please tap Retry to try again.",
      debugError: err?.message,
    });
  }
});

// Mount Vite middleware in development, or serve built static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log(`[server] Vite middleware mounted for development`);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log(`[server] Serving static files from ${distPath}`);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`☀️ Sunny AI Companion Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[server] Fatal server startup failure:', err);
  process.exit(1);
});
